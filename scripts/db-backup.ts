import "../env.js";
import fs from "fs";
import path from "path";
import { spawn, spawnSync } from "child_process";

const args = process.argv.slice(2);
const noPassword = args.includes("--no-password");
const noLoginPath = args.includes("--no-login-path");
let loginPath: string | undefined;
let outArg: string | undefined;

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === "--no-password" || arg === "--no-login-path") {
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
  if (!arg.startsWith("--") && !outArg) {
    outArg = arg;
  }
}

if (!loginPath && !noLoginPath) {
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

function resolveDumpBin(loginPathValue?: string) {
  const configuredDump = process.env.MYSQL_DUMP_BIN ? stripQuotes(process.env.MYSQL_DUMP_BIN) : "";
  if (configuredDump) {
    return configuredDump;
  }

  const mysqlBinRaw = process.env.MYSQL_BIN ? stripQuotes(process.env.MYSQL_BIN) : "";
  if (mysqlBinRaw && mysqlBinRaw.toLowerCase().endsWith("mysql.exe")) {
    const candidate = path.join(path.dirname(mysqlBinRaw), "mysqldump.exe");
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  if (!loginPathValue) {
    return "mysqldump";
  }

  const candidates: string[] = [];
  if (mysqlBinRaw) {
    candidates.push(mysqlBinRaw);
  }

  const programFiles = process.env.ProgramFiles;
  if (programFiles) {
    const candidate = path.join(programFiles, "MySQL", "MySQL Server 8.0", "bin", "mysqldump.exe");
    candidates.push(candidate);
  }

  const programFilesX86 = process.env["ProgramFiles(x86)"];
  if (programFilesX86) {
    const candidate = path.join(programFilesX86, "MySQL", "MySQL Server 8.0", "bin", "mysqldump.exe");
    candidates.push(candidate);
  }

  for (const candidate of candidates) {
    if (candidate !== "mysqldump" && !fs.existsSync(candidate)) {
      continue;
    }
    if (supportsLoginPath(candidate)) {
      return candidate;
    }
  }

  return "mysqldump";
}

function timestamp() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(
    now.getMinutes()
  )}${pad(now.getSeconds())}`;
}

const database = process.env.DB_NAME || "beekod";
const outputPath = outArg
  ? path.resolve(outArg)
  : path.resolve("backups", `backup-${database}-${timestamp()}.sql`);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });

loginPath = noLoginPath ? undefined : normalizeLoginPath(loginPath);
const dumpBin = resolveDumpBin(loginPath);
const dumpArgs: string[] = ["--single-transaction", "--quick", "--routines"];
const charset = process.env.MYSQL_CHARSET ? process.env.MYSQL_CHARSET.trim() : "";
const effectiveCharset = charset || "utf8mb4";
if (effectiveCharset) {
  dumpArgs.push(`--default-character-set=${effectiveCharset}`);
}

if (loginPath) {
  if (!supportsLoginPath(dumpBin)) {
    console.error("mysqldump does not support --login-path. Set MYSQL_DUMP_BIN to a MySQL 8 client path.");
    process.exit(1);
  }
  dumpArgs.push(`--login-path=${loginPath}`);
} else {
  const host = process.env.DB_HOST;
  if (host) {
    dumpArgs.push("-h", host);
  }

  const port = process.env.DB_PORT;
  if (port) {
    dumpArgs.push("-P", port);
  }

  const user = process.env.DB_USER || "root";
  dumpArgs.push("-u", user);

  const password = process.env.DB_PASSWORD;
  if (!noPassword) {
    if (password) {
      dumpArgs.push(`-p${password}`);
    } else {
      dumpArgs.push("-p");
    }
  }
}

dumpArgs.push(database);

if (process.env.MYSQL_DEBUG === "true") {
  console.log(`[db-backup] dumpBin=${dumpBin} loginPath=${loginPath ? "yes" : "no"}`);
  console.log(`[db-backup] args=${dumpArgs.join(" ")}`);
  console.log(`[db-backup] output=${outputPath}`);
}

const outStream = fs.createWriteStream(outputPath);
const child = spawn(dumpBin, dumpArgs, { stdio: ["ignore", "pipe", "inherit"] });
child.stdout.pipe(outStream);

child.on("exit", (code) => {
  if (code === 0) {
    console.log(`[db-backup] saved ${outputPath}`);
  }
  process.exitCode = code ?? 1;
});

child.on("error", (error) => {
  console.error("[db-backup] failed", error);
  process.exitCode = 1;
});
