import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export type StoredNewsArticle = {
  id: string;
  title: string;
  original_url: string;
  published_at: string;
  original_body: string;
  summary: string[];
  student_trend_summary: string;
  esg_category: "E" | "S" | "G";
  source: string;
  original_snippet: string;
  week_start: string;
  collected_at: string;
};

type NewsStoreFile = {
  updatedAt: string;
  articles: StoredNewsArticle[];
};

function storePath(): string {
  return join(process.cwd(), "data", "news-store.json");
}

export function readLocalNewsStore(): StoredNewsArticle[] {
  const path = storePath();
  if (!existsSync(path)) return [];

  try {
    const raw = readFileSync(path, "utf8");
    const parsed = JSON.parse(raw) as NewsStoreFile;
    const articles = Array.isArray(parsed?.articles) ? parsed.articles : [];
    return normalizeLocalNewsStore(articles);
  } catch {
    return [];
  }
}

export function writeLocalNewsStore(articles: StoredNewsArticle[]): void {
  const path = storePath();
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const payload: NewsStoreFile = {
    updatedAt: new Date().toISOString(),
    articles,
  };

  writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

export function findLocalNewsById(id: string): StoredNewsArticle | null {
  return readLocalNewsStore().find((article) => article.id === id) ?? null;
}

export function findLocalNewsByUrl(url: string): StoredNewsArticle | null {
  return readLocalNewsStore().find((article) => article.original_url === url) ?? null;
}

export function urlToLocalNewsId(url: string): string {
  const hash = createHash("sha256").update(url).digest("hex");
  return `local-${hash.slice(0, 20)}`;
}

/** 예전 백필 데이터의 중복 ID를 URL 기준으로 보정 */
export function normalizeLocalNewsStore(articles: StoredNewsArticle[]): StoredNewsArticle[] {
  return articles.map((article) => ({
    ...article,
    id: article.id.startsWith("local-") ? urlToLocalNewsId(article.original_url) : article.id,
  }));
}
