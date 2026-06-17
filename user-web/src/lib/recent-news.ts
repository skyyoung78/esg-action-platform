import type { NewsItemView } from "@/components/news-list";
import { classifyEsgCategory, isEsgRelatedNews } from "@/lib/esg-news-filter";
import { fetchRollingNews } from "@/lib/live-news";
import { readLocalNewsStore, type StoredNewsArticle } from "@/lib/local-news-store";
import { ingestLiveNewsItems } from "@/lib/news-ingest";
import { newsItems } from "@/lib/mock-data";
import {
  getAccumulationNewsWindow,
  getNewsWindow,
  isWithinNewsWindow,
  NEWS_INGEST_BATCH_SIZE,
  NEWS_ROLLING_DAYS,
  type NewsWindow,
} from "@/lib/news-window";
import { groupByWeek, type NewsWeekGroup } from "@/lib/news-week";
import { buildTemplateSummary5W1H } from "@/lib/news-summary";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { stripHtmlToText } from "@/lib/text-sanitize";

/** 목록 페이지에 한 번에 표시할 최대 기사 수 (렌더 성능) */
const MAX_BROWSE_ITEMS = 60;

function buildStudentTrendFallback(title: string, body: string): string {
  const summary = buildTemplateSummary5W1H(title, body);
  return `${summary.what} 최근 ESG 이슈 흐름을 파악하고, 관련 과제·취업 준비에 참고할 수 있는 주요 기사입니다.`;
}

function summaryToText(summary: unknown): string {
  if (Array.isArray(summary)) {
    return summary.map((line) => String(line ?? "")).join(" ");
  }
  return String(summary ?? "");
}

function summaryToLines(summary: unknown): string[] {
  if (!Array.isArray(summary)) return [];
  return summary.map((line) => String(line ?? "").trim()).filter(Boolean);
}

function storedToNewsItem(row: StoredNewsArticle, compact = false): NewsItemView {
  const summaryLines = row.summary.map((line) => stripHtmlToText(line)).filter(Boolean);
  const summaryText = summaryLines.join(" ");
  const snippetSource = stripHtmlToText(row.original_snippet || row.original_body);

  if (compact) {
    return {
      id: row.id,
      title: stripHtmlToText(row.title),
      originalUrl: row.original_url,
      source: row.source,
      publishedAt: row.published_at,
      category: row.esg_category,
      summaryLines: summaryLines.slice(0, 2).map((line) => line.slice(0, 120)),
      originalSnippet: snippetSource.slice(0, 160),
    };
  }

  return {
    id: row.id,
    title: stripHtmlToText(row.title),
    originalUrl: row.original_url,
    source: row.source,
    searchText: summaryText,
    publishedAt: row.published_at,
    summaryLines: summaryLines.length > 0 ? summaryLines : undefined,
    originalSnippet: snippetSource.slice(0, 500),
    studentTrendSummary: stripHtmlToText(row.student_trend_summary),
    category: row.esg_category,
  };
}

function rowToNewsItem(row: Record<string, unknown>): NewsItemView | null {
  const title = String(row.title ?? "");
  const summaryText = summaryToText(row.summary);
  const originalSnippet = String(row.original_snippet ?? summaryText);
  if (!isEsgRelatedNews(title, originalSnippet || summaryText)) return null;

  const publishedAt = String(row.published_at ?? "");
  const cat = String(row.esg_category ?? "");

  return {
    id: String(row.id),
    title,
    originalUrl: String(row.original_url),
    source: String(row.source ?? ""),
    searchText: summaryText,
    publishedAt,
    summaryLines: summaryToLines(row.summary),
    originalSnippet,
    studentTrendSummary: String(row.student_trend_summary ?? ""),
    category: (() => {
      if (cat === "E" || cat === "S" || cat === "G") return cat;
      return classifyEsgCategory(title, originalSnippet || summaryText);
    })(),
  };
}

function mockToNewsItems(now: Date): NewsItemView[] {
  return newsItems.map((item) => ({
    id: item.id,
    title: item.title,
    originalUrl: item.originalUrl,
    source: item.source,
    searchText: item.originalBody ?? item.summary.join(" "),
    publishedAt: now.toISOString(),
    summaryLines: [...item.summary],
    originalSnippet: item.originalBody ?? item.summary.join(" "),
    studentTrendSummary:
      item.studentTrendSummary ??
      buildStudentTrendFallback(item.title, item.originalBody ?? item.summary.join(" ")),
    category: item.category,
  }));
}

function mergeNewsItems(localItems: NewsItemView[], dbItems: NewsItemView[]): NewsItemView[] {
  const merged = new Map<string, NewsItemView>();

  for (const item of dbItems) {
    merged.set(item.originalUrl || item.id, item);
  }

  for (const item of localItems) {
    merged.set(item.originalUrl || item.id, item);
  }

  return [...merged.values()].sort(
    (a, b) => new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime(),
  );
}

async function loadDbNewsItems(window: NewsWindow): Promise<NewsItemView[]> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("news")
    .select("id,title,original_url,source,published_at,summary,esg_category,week_start,original_snippet,student_trend_summary")
    .gte("published_at", window.startIso)
    .lte("published_at", window.endIso)
    .order("published_at", { ascending: false })
    .limit(1000);

  if (!data || data.length === 0) return [];

  return data
    .map((row) => rowToNewsItem(row as Record<string, unknown>))
    .filter((item): item is NewsItemView => item !== null)
    .filter((item) => isWithinNewsWindow(item.publishedAt ?? "", window));
}

export function toCompactNewsItem(item: NewsItemView): NewsItemView {
  return {
    id: item.id,
    title: item.title,
    originalUrl: item.originalUrl,
    source: item.source,
    publishedAt: item.publishedAt,
    category: item.category,
    summaryLines: item.summaryLines?.slice(0, 2).map((line) => line.slice(0, 120)),
    originalSnippet: item.originalSnippet?.slice(0, 160),
  };
}

/** 저장된 뉴스만 빠르게 로드 (로컬 JSON + Supabase) */
export async function loadStoredNewsItems(
  window: NewsWindow,
  now: Date = new Date(),
  options?: { compact?: boolean },
): Promise<NewsItemView[]> {
  const compact = options?.compact ?? false;
  const localItems = readLocalNewsStore()
    .filter((row) => isWithinNewsWindow(row.published_at, window))
    .map((row) => storedToNewsItem(row, compact));

  const dbItems = await loadDbNewsItems(window);
  let items = mergeNewsItems(localItems, dbItems);

  if (items.length === 0) {
    items = mockToNewsItems(now);
  }

  return items;
}

/** 2026.6.1 이후 누적 ESG 뉴스 로드 — 페이지 렌더는 저장소 우선 (네트워크 수집 없음) */
export async function loadAccumulatedNewsItems(
  now: Date = new Date(),
): Promise<{ window: NewsWindow; items: NewsItemView[] }> {
  const window = getAccumulationNewsWindow(now);
  const items = await loadStoredNewsItems(window, now);
  return { window, items };
}

/** 백그라운드 신규 뉴스 수집·저장 (최근 7일, 소량) */
export async function refreshRollingNewsInBackground(): Promise<{ processed: number; saved: number }> {
  const window = getNewsWindow(NEWS_ROLLING_DAYS);
  const liveCandidates = (await fetchRollingNews(window)).filter((item) =>
    isWithinNewsWindow(item.publishedAt, window),
  );

  return ingestLiveNewsItems(liveCandidates, {
    maxItems: Math.min(4, NEWS_INGEST_BATCH_SIZE),
    onlyMissing: true,
  });
}

/** 주간 탭으로 그룹핑된 누적 뉴스 */
export async function loadAccumulatedNewsWeeks(now: Date = new Date()): Promise<NewsWeekGroup<NewsItemView>[]> {
  const { window, items } = await loadAccumulatedNewsItems(now);
  if (items.length === 0) return [buildEmptyPeriod(window)];
  return groupByWeek(items, (item) => item.publishedAt ?? "", now);
}

export type NewsPageData = {
  weeks: NewsWeekGroup<NewsItemView>[];
  recentWindow: NewsWindow;
};

/** 뉴스 페이지: 최근 7일만 표시 (전체 검색은 /api/news/search) */
export async function loadNewsPageData(now: Date = new Date()): Promise<NewsPageData> {
  const recentWindow = getNewsWindow(NEWS_ROLLING_DAYS, now);
  const recentItems = (await loadStoredNewsItems(recentWindow, now, { compact: true })).slice(
    0,
    MAX_BROWSE_ITEMS,
  );

  const weeks =
    recentItems.length > 0
      ? groupByWeek(recentItems, (item) => item.publishedAt ?? "", now)
      : [buildEmptyPeriod(recentWindow)];

  return { weeks, recentWindow };
}

/** info/홈 트렌드용 — 저장소 기준, 최대 100건 */
export async function loadRecentNewsPeriod(now: Date = new Date()): Promise<NewsWeekGroup<NewsItemView>> {
  const window = getAccumulationNewsWindow(now);
  const items = (await loadStoredNewsItems(window, now)).slice(0, 100);
  return {
    weekStart: window.key,
    label: window.label,
    isCurrentWeek: true,
    items,
  };
}

export function buildEmptyPeriod(window: NewsWindow): NewsWeekGroup<NewsItemView> {
  return {
    weekStart: window.key,
    label: window.label,
    isCurrentWeek: true,
    items: [],
  };
}
