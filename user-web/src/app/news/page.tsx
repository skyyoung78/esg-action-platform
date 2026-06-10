import AppShell from "@/components/app-shell";
import NewsTabs from "@/components/news-tabs";
import { getNewsWindow } from "@/lib/news-window";
import { buildEmptyPeriod, loadRecentNewsPeriod } from "@/lib/recent-news";

export default async function NewsPage() {
  const period = await loadRecentNewsPeriod();
  const weeks = period.items.length > 0 ? [period] : [buildEmptyPeriod(getNewsWindow())];

  return (
    <AppShell
      title="ESG 뉴스"
      description="접속일 기준 최근 7일간의 ESG 뉴스와 기업별 취업 준비 대시보드를 확인할 수 있습니다."
    >
      <NewsTabs
        weeks={weeks}
        emptyMessage="최근 7일간 수집된 ESG 뉴스가 없습니다. 잠시 후 다시 확인해 주세요."
      />
    </AppShell>
  );
}
