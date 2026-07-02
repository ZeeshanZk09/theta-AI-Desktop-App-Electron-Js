import * as fs from "node:fs";
import * as path from "node:path";

export const SEMANTIC_SEARCH_IGNORED_DIRS = new Set([
  ".git",
  ".venv",
  ".vscode",
  "node_modules",
  "dist",
  "build",
  "dist_electron",
  "backend_env",
  "__pycache__",
  "Stonic_Vault",
  "Theta_Vault",
  "audio",
  "screenshot",
  "Documents",
]);

export const SEMANTIC_SEARCH_ALLOWED_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".md",
  ".txt",
  ".py",
  ".html",
  ".css",
  ".scss",
  ".less",
  ".yaml",
  ".yml",
  ".toml",
  ".ini",
  ".sql",
  ".csv",
  ".xml",
  ".env",
]);

const SEMANTIC_SYNONYM_MAP: Record<string, string[]> = {
  ai: ["assistant", "model", "intelligence"],
  auth: ["authentication", "login", "signin", "token"],
  bug: ["issue", "error", "fix", "failure"],
  config: ["configuration", "setting", "env", "option"],
  db: ["database", "postgres", "postgresql", "sql"],
  linkedin: ["post", "draft", "queue", "publish"],
  memory: ["memories", "profile", "history", "preferences"],
  performance: ["optimize", "speed", "latency", "slow"],
  search: ["find", "lookup", "discover", "query"],
};

export const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

export const countOccurrences = (text = "", term = "") => {
  if (!text || !term) return 0;
  const regex = new RegExp(escapeRegex(term), "g");
  const matches = text.match(regex);
  return matches ? matches.length : 0;
};

export const buildSemanticTerms = (query = "") => {
  const baseTokens = String(query)
    .toLowerCase()
    .split(/[^a-z0-9_]+/)
    .filter((token) => token.length >= 2);

  const terms = new Set<string>(baseTokens);
  baseTokens.forEach((token) => {
    const expanded = SEMANTIC_SYNONYM_MAP[token];
    if (Array.isArray(expanded)) {
      expanded.forEach((term) => terms.add(term));
    }
  });

  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery.length >= 3) {
    terms.add(normalizedQuery);
  }

  return Array.from(terms);
};

export const resolveSearchRootPath = (requestedRootPath?: string) => {
  const workspaceRoot = path.resolve(process.cwd());
  if (!requestedRootPath) return workspaceRoot;

  const candidate = path.resolve(requestedRootPath);
  if (candidate.startsWith(workspaceRoot)) {
    return candidate;
  }

  return workspaceRoot;
};

export const collectWorkspaceTextFiles = (rootPath: string, maxFiles: number) => {
  const resolvedRoot = path.resolve(rootPath);
  const queue = [resolvedRoot];
  const files: string[] = [];
  const maxFileBytes = 1_000_000;

  while (queue.length > 0 && files.length < maxFiles) {
    const currentDir = queue.pop();
    if (!currentDir) continue;

    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (SEMANTIC_SEARCH_IGNORED_DIRS.has(entry.name)) continue;
        queue.push(fullPath);
        continue;
      }

      if (!entry.isFile()) continue;

      const extension = path.extname(entry.name).toLowerCase();
      if (!SEMANTIC_SEARCH_ALLOWED_EXTENSIONS.has(extension)) continue;

      try {
        const stat = fs.statSync(fullPath);
        if (stat.size > maxFileBytes) continue;
      } catch {
        continue;
      }

      files.push(fullPath);
      if (files.length >= maxFiles) break;
    }
  }

  return files;
};

export const scoreSemanticMatch = ({
  query,
  terms,
  relativePath,
  content,
}: {
  query: string;
  terms: string[];
  relativePath: string;
  content: string;
}) => {
  const queryLower = query.toLowerCase();
  const contentLower = content.toLowerCase();
  const fileLower = relativePath.toLowerCase();
  let score = 0;

  if (queryLower.length >= 3 && contentLower.includes(queryLower)) {
    score += 120;
  }

  if (queryLower.length >= 3 && fileLower.includes(queryLower)) {
    score += 90;
  }

  for (const term of terms) {
    if (!term) continue;
    const inFile = countOccurrences(fileLower, term);
    const inContent = countOccurrences(contentLower, term);

    if (inFile > 0) {
      score += Math.min(inFile, 4) * 15;
    }

    if (inContent > 0) {
      score += Math.min(inContent, 30) * (term.length >= 5 ? 4 : 2);
    }
  }

  return score;
};

export const extractSemanticSnippets = ({
  content,
  terms,
  query,
  maxSnippets = 3,
}: {
  content: string;
  terms: string[];
  query: string;
  maxSnippets?: number;
}) => {
  const lines = content.split(/\r?\n/);
  const queryLower = query.toLowerCase();
  const ranked: { line: number; score: number; text: string }[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const lineLower = line.toLowerCase();
    let lineScore = 0;

    if (queryLower.length >= 3 && lineLower.includes(queryLower)) {
      lineScore += 10;
    }

    for (const term of terms) {
      if (!term) continue;
      const occurrences = countOccurrences(lineLower, term);
      if (occurrences > 0) {
        lineScore += Math.min(occurrences, 8);
      }
    }

    if (lineScore > 0) {
      ranked.push({
        line: index + 1,
        score: lineScore,
        text: line.trim(),
      });
    }
  }

  ranked.sort((a, b) => b.score - a.score);

  return ranked
    .slice(0, maxSnippets)
    .map((item) => ({ line: item.line, text: item.text.slice(0, 240) }));
};
