import {
  buildGoogleRssOrQueries,
  ESG_NEWS_SEARCH_KEYWORDS,
  isEsgRelatedNews,
} from "@/lib/esg-news-filter";

type LiveNewsItem = {
  title: string;
  originalUrl: string;
  source: string;
  snippet: string;
};

type NaverNewsApiItem = {
  title?: string;
  originallink?: string;
  link?: string;
  description?: string;
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

function pushIfRelevant(
  gathered: LiveNewsItem[],
  seen: Set<string>,
  item: LiveNewsItem,
  limit: number,
): boolean {
  if (!isEsgRelatedNews(item.title, item.snippet)) return false;
  if (seen.has(item.originalUrl)) return false;

  seen.add(item.originalUrl);
  gathered.push(item);
  return gathered.length >= limit;
}

async function fetchGoogleRssNews(limit: number): Promise<LiveNewsItem[]> {
  const gathered: LiveNewsItem[] = [];
  const seen = new Set<string>();
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
      const title = decodeHtml(rawTitle.replace(/\s*-\s*Google 뉴스$/i, "").trim());
      const originalUrl = normalizeUrl(rawLink);
      const snippet = decodeHtml(rawDescription);
      if (!title || !originalUrl) continue;

      if (
        pushIfRelevant(
          gathered,
          seen,
          { title, originalUrl, source: hostnameOf(originalUrl), snippet },
          limit,
        )
      ) {
        return gathered;
      }
    }
  }

  return gathered;
}

export async function fetchLiveNews(limit = 12): Promise<LiveNewsItem[]> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return fetchGoogleRssNews(limit);
  }

  const gathered: LiveNewsItem[] = [];
  const seen = new Set<string>();

  for (const keyword of ESG_NEWS_SEARCH_KEYWORDS) {
    const url = new URL("https://openapi.naver.com/v1/search/news.json");
    url.searchParams.set("query", keyword);
    url.searchParams.set("display", "20");
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
      if (!title || !originalUrl) continue;

      if (
        pushIfRelevant(
          gathered,
          seen,
          { title, originalUrl, source: hostnameOf(originalUrl), snippet },
          limit,
        )
      ) {
        return gathered;
      }
    }
  }

  return gathered.length > 0 ? gathered : fetchGoogleRssNews(limit);
}
