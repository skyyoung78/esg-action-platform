import AppShell from "@/components/app-shell";
import JobsList from "@/components/jobs-list";
import { loadRecentJobs } from "@/lib/recent-jobs";

export default async function JobsPage() {
  const items = await loadRecentJobs(60);

  return (
    <AppShell
      title="채용 공고"
      description="사람인·잡코리아 ESG 관련 채용공고를 지역별로 확인하고 지원 페이지로 이동합니다."
    >
      <JobsList items={items} />
    </AppShell>
  );
}
