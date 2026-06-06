import Link from "next/link";
import type { NewsItemView } from "@/components/news-list";
import {
  ESG_CATEGORY_BADGE_CLASS,
  ESG_CATEGORY_LABEL,
  type EsgCategory,
} from "@/lib/esg-news-filter";

const CATEGORY_ORDER: EsgCategory[] = ["E", "S", "G"];

function formatDate(publishedAt?: string): string {
  if (!publishedAt) return "";
  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

export default function InfoEsgOverview({ articles }: { articles: NewsItemView[] }) {
  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    label: ESG_CATEGORY_LABEL[category],
    items: articles.filter((item) => item.category === category).slice(0, 3),
  })).filter((group) => group.items.length > 0);

  if (articles.length === 0) {
    return (
      <p className="text-sm text-slate-500 rounded-lg border border-dashed border-slate-200 p-6 text-center">
        최근 7일간 수집된 주요 ESG 기사가 없습니다. 뉴스 수집 후 이 탭에서 원문·요약·트렌드 분석을 확인할 수
        있습니다.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-slate-50 border border-slate-100 p-4 text-sm text-slate-600">
        <p className="font-medium text-slate-800">읽는 순서: 원문 → 핵심 요약 → 대학생 ESG 트렌드 요약</p>
        <p className="mt-1">각 기사를 클릭하면 3단계로 정리된 상세 페이지로 이동합니다.</p>
      </div>

      {grouped.map((group) => (
        <section key={group.category}>
          <h3
            className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold mb-3 ${ESG_CATEGORY_BADGE_CLASS[group.category]}`}
          >
            {group.label} 주요 기사
          </h3>

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

                <Link href={`/news/${encodeURIComponent(item.id)}`} className="font-medium text-[#111827] hover:text-[#085041] hover:underline">
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
        </section>
      ))}

      <Link href="/news" className="inline-flex text-sm font-medium text-[#085041] hover:underline">
        최근 7일 전체 뉴스 보기 →
      </Link>
    </div>
  );
}
