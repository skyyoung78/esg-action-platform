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
  return decodeHtmlEntities(input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
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

export async function fetchArticleParagraphs(
  url: string,
  timeoutMs = 12_000,
): Promise<{ paragraphs: string[]; error?: string }> {
  if (!isFetchableArticleUrl(url)) {
    return { paragraphs: [], error: "유효하지 않은 기사 URL입니다." };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
      },
      cache: "no-store",
      redirect: "follow",
    });

    if (!response.ok) {
      return { paragraphs: [], error: `기사 페이지를 불러오지 못했습니다. (${response.status})` };
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      return { paragraphs: [], error: "HTML 기사 페이지가 아닙니다." };
    }

    const html = await response.text();
    const withoutNoise = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");

    const paragraphCandidates: string[] = [];

    for (const match of withoutNoise.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)) {
      const text = stripTags(match[1] ?? "");
      if (text.length >= 40) {
        paragraphCandidates.push(text);
      }
    }

    if (paragraphCandidates.length === 0) {
      for (const match of withoutNoise.matchAll(/<(?:div|span|article)[^>]*>([\s\S]*?)<\/(?:div|span|article)>/gi)) {
        const text = stripTags(match[1] ?? "");
        if (text.length >= 80) {
          paragraphCandidates.push(text);
        }
      }
    }

    const unique = [...new Set(paragraphCandidates)].slice(0, 40);

    if (unique.length === 0) {
      return {
        paragraphs: [],
        error: "기사 본문을 추출하지 못했습니다. 원문 사이트에서 확인해 주세요.",
      };
    }

    return { paragraphs: unique };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return { paragraphs: [], error: `기사를 가져오는 중 오류가 발생했습니다. (${message})` };
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchArticleBody(
  url: string,
  timeoutMs = 12_000,
): Promise<{ body: string; error?: string }> {
  const { paragraphs, error } = await fetchArticleParagraphs(url, timeoutMs);
  if (paragraphs.length === 0) {
    return { body: "", error };
  }

  return { body: paragraphs.join("\n\n") };
}

export function truncateArticleBody(body: string, maxLength = 12_000): string {
  const trimmed = body.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength)}…`;
}
