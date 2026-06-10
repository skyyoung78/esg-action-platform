import { decodeGoogleNewsUrl, isGoogleNewsArticleUrl } from "@/lib/google-news-decoder";
import { findPublisherUrlByTitle } from "@/lib/naver-publisher-url";

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripTags(input: string): string {
  return decodeHtmlEntities(
    input
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function isPrivateHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (lower === "localhost" || lower.endsWith(".local")) return true;
  if (/^127\./.test(lower) || /^10\./.test(lower) || /^192\.168\./.test(lower)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(lower)) return true;
  return false;
}

export function isFetchableArticleUrl(input: string): boolean {
  try {
    const parsed = new URL(input);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    return !isPrivateHost(parsed.hostname);
  } catch {
    return false;
  }
}

function isGoogleNewsUrl(url: string): boolean {
  return isGoogleNewsArticleUrl(url);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const NOISE_PATTERNS = [
  /Internet Explorer/i,
  /Google 뉴스 고급검색/i,
  /시작페이지로/i,
  /개인정보처리방침/i,
  /Android 앱 다운로드/i,
  /최신 브라우저/i,
  /^뉴스\s+Google 뉴스/i,
  /광고\s*배너/i,
  /로그인\s*회원가입/i,
];

function isNoiseParagraph(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 25) return true;
  return NOISE_PATTERNS.some((pattern) => pattern.test(trimmed));
}

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
  "Accept-Encoding": "identity",
  Cookie: "CONSENT=PENDING+987",
};

function extractMetaContent(html: string, attr: string, value: string): string | null {
  const pattern = new RegExp(
    `<meta[^>]+${attr}=["']${value}["'][^>]+content=["']([^"']+)["']|<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${value}["']`,
    "i",
  );
  const match = html.match(pattern);
  const raw = match?.[1] ?? match?.[2];
  if (!raw) return null;
  const text = stripTags(raw);
  return text.length >= 40 ? text : null;
}

function extractMetaUrl(html: string): string | null {
  const patterns = [
    /<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:url["']/i,
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i,
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    const candidate = match?.[1]?.trim();
    if (candidate && isFetchableArticleUrl(candidate) && !isGoogleNewsUrl(candidate)) {
      return candidate;
    }
  }

  return null;
}

function extractFromMetaTags(html: string): string[] {
  const candidates = [
    extractMetaContent(html, "property", "og:description"),
    extractMetaContent(html, "name", "description"),
    extractMetaContent(html, "property", "twitter:description"),
  ].filter((value): value is string => Boolean(value));

  return [...new Set(candidates)];
}

function collectJsonLdNodes(data: unknown): unknown[] {
  if (!data) return [];
  if (Array.isArray(data)) return data.flatMap((item) => collectJsonLdNodes(item));
  if (typeof data === "object") {
    const record = data as Record<string, unknown>;
    if (record["@graph"]) return collectJsonLdNodes(record["@graph"]);
    return [record];
  }
  return [];
}

function extractFromJsonLd(html: string): string[] {
  const paragraphs: string[] = [];

  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(match[1] ?? "");
      for (const node of collectJsonLdNodes(parsed)) {
        const record = node as Record<string, unknown>;
        const articleBody = stripTags(String(record.articleBody ?? ""));
        const description = stripTags(String(record.description ?? ""));
        if (articleBody.length >= 80) paragraphs.push(articleBody);
        else if (description.length >= 80) paragraphs.push(description);
      }
    } catch {
      continue;
    }
  }

  return paragraphs;
}

function extractFromParagraphTags(html: string): string[] {
  const withoutNoise = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");

  const paragraphCandidates: string[] = [];

  for (const match of withoutNoise.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)) {
    const text = stripTags(match[1] ?? "");
    if (text.length >= 30) {
      paragraphCandidates.push(text);
    }
  }

  return paragraphCandidates;
}

function extractFromArticleContainers(html: string): string[] {
  const withoutNoise = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");

  const containerPattern =
    /<(?:div|section|article)[^>]+(?:id|class)=["'][^"']*(?:article[_-]?body|news[_-]?body|article[_-]?view|view[_-]?txt|art_body|newsct_article|article[_-]?content|news_body|#articletxt)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|section|article)>/gi;

  const paragraphs: string[] = [];
  for (const match of withoutNoise.matchAll(containerPattern)) {
    const text = stripTags(match[1] ?? "");
    if (text.length >= 80) {
      paragraphs.push(text);
    }
  }

  return paragraphs;
}

function splitLongText(text: string): string[] {
  return text
    .split(/\n{2,}|(?<=[.!?…])\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 30 && !isNoiseParagraph(part));
}

function mergeParagraphCandidates(candidates: string[]): string[] {
  const merged: string[] = [];

  for (const candidate of candidates) {
    if (candidate.length > 400 && !candidate.includes("\n")) {
      merged.push(...splitLongText(candidate));
    } else {
      merged.push(candidate);
    }
  }

  return [...new Set(merged)]
    .filter((paragraph) => !isNoiseParagraph(paragraph))
    .slice(0, 40);
}

/** Google News URL → 언론사 원문 URL (재시도 + 네이버 검색 보조) */
export async function resolvePublisherUrl(
  url: string,
  options?: { title?: string },
  timeoutMs = 15_000,
): Promise<string> {
  if (!isFetchableArticleUrl(url)) {
    return url;
  }

  if (isGoogleNewsUrl(url)) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const decoded = await decodeGoogleNewsUrl(url);
      if (decoded !== url && isFetchableArticleUrl(decoded) && !isGoogleNewsUrl(decoded)) {
        return decoded;
      }
      if (attempt < 2) await sleep(1500 * (attempt + 1));
    }

    if (options?.title) {
      const naverUrl = await findPublisherUrlByTitle(options.title);
      if (naverUrl && isFetchableArticleUrl(naverUrl)) {
        return naverUrl;
      }
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: BROWSER_HEADERS,
      cache: "no-store",
      redirect: "follow",
    });

    const finalUrl = response.url;
    if (isFetchableArticleUrl(finalUrl) && !isGoogleNewsUrl(finalUrl)) {
      return finalUrl;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      return url;
    }

    const html = await response.text();
    return extractMetaUrl(html) ?? url;
  } catch {
    return url;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchArticleParagraphs(
  url: string,
  options?: { title?: string; timeoutMs?: number },
): Promise<{ paragraphs: string[]; error?: string; resolvedUrl?: string }> {
  const timeoutMs = options?.timeoutMs ?? 15_000;

  if (!isFetchableArticleUrl(url)) {
    return { paragraphs: [], error: "유효하지 않은 기사 URL입니다." };
  }

  const resolvedUrl = await resolvePublisherUrl(url, options, timeoutMs);
  const fetchUrl =
    resolvedUrl !== url && isFetchableArticleUrl(resolvedUrl) && !isGoogleNewsUrl(resolvedUrl)
      ? resolvedUrl
      : isGoogleNewsUrl(url) && options?.title
        ? (await findPublisherUrlByTitle(options.title)) ?? url
        : url;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(fetchUrl, {
      signal: controller.signal,
      headers: BROWSER_HEADERS,
      cache: "no-store",
      redirect: "follow",
    });

    if (!response.ok) {
      return {
        paragraphs: [],
        error: `기사 페이지를 불러오지 못했습니다. (${response.status})`,
        resolvedUrl: fetchUrl,
      };
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      return { paragraphs: [], error: "HTML 기사 페이지가 아닙니다.", resolvedUrl: fetchUrl };
    }

    const html = await response.text();
    const candidates = [
      ...extractFromArticleContainers(html),
      ...extractFromParagraphTags(html),
      ...extractFromJsonLd(html),
      ...extractFromMetaTags(html),
    ];

    const unique = mergeParagraphCandidates(candidates);

    if (unique.length === 0) {
      return {
        paragraphs: [],
        error: "기사 본문을 추출하지 못했습니다. 원문 사이트에서 확인해 주세요.",
        resolvedUrl: fetchUrl,
      };
    }

    return { paragraphs: unique, resolvedUrl: fetchUrl };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return {
      paragraphs: [],
      error: `기사를 가져오는 중 오류가 발생했습니다. (${message})`,
      resolvedUrl: fetchUrl,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchArticleBody(
  url: string,
  options?: { title?: string; timeoutMs?: number },
): Promise<{ body: string; resolvedUrl?: string; error?: string }> {
  const { paragraphs, error, resolvedUrl } = await fetchArticleParagraphs(url, options);
  if (paragraphs.length === 0) {
    return { body: "", error, resolvedUrl };
  }

  return { body: paragraphs.join("\n\n"), resolvedUrl };
}

export function truncateArticleBody(body: string, maxLength = 12_000): string {
  const trimmed = body.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength)}…`;
}
