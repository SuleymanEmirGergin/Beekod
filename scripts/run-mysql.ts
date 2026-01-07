import "../env.js";
import fs from "fs";
import os from "os";
import path from "path";
import { spawn, spawnSync } from "child_process";

const args = process.argv.slice(2);
const noPassword = args.includes("--no-password");
let loginPath: string | undefined;
let fileArg: string | undefined;

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === "--no-password") {
    continue;
  }
  if (arg === "--login-path") {
    loginPath = args[i + 1];
    i += 1;
    continue;
  }
  if (arg.startsWith("--login-path=")) {
    loginPath = arg.slice("--login-path=".length);
    continue;
  }
  if (!arg.startsWith("--") && !fileArg) {
    fileArg = arg;
  }
}

if (!loginPath) {
  loginPath = process.env.MYSQL_LOGIN_PATH;
}

function normalizeLoginPath(value?: string) {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  const lowered = trimmed.toLowerCase();
  if (["none", "disabled", "false", "0"].includes(lowered)) {
    return undefined;
  }
  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim() || undefined;
  }
  return trimmed;
}

function stripQuotes(value: string) {
  if (
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function supportsLoginPath(mysqlBin: string) {
  try {
    const result = spawnSync(mysqlBin, ["--help"], { encoding: "utf8" });
    const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
    return output.includes("--login-path");
  } catch {
    return false;
  }
}

function resolveMysqlBin(loginPathValue?: string) {
  const configured = process.env.MYSQL_BIN ? stripQuotes(process.env.MYSQL_BIN) : "mysql";
  if (!loginPathValue) {
    return configured;
  }

  const candidates: string[] = [];
  if (configured) {
    candidates.push(configured);
  }

  const programFiles = process.env.ProgramFiles;
  if (programFiles) {
    const candidate = path.join(programFiles, "MySQL", "MySQL Server 8.0", "bin", "mysql.exe");
    if (!candidates.includes(candidate)) {
      candidates.push(candidate);
    }
  }

  const programFilesX86 = process.env["ProgramFiles(x86)"];
  if (programFilesX86) {
    const candidate = path.join(programFilesX86, "MySQL", "MySQL Server 8.0", "bin", "mysql.exe");
    if (!candidates.includes(candidate)) {
      candidates.push(candidate);
    }
  }

  for (const candidate of candidates) {
    if (candidate !== "mysql" && !fs.existsSync(candidate)) {
      continue;
    }
    if (supportsLoginPath(candidate)) {
      return candidate;
    }
  }

  return configured;
}

function createDefaultsFile(charsetValue: string) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "beekod-mysql-"));
  const filePath = path.join(dir, "my.cnf");
  fs.writeFileSync(filePath, `[client]\ndefault-character-set=${charsetValue}\n`, "utf8");
  return { dir, filePath };
}

if (!fileArg) {
  console.error("Usage: tsx scripts/run-mysql.ts <sql-file> [--login-path name] [--no-password]");
  process.exit(1);
}

const sqlPath = path.resolve(fileArg);
if (!fs.existsSync(sqlPath)) {
  console.error(`SQL file not found: ${sqlPath}`);
  process.exit(1);
}

loginPath = normalizeLoginPath(loginPath);
const mysqlBin = resolveMysqlBin(loginPath);
const mysqlArgs: string[] = [];
const charset = process.env.MYSQL_CHARSET ? process.env.MYSQL_CHARSET.trim() : "";
const effectiveCharset = charset || (loginPath ? "utf8mb4" : "");
let defaultsDir: string | undefined;
let defaultsFile: string | undefined;

if (loginPath && effectiveCharset) {
  const defaults = createDefaultsFile(effectiveCharset);
  defaultsDir = defaults.dir;
  defaultsFile = defaults.filePath;
  mysqlArgs.push(`--defaults-extra-file=${defaultsFile}`);
} else if (!loginPath && effectiveCharset) {
  mysqlArgs.push(`--default-character-set=${effectiveCharset}`);
}

if (loginPath) {
  if (!supportsLoginPath(mysqlBin)) {
    console.error("mysql client does not support --login-path. Set MYSQL_BIN to a MySQL 8 client path.");
    process.exit(1);
  }
  mysqlArgs.push(`--login-path=${loginPath}`);
} else {
  const host = process.env.DB_HOST;
  if (host) {
    mysqlArgs.push("-h", host);
  }

  const port = process.env.DB_PORT;
  if (port) {
    mysqlArgs.push("-P", port);
  }

  const user = process.env.DB_USER || "root";
  mysqlArgs.push("-u", user);

  const password = process.env.DB_PASSWORD;
  if (!noPassword) {
    if (password) {
      mysqlArgs.push(`-p${password}`);
    } else {
      mysqlArgs.push("-p");
    }
  }
}

if (process.env.MYSQL_DEBUG === "true") {
  const version = spawnSync(mysqlBin, ["--version"], { encoding: "utf8" });
  const versionText = `${version.stdout ?? ""}${version.stderr ?? ""}`.trim();
  console.log(`[run-mysql] mysqlBin=${mysqlBin} loginPath=${loginPath ? "yes" : "no"}`);
  if (versionText) {
    console.log(`[run-mysql] mysqlVersion=${versionText}`);
  }
  if (effectiveCharset) {
    console.log(`[run-mysql] charset=${effectiveCharset}`);
  }
  console.log(`[run-mysql] mysqlArgs=${mysqlArgs.join(" ")}`);
}

const child = spawn(mysqlBin, mysqlArgs, { stdio: ["pipe", "inherit", "inherit"] });
fs.createReadStream(sqlPath).pipe(child.stdin);

child.on("exit", (code) => {
  if (defaultsDir) {
    try {
      fs.rmSync(defaultsDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  }
  process.exitCode = code ?? 1;
});

child.on("error", () => {
  if (defaultsDir) {
    try {
      fs.rmSync(defaultsDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  }
});
