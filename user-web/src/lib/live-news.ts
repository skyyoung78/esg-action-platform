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

async function fetchGoogleRssNews(limit: number): Promise<LiveNewsItem[]> {
  const queries = ["ESG", "탄소중립", "지속가능경영"];
  const gathered: LiveNewsItem[] = [];
  const seen = new Set<string>();

  for (const query of queries) {
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
      if (!title || !originalUrl || seen.has(originalUrl)) continue;

      seen.add(originalUrl);
      gathered.push({
        title,
        originalUrl,
        source: hostnameOf(originalUrl),
        snippet: decodeHtml(rawDescription),
      });
      if (gathered.length >= limit) return gathered;
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

  const keywords = ["ESG", "탄소중립", "지속가능경영"];
  const gathered: LiveNewsItem[] = [];
  const seen = new Set<string>();

  for (const keyword of keywords) {
    const url = new URL("https://openapi.naver.com/v1/search/news.json");
    url.searchParams.set("query", keyword);
    url.searchParams.set("display", "10");
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
      const originalUrl = normalizeUrl(item.originallink) ?? normalizeUrl(item.link);
      if (!title || !originalUrl || seen.has(originalUrl)) continue;
      seen.add(originalUrl);
      gathered.push({
        title,
        originalUrl,
        source: hostnameOf(originalUrl),
        snippet: decodeHtml(String(item.description ?? "")),
      });
      if (gathered.length >= limit) return gathered;
    }
  }

  return gathered.length > 0 ? gathered : fetchGoogleRssNews(limit);
}

