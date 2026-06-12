import AppShell from "@/components/app-shell";
import InfoTabs from "@/components/info-tabs";
import { loadRecentNewsPeriod } from "@/lib/recent-news";

export default async function InfoPage() {
  const recentPeriod = await loadRecentNewsPeriod();

  return (
    <AppShell
      title="ESG 정보"
      description="2026.6.1 이후 누적 ESG 트렌드 분석, 공식 자료, 용어 사전, 커리어 정보를 확인할 수 있습니다."
    >
      <InfoTabs featuredArticles={recentPeriod.items} />
    </AppShell>
  );
}
