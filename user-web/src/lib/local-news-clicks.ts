import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { EsgCategory } from "@/lib/esg-news-filter";

export type NewsClickType = "detail" | "outlink";

export type NewsClickLog = {
  id: string;
  news_id: string;
  title: string;
  esg_category: EsgCategory;
  click_type: NewsClickType;
  clicked_at: string;
  user_agent: string | null;
};

type ClickStoreFile = {
  updatedAt: string;
  logs: NewsClickLog[];
};

function storePath(): string {
  return join(process.cwd(), "data", "news-clicks.json");
}

export function readNewsClickLogs(): NewsClickLog[] {
  const path = storePath();
  if (!existsSync(path)) return [];

  try {
    const raw = readFileSync(path, "utf8");
    const parsed = JSON.parse(raw) as ClickStoreFile;
    return Array.isArray(parsed?.logs) ? parsed.logs : [];
  } catch {
    return [];
  }
}

export function appendNewsClickLog(entry: Omit<NewsClickLog, "id" | "clicked_at">): NewsClickLog {
  const logs = readNewsClickLogs();
  const record: NewsClickLog = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    clicked_at: new Date().toISOString(),
  };

  logs.unshift(record);
  writeNewsClickLogs(logs.slice(0, 10000));
  return record;
}

function writeNewsClickLogs(logs: NewsClickLog[]): void {
  const path = storePath();
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  writeFileSync(
    path,
    `${JSON.stringify({ updatedAt: new Date().toISOString(), logs }, null, 2)}\n`,
    "utf8",
  );
}
