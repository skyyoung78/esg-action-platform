import AppShell from "@/components/app-shell";
import InfoTabs from "@/components/info-tabs";

export default function InfoPage() {
  return (
    <AppShell
      title="ESG 정보"
      description="공신력 있는 공식 자료 요약, 용어 사전, 커리어 정보를 확인할 수 있습니다."
    >
      <InfoTabs />
    </AppShell>
  );
}
