import type { NewsItemView } from "@/components/news-list";
import { classifyEsgCategory } from "@/lib/esg-news-filter";
import { readLocalNewsStore, urlToLocalNewsId } from "@/lib/local-news-store";
import {
  COMPANY_NEWS_ANALYSIS_DAYS,
  COMPANY_NEWS_ANALYSIS_YEARS,
  getNewsWindow,
  isWithinNewsWindow,
} from "@/lib/news-window";
import { buildStudentTrendSummary, buildTemplateSummary } from "@/lib/news-summary";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { stripHtmlToText } from "@/lib/text-sanitize";

function decodeHtml(input: string): string {
  return stripHtmlToText(input);
}

function normalizeCompanyName(name: string): string {
  return name
    .replace(/\(주\)|㈜|\(사\)|\(재\)|주식회사/g, "")
    .replace(/\s+/g, "")
    .trim()
    .toLowerCase();
}

function companyAliases(companyName: string): string[] {
  const base = companyName.trim();
  const compact = normalizeCompanyName(base);
  const aliases = new Set([base, compact]);
  if (base.length >= 2) aliases.add(base.replace(/\(주\)|㈜/g, "").trim());
  return [...aliases].filter(Boolean);
}

export function articleMentionsCompany(item: NewsItemView, companyName: string): boolean {
  const needles = companyAliases(companyName);
  const haystack = normalizeCompanyName(
    [item.title, item.searchText, item.originalSnippet, item.studentTrendSummary, ...(item.summaryLines ?? [])].join(
      " ",
    ),
  );
  return needles.some((needle) => haystack.includes(normalizeCompanyName(needle)));
}

function extractTag(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match?.[1]?.trim() ?? "";
}

function cleanCdata(input: string): string {
  return input.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim();
}

function parsePublishedAt(input?: string): string | null {
  const raw = String(input ?? "").trim();
  if (!raw) return null;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "unknown";
  }
}

function liveToNewsItem(item: {
  title: string;
  originalUrl: string;
  source: string;
  snippet: string;
  publishedAt: string;
}): NewsItemView {
  const summaryLines = [...buildTemplateSummary(item.title, item.snippet)];
  return {
    id: `live:${encodeURIComponent(item.originalUrl)}`,
    title: item.title,
    originalUrl: item.originalUrl,
    source: item.source,
    searchText: item.snippet,
    publishedAt: item.publishedAt,
    summaryLines,
    originalSnippet: item.snippet,
    studentTrendSummary: buildStudentTrendSummary(item.title, item.snippet),
    category: classifyEsgCategory(item.title, item.snippet),
  };
}

function storedToNewsItem(row: ReturnType<typeof readLocalNewsStore>[number]): NewsItemView {
  const summaryLines = row.summary.map((line) => stripHtmlToText(line)).filter(Boolean) as [string, string, string];
  return {
    id: row.id,
    title: stripHtmlToText(row.title),
    originalUrl: row.original_url,
    source: row.source,
    searchText: summaryLines.join(" "),
    publishedAt: row.published_at,
    summaryLines,
    originalSnippet: stripHtmlToText(row.original_snippet || row.original_body).slice(0, 500),
    studentTrendSummary: stripHtmlToText(row.student_trend_summary),
    category: row.esg_category,
  };
}

function addToMerged(
  merged: Map<string, NewsItemView>,
  item: NewsItemView,
  window = getNewsWindow(COMPANY_NEWS_ANALYSIS_DAYS),
): void {
  if (!item.publishedAt || !isWithinNewsWindow(item.publishedAt, window)) return;

  const key = item.originalUrl || item.id;
  const existing = merged.get(key);
  if (!existing || new Date(item.publishedAt) > new Date(existing.publishedAt ?? 0)) {
    merged.set(key, item);
  }
}

async function fetchGoogleRssQuery(query: string, companyName: string, merged: Map<string, NewsItemView>): Promise<void> {
  const rssUrl = new URL("https://news.google.com/rss/search");
  rssUrl.searchParams.set("q", query);
  rssUrl.searchParams.set("hl", "ko");
  rssUrl.searchParams.set("gl", "KR");
  rssUrl.searchParams.set("ceid", "KR:ko");

  const response = await fetch(rssUrl.toString(), { cache: "no-store" });
  if (!response.ok) return;

  const xml = await response.text();
  const itemBlocks = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];

  for (const block of itemBlocks) {
    const title = decodeHtml(
      cleanCdata(extractTag(block, "title")).replace(/\s*-\s*Google 뉴스$/i, "").trim(),
    );
    const link = cleanCdata(extractTag(block, "link"));
    const description = decodeHtml(cleanCdata(extractTag(block, "description")));
    const pubDate = parsePublishedAt(cleanCdata(extractTag(block, "pubDate")));
    if (!title || !link || !pubDate) continue;

    const item = liveToNewsItem({
      title,
      originalUrl: link,
      source: hostnameOf(link),
      snippet: description || title,
      publishedAt: pubDate,
    });

    if (articleMentionsCompany(item, companyName)) {
      addToMerged(merged, item);
    }
  }
}

async function fetchGoogleRssCompanyNews(companyName: string, merged: Map<string, NewsItemView>): Promise<void> {
  const whenClause = `when:${COMPANY_NEWS_ANALYSIS_YEARS}y`;
  const queries = [`"${companyName}" ${whenClause}`, `${companyName} ${whenClause}`];

  for (const query of queries) {
    await fetchGoogleRssQuery(query, companyName, merged);
  }
}

async function fetchNaverCompanyNews(companyName: string, merged: Map<string, NewsItemView>): Promise<void> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) return;

  const window = getNewsWindow(COMPANY_NEWS_ANALYSIS_DAYS);

  for (let start = 1; start <= 1000; start += 100) {
    const url = new URL("https://openapi.naver.com/v1/search/news.json");
    url.searchParams.set("query", companyName);
    url.searchParams.set("display", "100");
    url.searchParams.set("start", String(start));
    url.searchParams.set("sort", "date");

    const response = await fetch(url.toString(), {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
      cache: "no-store",
    });
    if (!response.ok) break;

    const payload = await response.json();
    const items: Array<{
      title?: string;
      originallink?: string;
      link?: string;
      description?: string;
      pubDate?: string;
    }> = Array.isArray(payload?.items) ? payload.items : [];

    if (items.length === 0) break;

    let reachedWindowStart = false;
    for (const row of items) {
      const title = decodeHtml(String(row.title ?? ""));
      const snippet = decodeHtml(String(row.description ?? ""));
      const originalUrl = row.originallink || row.link || "";
      const publishedAt = parsePublishedAt(row.pubDate);
      if (!title || !originalUrl || !publishedAt) continue;

      if (!isWithinNewsWindow(publishedAt, window)) {
        reachedWindowStart = true;
        continue;
      }

      const item = liveToNewsItem({
        title,
        originalUrl,
        source: hostnameOf(originalUrl),
        snippet: snippet || title,
        publishedAt,
      });

      if (articleMentionsCompany(item, companyName)) {
        addToMerged(merged, item);
      }
    }

    if (reachedWindowStart) break;
  }
}

async function fetchSupabaseCompanyNews(companyName: string, merged: Map<string, NewsItemView>): Promise<void> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return;

  const window = getNewsWindow(COMPANY_NEWS_ANALYSIS_DAYS);
  const { data } = await supabase
    .from("news")
    .select("id,title,original_url,source,published_at,summary,esg_category,original_snippet,student_trend_summary")
    .gte("published_at", window.startIso)
    .lte("published_at", window.endIso)
    .order("published_at", { ascending: false })
    .limit(1000);

  if (!data) return;

  for (const row of data) {
    const summary = Array.isArray(row.summary) ? row.summary.join(" ") : String(row.summary ?? "");
    const item: NewsItemView = {
      id: String(row.id),
      title: String(row.title),
      originalUrl: String(row.original_url),
      source: String(row.source ?? ""),
      searchText: summary,
      publishedAt: String(row.published_at),
      summaryLines: Array.isArray(row.summary) ? row.summary.map(String) : undefined,
      originalSnippet: String(row.original_snippet ?? ""),
      studentTrendSummary: String(row.student_trend_summary ?? ""),
      category: row.esg_category as NewsItemView["category"],
    };
    if (articleMentionsCompany(item, companyName)) {
      addToMerged(merged, item);
    }
  }
}

export async function searchCompanyNews(
  companyName: string,
  days = COMPANY_NEWS_ANALYSIS_DAYS,
): Promise<NewsItemView[]> {
  const trimmed = companyName.trim();
  if (!trimmed) return [];

  const window = getNewsWindow(days);
  const merged = new Map<string, NewsItemView>();

  for (const row of readLocalNewsStore()) {
    if (!isWithinNewsWindow(row.published_at, window)) continue;
    const item = storedToNewsItem(row);
    if (articleMentionsCompany(item, trimmed)) {
      addToMerged(merged, item, window);
    }
  }

  await fetchSupabaseCompanyNews(trimmed, merged);

  try {
    await fetchGoogleRssCompanyNews(trimmed, merged);
    await fetchNaverCompanyNews(trimmed, merged);
  } catch {
    /* live fetch optional */
  }

  return [...merged.values()]
    .map((item) => {
      const localId = urlToLocalNewsId(item.originalUrl);
      return item.id.startsWith("live:") ? { ...item, id: localId } : item;
    })
    .sort((a, b) => new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime());
}
