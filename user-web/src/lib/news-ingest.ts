import { generateArticleSummaries } from "@/lib/ai-news-summary";
import { fetchArticleBody } from "@/lib/article-fetcher";
import { classifyEsgCategory } from "@/lib/esg-news-filter";
import type { LiveNewsItem } from "@/lib/live-news";
import {
  findLocalNewsByUrl,
  readLocalNewsStore,
  urlToLocalNewsId,
  writeLocalNewsStore,
  type StoredNewsArticle,
} from "@/lib/local-news-store";
import { isWithinAccumulationWindow } from "@/lib/news-window";
import { getWeekStartKey } from "@/lib/news-week";
import { buildStudentTrendSummary, buildTemplateSummary } from "@/lib/news-summary";
import { isReadableArticleText, stripHtmlToText } from "@/lib/text-sanitize";

const BODY_FETCH_DELAY_MS = 250;
const MIN_SUBSTANTIVE_BODY_LENGTH = 120;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isSimilarText(a: string, b: string): boolean {
  const normalize = (value: string) => value.replace(/\s+/g, "").toLowerCase();
  const left = normalize(a);
  const right = normalize(b);
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
}

export function hasSubstantiveBody(body: string, title = ""): boolean {
  const text = stripHtmlToText(body);
  if (!isReadableArticleText(text)) return false;
  if (text.length < MIN_SUBSTANTIVE_BODY_LENGTH) return false;
  if (title && isSimilarText(text, title)) return false;
  return true;
}

export function articleNeedsIngest(article: StoredNewsArticle | null): boolean {
  if (!article) return true;
  return !hasSubstantiveBody(article.original_body, article.title);
}

async function liveItemToStored(item: LiveNewsItem): Promise<StoredNewsArticle | null> {
  await sleep(BODY_FETCH_DELAY_MS);

  const cleanTitle = stripHtmlToText(item.title);
  const snippetText = stripHtmlToText(item.snippet);

  const fetched = await fetchArticleBody(item.originalUrl, { title: cleanTitle });
  const fetchedText = stripHtmlToText(fetched.body);

  let originalBody = "";
  if (hasSubstantiveBody(fetchedText, cleanTitle)) {
    originalBody = fetchedText;
  } else if (isReadableArticleText(snippetText) && snippetText.length >= 30) {
    originalBody = snippetText;
  }

  if (originalBody.length < 20) return null;

  const aiResult = await generateArticleSummaries({ title: cleanTitle, originalBody });
  const summary = aiResult?.summary ?? buildTemplateSummary(cleanTitle, originalBody, item.publishedAt);
  const studentTrendSummary =
    aiResult?.studentTrendSummary ?? buildStudentTrendSummary(cleanTitle, originalBody);
  const category =
    aiResult?.category ??
    classifyEsgCategory(cleanTitle, originalBody) ??
    classifyEsgCategory(cleanTitle, snippetText) ??
    "E";

  return {
    id: urlToLocalNewsId(item.originalUrl),
    title: cleanTitle,
    original_url: item.originalUrl,
    published_at: item.publishedAt,
    original_body: originalBody,
    summary,
    student_trend_summary: studentTrendSummary,
    esg_category: category,
    source: item.source,
    original_snippet: snippetText || originalBody.slice(0, 500),
    week_start: getWeekStartKey(item.publishedAt),
    collected_at: new Date().toISOString(),
  };
}

function upsertArticle(merged: Map<string, StoredNewsArticle>, article: StoredNewsArticle): void {
  const existing = merged.get(article.original_url);
  if (!existing) {
    merged.set(article.original_url, article);
    return;
  }

  const existingSubstantive = hasSubstantiveBody(existing.original_body, existing.title);
  const incomingSubstantive = hasSubstantiveBody(article.original_body, article.title);

  if (!existingSubstantive && incomingSubstantive) {
    merged.set(article.original_url, article);
    return;
  }

  if (existingSubstantive && !incomingSubstantive) {
    return;
  }

  if (new Date(article.collected_at) >= new Date(existing.collected_at)) {
    merged.set(article.original_url, article);
  }
}

export async function ingestLiveNewsItems(
  items: LiveNewsItem[],
  options?: { maxItems?: number; onlyMissing?: boolean },
): Promise<{ processed: number; saved: number }> {
  const maxItems = options?.maxItems ?? 8;
  const onlyMissing = options?.onlyMissing ?? true;

  const candidates = items.filter((item) => {
    if (!isWithinAccumulationWindow(item.publishedAt)) return false;
    if (!onlyMissing) return true;
    const existing = findLocalNewsByUrl(item.originalUrl);
    return articleNeedsIngest(existing);
  });

  if (candidates.length === 0) {
    return { processed: 0, saved: 0 };
  }

  const merged = new Map<string, StoredNewsArticle>();
  for (const article of readLocalNewsStore()) {
    merged.set(article.original_url, article);
  }

  let processed = 0;
  let saved = 0;

  for (const item of candidates.slice(0, maxItems)) {
    const stored = await liveItemToStored(item);
    processed += 1;
    if (!stored) continue;

    const before = merged.get(stored.original_url);
    upsertArticle(merged, stored);
    const after = merged.get(stored.original_url);
    if (after && after !== before) {
      saved += 1;
    } else if (after && articleNeedsIngest(before ?? null) && !articleNeedsIngest(after)) {
      saved += 1;
    }
  }

  if (saved > 0) {
    const articles = [...merged.values()].sort(
      (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime(),
    );
    writeLocalNewsStore(articles);
  }

  return { processed, saved };
}

export async function ingestNewsByUrl(
  url: string,
  title = "",
  snippet = "",
): Promise<StoredNewsArticle | null> {
  const existing = findLocalNewsByUrl(url);
  if (existing && hasSubstantiveBody(existing.original_body, existing.title)) {
    return existing;
  }

  const merged = new Map<string, StoredNewsArticle>();
  for (const article of readLocalNewsStore()) {
    merged.set(article.original_url, article);
  }

  const stored = await liveItemToStored({
    title: title || existing?.title || "",
    originalUrl: url,
    source: existing?.source ?? "unknown",
    snippet: snippet || existing?.original_snippet || "",
    publishedAt: existing?.published_at ?? new Date().toISOString(),
  });

  if (!stored) return existing;

  upsertArticle(merged, stored);
  const articles = [...merged.values()].sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime(),
  );
  writeLocalNewsStore(articles);

  return stored;
}
