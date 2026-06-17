import AppShell from "@/components/app-shell";

export default function NewsLoading() {
  return (
    <AppShell title="ESG 뉴스" description="최근 7일 ESG 뉴스를 불러오는 중입니다...">
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-white rounded-xl border border-slate-100" />
        <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-4">
          <div className="h-6 bg-slate-100 rounded w-48" />
          <div className="h-4 bg-slate-100 rounded w-full max-w-md" />
          <div className="h-10 bg-slate-100 rounded" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-24 bg-slate-50 rounded-lg border border-slate-100" />
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
