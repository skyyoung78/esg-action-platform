import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export type SearchQueryType = "news" | "company_news" | "disclosure";

export type SearchQueryLog = {
  id: string;
  query: string;
  normalized_query: string;
  search_type: SearchQueryType;
  context: string | null;
  result_count: number | null;
  searched_at: string;
  user_agent: string | null;
};

type SearchQueryStoreFile = {
  updatedAt: string;
  logs: SearchQueryLog[];
};

const DEDUP_WINDOW_MS = 2 * 60 * 1000;

function storePath(): string {
  return join(process.cwd(), "data", "search-queries.json");
}

export function readSearchQueryLogs(): SearchQueryLog[] {
  const path = storePath();
  if (!existsSync(path)) return [];

  try {
    const raw = readFileSync(path, "utf8");
    const parsed = JSON.parse(raw) as SearchQueryStoreFile;
    return Array.isArray(parsed?.logs) ? parsed.logs : [];
  } catch {
    return [];
  }
}

export function appendSearchQueryLog(
  entry: Omit<SearchQueryLog, "id" | "searched_at" | "normalized_query"> & { normalized_query?: string },
): SearchQueryLog | null {
  const query = entry.query.trim();
  if (!query) return null;

  const normalizedQuery = (entry.normalized_query ?? query).trim().toLowerCase();
  const logs = readSearchQueryLogs();
  const latest = logs[0];

  if (
    latest &&
    latest.normalized_query === normalizedQuery &&
    latest.search_type === entry.search_type &&
    latest.context === entry.context &&
    Date.now() - new Date(latest.searched_at).getTime() < DEDUP_WINDOW_MS
  ) {
    if (entry.result_count != null) {
      latest.result_count = entry.result_count;
      writeSearchQueryLogs(logs);
    }
    return latest;
  }

  const record: SearchQueryLog = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    query,
    normalized_query: normalizedQuery,
    search_type: entry.search_type,
    context: entry.context,
    result_count: entry.result_count,
    user_agent: entry.user_agent,
    searched_at: new Date().toISOString(),
  };

  logs.unshift(record);
  writeSearchQueryLogs(logs.slice(0, 10000));
  return record;
}

function writeSearchQueryLogs(logs: SearchQueryLog[]): void {
  const path = storePath();
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  writeFileSync(
    path,
    `${JSON.stringify({ updatedAt: new Date().toISOString(), logs }, null, 2)}\n`,
    "utf8",
  );
}
