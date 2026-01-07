import fs from "fs";
import path from "path";
import dotenv from "dotenv";

const cwd = process.cwd();
const baseEnvPath = process.env.DOTENV_CONFIG_PATH
  ? path.resolve(cwd, process.env.DOTENV_CONFIG_PATH)
  : path.resolve(cwd, ".env");

if (fs.existsSync(baseEnvPath)) {
  dotenv.config({ path: baseEnvPath });
}

const secretsPathRaw = process.env.SECRETS_ENV_PATH ?? path.join("secrets", ".env");
if (secretsPathRaw && secretsPathRaw.trim()) {
  const secretsPath = path.resolve(cwd, secretsPathRaw);
  if (fs.existsSync(secretsPath)) {
    const raw = fs.readFileSync(secretsPath, "utf8");
    const parsed = dotenv.parse(raw);
    for (const [key, value] of Object.entries(parsed)) {
      const current = process.env[key];
      if (!current || !current.trim()) {
        process.env[key] = value;
      }
    }
  }
}
