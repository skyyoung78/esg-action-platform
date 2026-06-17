import Link from "next/link";
import type { NewsItemView } from "@/components/news-list";
import { ESG_CATEGORY_BADGE_CLASS, type EsgCategory } from "@/lib/esg-news-filter";
import { buildEsgTrendDashboard } from "@/lib/esg-trend-analysis";

const BAR_TONE: Record<EsgCategory, string> = {
  E: "bg-green-500",
  S: "bg-blue-500",
  G: "bg-purple-500",
};

function StatBar({
  label,
  percent,
  count,
  tone,
}: {
  label: string;
  percent: number;
  count: number;
  tone: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="font-medium text-slate-800">{label}</span>
        <span className="text-slate-500">
          {count}건 · {percent}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.max(percent, 4)}%` }} />
      </div>
    </div>
  );
}

type HomeEsgTrendDashboardProps = {
  articles: NewsItemView[];
};

export default function HomeEsgTrendDashboard({ articles }: HomeEsgTrendDashboardProps) {
  if (articles.length === 0) {
    return (
      <section className="mb-6 rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center">
        <h2 className="font-semibold text-[#111827]">ESG 트렌드 대시보드</h2>
        <p className="mt-2 text-sm text-slate-500">
          뉴스가 수집되면 E/S/G 영역별 트렌드와 핵심 키워드를 홈에서 바로 확인할 수 있습니다.
        </p>
        <Link href="/news" className="inline-block mt-4 text-sm font-medium text-[#085041] hover:underline">
          ESG 뉴스 보기 →
        </Link>
      </section>
    );
  }

  const dashboard = buildEsgTrendDashboard(articles);

  return (
    <section className="mb-6">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#085041]">ESG 트렌드 대시보드</p>
          <h2 className="text-xl font-bold text-[#111827]">
            {dashboard.periodLabel} · {dashboard.totalArticles}건 분석
          </h2>
        </div>
        <Link href="/info" className="text-sm font-medium text-[#085041] hover:underline">
          자소서·면접 가이드 →
        </Link>
      </div>

      <div className="rounded-xl border border-[#085041]/15 bg-gradient-to-br from-[#085041]/5 to-[#1D9E75]/5 p-5 mb-4">
        <p className="text-sm leading-relaxed text-slate-700">{dashboard.trendSummary}</p>
        <p className="mt-2 text-sm font-medium text-[#085041]">{dashboard.careerFocus}</p>
        <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[#085041] border border-[#085041]/15">
          이번 핫 이슈
          <span className={`rounded-full px-2 py-0.5 ${ESG_CATEGORY_BADGE_CLASS[dashboard.hotCategory]}`}>
            {dashboard.hotCategoryLabel}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <article className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-[#111827]">영역별 언급 비중</h3>
          <p className="text-xs text-slate-500 mt-1">E / S / G 뉴스 분류 기준</p>
          <div className="mt-4 space-y-3">
            {dashboard.categoryStats.map((stat) => (
              <StatBar
                key={stat.category}
                label={stat.label}
                percent={stat.percent}
                count={stat.count}
                tone={BAR_TONE[stat.category]}
              />
            ))}
          </div>
        </article>

        <article className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-[#111827]">핵심 키워드 TOP</h3>
          <p className="text-xs text-slate-500 mt-1">제목·요약에서 자주 등장한 키워드</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {dashboard.topKeywords.slice(0, 8).map((item) => (
              <span
                key={`${item.category}-${item.keyword}`}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${ESG_CATEGORY_BADGE_CLASS[item.category]}`}
              >
                {item.keyword}
                <span className="opacity-70">{item.count}</span>
              </span>
            ))}
          </div>

          {dashboard.headlineExamples.length > 0 ? (
            <ul className="mt-5 pt-4 border-t border-slate-100 space-y-2">
              <p className="text-xs font-semibold text-slate-500 mb-2">주요 헤드라인</p>
              {dashboard.headlineExamples.slice(0, 3).map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/news/${encodeURIComponent(item.id)}`}
                    className="text-sm text-slate-700 hover:text-[#085041] hover:underline line-clamp-1"
                  >
                    <span
                      className={`mr-1.5 text-[10px] rounded px-1.5 py-0.5 ${ESG_CATEGORY_BADGE_CLASS[item.category]}`}
                    >
                      {item.category}
                    </span>
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </article>
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <Link href="/news" className="font-medium text-[#085041] hover:underline">
          ESG 뉴스 전체 보기 →
        </Link>
        <Link href="/info" className="font-medium text-slate-600 hover:text-[#085041] hover:underline">
          E/S/G별 취업 준비 가이드 →
        </Link>
      </div>
    </section>
  );
}
