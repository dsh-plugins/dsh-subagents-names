/**
 * 校验仓库内所有文本文件都是 UTF-8（无 BOM）。
 *
 * 客户端 bundle 会被 DSH 原样从磁盘读取并注入页面，因此编码必须唯一确定；
 * 该脚本在 CI 与本地 `npm test` 中都会执行。
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SKIP_DIRS = new Set([".git", "node_modules"]);
const TEXT_EXTENSIONS = new Set([".js", ".mjs", ".cjs", ".json", ".yml", ".yaml", ".md", ".txt", ".xml"]);

/** 递归收集需要检查的文件。 */
function collect(dir, found = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) collect(full, found);
    else if (TEXT_EXTENSIONS.has(entry.slice(entry.lastIndexOf(".")))) found.push(full);
  }
  return found;
}

const failures = [];
for (const file of collect(ROOT)) {
  const bytes = readFileSync(file);
  const name = relative(ROOT, file).replaceAll("\\", "/");
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    failures.push(`${name}: 含有 UTF-8 BOM`);
    continue;
  }
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    failures.push(`${name}: 不是合法的 UTF-8`);
  }
}

if (failures.length > 0) {
  console.error("编码检查失败：");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log("编码检查通过：全部文本文件均为 UTF-8（无 BOM）。");
