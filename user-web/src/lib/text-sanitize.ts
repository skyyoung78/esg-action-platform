export function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

/** HTML 태그 제거 후 읽을 수 있는 평문으로 변환 */
export function stripHtmlToText(input: string): string {
  return decodeHtmlEntities(
    String(input ?? "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

export function isReadableArticleText(input: string): boolean {
  const text = stripHtmlToText(input);
  if (text.length < 30) return false;
  if (/^https?:\/\//i.test(text)) return false;
  if (/<a\s+href=/i.test(input)) return false;
  return true;
}
