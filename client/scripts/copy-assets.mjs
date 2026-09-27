import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.resolve(__dirname, "../packages/assets");
const targetApps = ["admin", "auth", "author", "web"];

if (!fs.existsSync(sourceDir)) {
  console.error(`[copy-assets] Source directory does not exist: ${sourceDir}`);
  process.exit(1);
}

for (const app of targetApps) {
  const targetDir = path.resolve(__dirname, `../apps/${app}/public`);

  // Ensure target directory exists
  fs.mkdirSync(targetDir, { recursive: true });

  // Copy all assets
  fs.cpSync(sourceDir, targetDir, { recursive: true, force: true });
  console.log(`[copy-assets] Synced shared assets -> apps/${app}/public`);
}
