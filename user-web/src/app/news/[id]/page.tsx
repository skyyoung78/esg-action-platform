import Link from "next/link";
import { notFound } from "next/navigation";
import AppShell from "@/components/app-shell";
import NewsArticleReader from "@/components/news-article-reader";
import { ESG_CATEGORY_BADGE_CLASS, ESG_CATEGORY_LABEL } from "@/lib/esg-news-filter";
import { getNewsDetailById } from "@/lib/news-detail";
import { isReadableArticleText } from "@/lib/text-sanitize";
import { normalizeExternalUrl } from "@/lib/url";

function formatPublishedDate(publishedAt: string): string {
  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function splitBodyParagraphs(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export default async function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await getNewsDetailById(id);

  if (!article) {
    notFound();
  }

  const articleUrl = normalizeExternalUrl(article.originalUrl);
  const publishedLabel = formatPublishedDate(article.publishedAt);
  const bodyParagraphs = splitBodyParagraphs(article.originalBody);
  const hasStoredBody = bodyParagraphs.length > 0 && isReadableArticleText(article.originalBody);

  return (
    <AppShell
      title="기사 상세"
      description="원문 → 핵심 요약 → 대학생 맞춤 ESG 트렌드 요약 순서로 확인할 수 있습니다."
    >
      <div className="mb-4">
        <Link href="/news" className="text-sm text-[#085041] hover:underline">
          ← 뉴스 목록으로
        </Link>
      </div>

      <article className="space-y-4">
        <header className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${ESG_CATEGORY_BADGE_CLASS[article.category]}`}
            >
              {ESG_CATEGORY_LABEL[article.category]}
            </span>
            {article.source ? <span className="text-xs text-slate-500">출처: {article.source}</span> : null}
            {publishedLabel ? <span className="text-xs text-slate-500">게시: {publishedLabel}</span> : null}
          </div>

          <h1 className="text-xl font-bold text-[#111827] leading-snug">{article.title}</h1>

          {articleUrl ? (
            <a
              href={articleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex mt-4 text-sm text-[#085041] hover:underline"
            >
              언론사 원문 URL ↗
            </a>
          ) : null}
        </header>

        <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#085041] mb-1">STEP 1</p>
          <h2 className="text-lg font-semibold text-[#111827]">기사 원문</h2>
          {hasStoredBody ? (
            <div className="mt-4 space-y-4 text-[15px] leading-7 text-slate-800">
              {bodyParagraphs.map((paragraph, index) => (
                <p key={`body-${index}`}>{paragraph}</p>
              ))}
            </div>
          ) : (
            <NewsArticleReader
              newsId={article.id}
              originalUrl={article.originalUrl}
              originalSnippet={article.originalSnippet}
              embedded
            />
          )}
        </section>

        {article.summaryLines.length > 0 ? (
          <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#085041] mb-1">STEP 2</p>
            <h2 className="text-lg font-semibold text-[#111827]">핵심 요약</h2>
            <ol className="mt-4 space-y-3 text-sm text-slate-700 list-decimal list-inside">
              {article.summaryLines.map((line, index) => (
                <li key={`summary-${index}`} className="leading-relaxed">
                  {line}
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        <section className="bg-gradient-to-br from-[#085041]/5 to-[#1D9E75]/5 rounded-xl border border-[#085041]/15 shadow-sm p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#085041] mb-1">STEP 3</p>
          <h2 className="text-lg font-semibold text-[#111827]">대학생 맞춤 ESG 트렌드 요약</h2>
          <p className="mt-4 text-[15px] leading-7 text-slate-800 whitespace-pre-wrap">
            {article.studentTrendSummary}
          </p>
        </section>
      </article>
    </AppShell>
  );
}
