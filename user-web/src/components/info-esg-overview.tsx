import Link from "next/link";
import type { NewsItemView } from "@/components/news-list";
import {
  ESG_CATEGORY_BADGE_CLASS,
  ESG_CATEGORY_LABEL,
  type EsgCategory,
} from "@/lib/esg-news-filter";
import { buildEsgTrendDashboard } from "@/lib/esg-trend-analysis";

const CATEGORY_ORDER: EsgCategory[] = ["E", "S", "G"];

function formatDate(publishedAt?: string): string {
  if (!publishedAt) return "";
  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

function StatBar({ label, percent, count, tone }: { label: string; percent: number; count: number; tone: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="font-medium text-slate-800">{label}</span>
        <span className="text-slate-500">
          {count}건 · {percent}%
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.max(percent, 4)}%` }} />
      </div>
    </div>
  );
}

export default function InfoEsgOverview({ articles }: { articles: NewsItemView[] }) {
  const dashboard = buildEsgTrendDashboard(articles);

  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    label: ESG_CATEGORY_LABEL[category],
    items: articles.filter((item) => item.category === category).slice(0, 3),
  })).filter((group) => group.items.length > 0);

  if (articles.length === 0) {
    return (
      <p className="text-sm text-slate-500 rounded-lg border border-dashed border-slate-200 p-6 text-center">
        최근 7일간 수집된 ESG 뉴스가 없습니다. 뉴스 수집 후 영역별 트렌드 분석과 자소서·면접 가이드를 확인할 수
        있습니다.
      </p>
    );
  }

  const barTone: Record<EsgCategory, string> = {
    E: "bg-green-500",
    S: "bg-blue-500",
    G: "bg-purple-500",
  };

  const hotGuide = dashboard.guides[dashboard.hotCategory];

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[#085041]/15 bg-gradient-to-br from-[#085041]/5 to-[#1D9E75]/5 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#085041]">7일 ESG 트렌드 대시보드</p>
        <h3 className="mt-1 text-lg font-bold text-[#111827]">
          {dashboard.periodLabel} 뉴스 {dashboard.totalArticles}건 분석
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">{dashboard.trendSummary}</p>
        <p className="mt-2 text-sm font-medium text-[#085041]">{dashboard.careerFocus}</p>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-100 bg-white p-5">
          <h4 className="font-semibold text-[#111827]">영역별 언급 비중</h4>
          <p className="text-xs text-slate-500 mt-1">E/S/G 뉴스 분류 기준 집계</p>
          <div className="mt-4 space-y-4">
            {dashboard.categoryStats.map((stat) => (
              <StatBar
                key={stat.category}
                label={stat.label}
                percent={stat.percent}
                count={stat.count}
                tone={barTone[stat.category]}
              />
            ))}
          </div>
          <p className="mt-4 text-sm text-slate-600">
            가장 많이 다뤄진 영역:{" "}
            <span className="font-semibold text-[#085041]">{dashboard.hotCategoryLabel}</span>
          </p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-5">
          <h4 className="font-semibold text-[#111827]">핵심 키워드 TOP</h4>
          <p className="text-xs text-slate-500 mt-1">제목·요약에서 반복 등장한 키워드</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {dashboard.topKeywords.length > 0 ? (
              dashboard.topKeywords.map((item) => (
                <span
                  key={`${item.category}-${item.keyword}`}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${ESG_CATEGORY_BADGE_CLASS[item.category]}`}
                >
                  {item.keyword}
                  <span className="opacity-70">{item.count}</span>
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-500">키워드 집계 데이터가 없습니다.</span>
            )}
          </div>

          {dashboard.headlineExamples.length > 0 ? (
            <div className="mt-5 pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 mb-2">이번 주 헤드라인 예시</p>
              <ul className="space-y-1.5 text-sm text-slate-700">
                {dashboard.headlineExamples.slice(0, 4).map((item) => (
                  <li key={item.id} className="line-clamp-1">
                    <span className={`mr-1.5 text-xs ${ESG_CATEGORY_BADGE_CLASS[item.category]} rounded px-1.5 py-0.5`}>
                      {item.category}
                    </span>
                    {item.title}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-xl border border-slate-100 bg-white p-5">
        <h4 className="font-semibold text-[#111827]">
          취준생·대학생 가이드 — {dashboard.hotCategoryLabel} 중심
        </h4>
        <p className="text-sm text-slate-600 mt-1">{hotGuide.summary}</p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-lg bg-slate-50 border border-slate-100 p-4">
            <p className="text-sm font-semibold text-[#085041] mb-2">자소서에 쓸 포인트</p>
            <ul className="space-y-2 text-sm text-slate-700 list-disc list-inside">
              {hotGuide.resumeTips.map((tip) => (
                <li key={tip} className="leading-relaxed">
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg bg-slate-50 border border-slate-100 p-4">
            <p className="text-sm font-semibold text-[#085041] mb-2">면접 대비 포인트</p>
            <ul className="space-y-2 text-sm text-slate-700 list-disc list-inside">
              {hotGuide.interviewTips.map((tip) => (
                <li key={tip} className="leading-relaxed">
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-[#085041]/15 bg-[#085041]/5 p-4">
          <p className="text-sm font-semibold text-[#085041] mb-2">예상 면접 질문 (스스로 답해 보기)</p>
          <ol className="space-y-2 text-sm text-slate-700 list-decimal list-inside">
            {hotGuide.sampleQuestions.map((question) => (
              <li key={question} className="leading-relaxed">
                {question}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="rounded-xl border border-slate-100 bg-white p-5">
        <h4 className="font-semibold text-[#111827]">영역별 추가 준비 팁</h4>
        <p className="text-xs text-slate-500 mt-1">핫 이슈 외 E/S/G 각 영역별 1줄 요약</p>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {CATEGORY_ORDER.map((category) => (
            <div key={category} className="rounded-lg border border-slate-100 p-3">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ESG_CATEGORY_BADGE_CLASS[category]}`}
              >
                {ESG_CATEGORY_LABEL[category]}
              </span>
              <p className="mt-2 text-sm text-slate-700 leading-relaxed">{dashboard.guides[category].summary}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h4 className="font-semibold text-[#111827] mb-1">이번 주 반드시 읽을 기사</h4>
        <p className="text-sm text-slate-600 mb-4">원문 → 핵심 요약 → 대학생 맞춤 트렌드 요약 순서로 읽어보세요.</p>

        {grouped.map((group) => (
          <div key={group.category} className="mb-6 last:mb-0">
            <h5
              className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold mb-3 ${ESG_CATEGORY_BADGE_CLASS[group.category]}`}
            >
              {group.label} 주요 기사
            </h5>

            <ul className="space-y-3">
              {group.items.map((item) => (
                <li
                  key={item.id}
                  className="rounded-lg border border-slate-100 bg-white p-4 hover:border-[#085041]/30 transition-colors"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs text-slate-500">{formatDate(item.publishedAt)}</span>
                    {item.source ? <span className="text-xs text-slate-400">· {item.source}</span> : null}
                  </div>

                  <Link
                    href={`/news/${encodeURIComponent(item.id)}`}
                    className="font-medium text-[#111827] hover:text-[#085041] hover:underline"
                  >
                    {item.title}
                  </Link>

                  {item.studentTrendSummary ? (
                    <p className="mt-2 text-sm text-slate-600 line-clamp-2">{item.studentTrendSummary}</p>
                  ) : item.summaryLines?.[0] ? (
                    <p className="mt-2 text-sm text-slate-600 line-clamp-2">{item.summaryLines[0]}</p>
                  ) : null}

                  <Link
                    href={`/news/${encodeURIComponent(item.id)}`}
                    className="inline-block mt-3 text-xs font-medium text-[#085041] hover:underline"
                  >
                    원문·요약·트렌드 보기 →
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <Link href="/news" className="inline-flex text-sm font-medium text-[#085041] hover:underline">
        최근 7일 전체 뉴스 보기 →
      </Link>
    </div>
  );
}
