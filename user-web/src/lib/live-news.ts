import {
  buildGoogleRssOrQueries,
  ESG_NEWS_SEARCH_KEYWORDS,
  isEsgRelatedNews,
} from "@/lib/esg-news-filter";
import { getNewsWindow, isWithinNewsWindow, NEWS_ROLLING_DAYS } from "@/lib/news-window";

export type LiveNewsItem = {
  title: string;
  originalUrl: string;
  source: string;
  snippet: string;
  publishedAt: string;
};

type NaverNewsApiItem = {
  title?: string;
  originallink?: string;
  link?: string;
  description?: string;
  pubDate?: string;
};

function decodeHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .trim();
}

function normalizeUrl(input?: string): string | null {
  const raw = String(input ?? "").trim();
  if (!raw) return null;
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "unknown";
  }
}

function parsePublishedAt(input?: string): string | null {
  const raw = String(input ?? "").trim();
  if (!raw) return null;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function extractTag(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match?.[1]?.trim() ?? "";
}

function cleanCdata(input: string): string {
  return input
    .replace(/^<!\[CDATA\[/, "")
    .replace(/\]\]>$/, "")
    .trim();
}

function addIfRelevant(
  gathered: Map<string, LiveNewsItem>,
  item: LiveNewsItem,
  window = getNewsWindow(NEWS_ROLLING_DAYS),
): void {
  if (!isEsgRelatedNews(item.title, item.snippet)) return;
  if (!isWithinNewsWindow(item.publishedAt, window)) return;

  const existing = gathered.get(item.originalUrl);
  if (!existing || new Date(item.publishedAt) > new Date(existing.publishedAt)) {
    gathered.set(item.originalUrl, item);
  }
}

async function fetchNaverRecentNews(
  window = getNewsWindow(NEWS_ROLLING_DAYS),
): Promise<LiveNewsItem[]> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) return [];

  const gathered = new Map<string, LiveNewsItem>();

  for (const keyword of ESG_NEWS_SEARCH_KEYWORDS) {
    const url = new URL("https://openapi.naver.com/v1/search/news.json");
    url.searchParams.set("query", keyword);
    url.searchParams.set("display", "100");
    url.searchParams.set("sort", "date");

    const response = await fetch(url.toString(), {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
      cache: "no-store",
    });

    if (!response.ok) continue;

    const payload = await response.json();
    const items: NaverNewsApiItem[] = Array.isArray(payload?.items) ? payload.items : [];

    for (const item of items) {
      const title = decodeHtml(String(item.title ?? ""));
      const snippet = decodeHtml(String(item.description ?? ""));
      const originalUrl = normalizeUrl(item.originallink) ?? normalizeUrl(item.link);
      const publishedAt = parsePublishedAt(item.pubDate);
      if (!title || !originalUrl || !publishedAt) continue;

      addIfRelevant(
        gathered,
        { title, originalUrl, source: hostnameOf(originalUrl), snippet, publishedAt },
        window,
      );
    }
  }

  return [...gathered.values()].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

async function fetchGoogleRssRecentNews(
  window = getNewsWindow(NEWS_ROLLING_DAYS),
): Promise<LiveNewsItem[]> {
  const gathered = new Map<string, LiveNewsItem>();
  const orQueries = buildGoogleRssOrQueries(8);

  for (const query of orQueries) {
    const rssUrl = new URL("https://news.google.com/rss/search");
    rssUrl.searchParams.set("q", query);
    rssUrl.searchParams.set("hl", "ko");
    rssUrl.searchParams.set("gl", "KR");
    rssUrl.searchParams.set("ceid", "KR:ko");

    const response = await fetch(rssUrl.toString(), { cache: "no-store" });
    if (!response.ok) continue;

    const xml = await response.text();
    const itemBlocks = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];

    for (const block of itemBlocks) {
      const rawTitle = cleanCdata(extractTag(block, "title"));
      const rawLink = cleanCdata(extractTag(block, "link"));
      const rawDescription = cleanCdata(extractTag(block, "description"));
      const rawPubDate = cleanCdata(extractTag(block, "pubDate"));
      const title = decodeHtml(rawTitle.replace(/\s*-\s*Google 뉴스$/i, "").trim());
      const originalUrl = normalizeUrl(rawLink);
      const snippet = decodeHtml(rawDescription);
      const publishedAt = parsePublishedAt(rawPubDate) ?? new Date().toISOString();
      if (!title || !originalUrl) continue;

      addIfRelevant(
        gathered,
        { title, originalUrl, source: hostnameOf(originalUrl), snippet, publishedAt },
        window,
      );
    }
  }

  return [...gathered.values()].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

/** 접속 시점 기준 최근 N일 ESG 뉴스 전체 수집 (중복 URL 제거) */
export async function fetchRecentNews(days = NEWS_ROLLING_DAYS): Promise<LiveNewsItem[]> {
  const window = getNewsWindow(days);

  const naverItems = await fetchNaverRecentNews(window);
  if (naverItems.length > 0) return naverItems;

  return fetchGoogleRssRecentNews(window);
}

/** @deprecated fetchRecentNews 사용 */
export async function fetchLiveNews(limit = 12): Promise<LiveNewsItem[]> {
  const items = await fetchRecentNews(NEWS_ROLLING_DAYS);
  return items.slice(0, limit);
}
