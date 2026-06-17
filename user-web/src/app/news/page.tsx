import AppShell from "@/components/app-shell";
import NewsTabs from "@/components/news-tabs";
import { loadNewsPageData } from "@/lib/recent-news";

export default async function NewsPage() {
  const { weeks, recentWindow } = await loadNewsPageData();

  return (
    <AppShell
      title="ESG 뉴스"
      description="최근 7일 ESG 뉴스를 확인하고, 키워드 검색 시 2026.6.1 이후 저장된 전체 기사에서 찾을 수 있습니다."
    >
      <NewsTabs
        weeks={weeks}
        recentPeriodLabel={recentWindow.label}
        emptyMessage="최근 7일간 수집된 ESG 뉴스가 없습니다. 키워드 검색으로 저장된 이전 기사를 찾아볼 수 있습니다."
      />
    </AppShell>
  );
}
