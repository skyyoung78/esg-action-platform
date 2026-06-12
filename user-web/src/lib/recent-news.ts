import type { NewsItemView } from "@/components/news-list";
import { classifyEsgCategory, isEsgRelatedNews } from "@/lib/esg-news-filter";
import { fetchAccumulatedNews } from "@/lib/live-news";
import { findLocalNewsByUrl, readLocalNewsStore, type StoredNewsArticle } from "@/lib/local-news-store";
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
import { buildTemplateSummary, buildTemplateSummary5W1H } from "@/lib/news-summary";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { stripHtmlToText } from "@/lib/text-sanitize";

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

function storedToNewsItem(row: StoredNewsArticle): NewsItemView {
  const summaryLines = row.summary.map((line) => stripHtmlToText(line)).filter(Boolean);
  const summaryText = summaryLines.join(" ");
  return {
    id: row.id,
    title: stripHtmlToText(row.title),
    originalUrl: row.original_url,
    source: row.source,
    searchText: summaryText,
    publishedAt: row.published_at,
    summaryLines: summaryLines.length > 0 ? summaryLines : undefined,
    originalSnippet: stripHtmlToText(row.original_snippet || row.original_body).slice(0, 500),
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

function liveToNewsItem(item: {
  title: string;
  originalUrl: string;
  source: string;
  snippet: string;
  publishedAt: string;
}): NewsItemView {
  const summaryLines = [...buildTemplateSummary(item.title, item.snippet, item.publishedAt)];

  return {
    id: `live:${encodeURIComponent(item.originalUrl)}`,
    title: item.title,
    originalUrl: item.originalUrl,
    source: item.source,
    searchText: item.snippet,
    publishedAt: item.publishedAt,
    summaryLines,
    originalSnippet: item.snippet,
    studentTrendSummary: buildStudentTrendFallback(item.title, item.snippet),
    category: classifyEsgCategory(item.title, item.snippet),
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

function mergeNewsItems(
  localItems: NewsItemView[],
  dbItems: NewsItemView[],
  liveItems: NewsItemView[],
): NewsItemView[] {
  const merged = new Map<string, NewsItemView>();

  for (const item of liveItems) {
    merged.set(item.originalUrl || item.id, item);
  }

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

/** 2026.6.1 이후 누적 ESG 뉴스 로드 (로컬 저장소 + DB + 라이브 수집 병합) */
export async function loadAccumulatedNewsItems(
  now: Date = new Date(),
): Promise<{ window: NewsWindow; items: NewsItemView[] }> {
  const window = getAccumulationNewsWindow(now);

  const liveCandidates = (await fetchAccumulatedNews(window)).filter((item) =>
    isWithinNewsWindow(item.publishedAt, window),
  );

  await ingestLiveNewsItems(liveCandidates, { maxItems: NEWS_INGEST_BATCH_SIZE, onlyMissing: true });

  const localItemsAfterIngest = readLocalNewsStore()
    .filter((row) => isWithinNewsWindow(row.published_at, window))
    .map(storedToNewsItem);

  const liveItems = liveCandidates
    .filter((item) => !findLocalNewsByUrl(item.originalUrl))
    .map(liveToNewsItem);

  let dbItems: NewsItemView[] = [];
  const supabase = createSupabaseServerClient();

  if (supabase) {
    const { data } = await supabase
      .from("news")
      .select("id,title,original_url,source,published_at,summary,esg_category,week_start,original_snippet,student_trend_summary")
      .gte("published_at", window.startIso)
      .lte("published_at", window.endIso)
      .order("published_at", { ascending: false })
      .limit(1000);

    if (data && data.length > 0) {
      dbItems = data
        .map((row) => rowToNewsItem(row as Record<string, unknown>))
        .filter((item): item is NewsItemView => item !== null)
        .filter((item) => isWithinNewsWindow(item.publishedAt ?? "", window));
    }
  }

  let items = mergeNewsItems(localItemsAfterIngest, dbItems, liveItems);
  if (items.length === 0) {
    items = mockToNewsItems(now);
  }

  return { window, items };
}

/** 주간 탭으로 그룹핑된 누적 뉴스 */
export async function loadAccumulatedNewsWeeks(now: Date = new Date()): Promise<NewsWeekGroup<NewsItemView>[]> {
  const { window, items } = await loadAccumulatedNewsItems(now);
  if (items.length === 0) return [buildEmptyPeriod(window)];
  return groupByWeek(items, (item) => item.publishedAt ?? "", now);
}

export type NewsPageData = {
  weeks: NewsWeekGroup<NewsItemView>[];
  archiveItems: NewsItemView[];
  recentWindow: NewsWindow;
};

/** 뉴스 페이지: 최근 7일 표시 + 저장된 전체 기사(검색용) */
export async function loadNewsPageData(now: Date = new Date()): Promise<NewsPageData> {
  const { items: archiveItems } = await loadAccumulatedNewsItems(now);
  const recentWindow = getNewsWindow(NEWS_ROLLING_DAYS, now);

  const recentItems = archiveItems.filter((item) =>
    isWithinNewsWindow(item.publishedAt ?? "", recentWindow),
  );

  const weeks =
    recentItems.length > 0
      ? groupByWeek(recentItems, (item) => item.publishedAt ?? "", now)
      : [buildEmptyPeriod(recentWindow)];

  return { weeks, archiveItems, recentWindow };
}

/** @deprecated loadAccumulatedNewsItems 사용 — info/홈 등 단일 목록용 */
export async function loadRecentNewsPeriod(now: Date = new Date()): Promise<NewsWeekGroup<NewsItemView>> {
  const { window, items } = await loadAccumulatedNewsItems(now);
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
