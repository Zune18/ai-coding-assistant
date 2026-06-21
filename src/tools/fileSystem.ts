import fs from "fs";
import path from "path";

const IGNORED_DIRS = new Set([
  "node_modules", ".git", "dist", "build",
  ".next", "coverage", ".cache",
]);

const CODE_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".json",
  ".md", ".yaml", ".yml", ".sql", ".prisma",
]);

export interface FileSummary {
  path: string;
  size: number;
  extension: string;
}

// Recursively list all code files, skipping ignored dirs
export function listProjectFiles(
  dirPath: string,
  baseDir: string = dirPath
): FileSummary[] {
  const results: FileSummary[] = [];

  if (!fs.existsSync(dirPath)) return results;

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;

    const fullPath = path.join(dirPath, entry.name);
    const relativePath = path.relative(baseDir, fullPath);

    if (entry.isDirectory()) {
      results.push(...listProjectFiles(fullPath, baseDir));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (CODE_EXTENSIONS.has(ext) || entry.name === "package.json") {
        const stat = fs.statSync(fullPath);
        results.push({ path: relativePath, size: stat.size, extension: ext });
      }
    }
  }

  return results;
}

// Read a file — returns null if missing, truncation notice if too large
export function readFile(filePath: string, maxBytes = 50_000): string | null {
  if (!fs.existsSync(filePath)) return null;

  const stat = fs.statSync(filePath);
  if (stat.size > maxBytes) {
    return `[File too large: ${stat.size} bytes]`;
  }

  return fs.readFileSync(filePath, "utf-8");
}

// Build a compact tree string for the LLM prompt
export function buildDirectoryTree(files: FileSummary[]): string {
  return files.map((f) => `  ${f.path} (${f.size}B)`).join("\n");
}