"use client";

import { useEffect, useState } from "react";
import { normalizeExternalUrl } from "@/lib/url";

type NewsArticleReaderProps = {
  newsId: string;
  originalUrl: string;
  originalSnippet: string;
  embedded?: boolean;
};

export default function NewsArticleReader({
  newsId,
  originalUrl,
  originalSnippet,
  embedded = false,
}: NewsArticleReaderProps) {
  const [paragraphs, setParagraphs] = useState<string[]>([]);
  const [loading, setLoading] = useState(Boolean(originalUrl));
  const [error, setError] = useState<string | null>(null);

  const articleUrl = normalizeExternalUrl(originalUrl);

  useEffect(() => {
    if (!articleUrl) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadArticle() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ url: articleUrl!, id: newsId });
        const response = await fetch(`/api/news/content?${params.toString()}`);
        const payload = await response.json();

        if (cancelled) return;

        if (payload.ok && Array.isArray(payload.paragraphs) && payload.paragraphs.length > 0) {
          setParagraphs(payload.paragraphs);
        } else {
          setParagraphs([]);
          setError(payload.error ?? "기사 본문을 불러오지 못했습니다.");
        }
      } catch {
        if (!cancelled) {
          setParagraphs([]);
          setError("기사 본문을 불러오는 중 오류가 발생했습니다.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadArticle();

    return () => {
      cancelled = true;
    };
  }, [articleUrl, newsId]);

  const Wrapper = embedded ? "div" : "section";
  const wrapperClass = embedded
    ? "mt-4"
    : "bg-white rounded-xl border border-slate-100 shadow-sm p-5";

  return (
    <Wrapper className={wrapperClass}>
      {!embedded ? <h2 className="text-lg font-semibold text-[#111827]">기사 본문</h2> : null}

      {loading ? (
        <p className="mt-4 text-sm text-slate-500">실제 기사 본문을 불러오는 중입니다...</p>
      ) : null}

      {!loading && paragraphs.length > 0 ? (
        <div className="mt-4 space-y-4 text-[15px] leading-7 text-slate-800">
          {paragraphs.map((paragraph, index) => (
            <p key={`paragraph-${index}`}>{paragraph}</p>
          ))}
        </div>
      ) : null}

      {!loading && paragraphs.length === 0 ? (
        <div className="mt-4 space-y-3">
          {originalSnippet ? (
            <div className="rounded-lg bg-slate-50 border border-slate-100 p-4">
              <p className="text-xs font-semibold text-slate-500 mb-2">수집된 기사 원문 요약</p>
              <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{originalSnippet}</p>
            </div>
          ) : null}
          {error ? <p className="text-sm text-amber-700">{error}</p> : null}
        </div>
      ) : null}

      {articleUrl ? (
        <div className="mt-5 pt-4 border-t border-slate-100">
          <a
            href={articleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md border border-[#085041] px-4 py-2 text-sm font-medium text-[#085041] hover:bg-[#085041]/5 transition-colors"
          >
            언론사 원문 사이트에서 보기
            <span aria-hidden>↗</span>
          </a>
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">연결된 원문 URL이 없습니다.</p>
      )}
    </Wrapper>
  );
}
