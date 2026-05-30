import AppShell from "@/components/app-shell";
import { jobs } from "@/lib/mock-data";
import { createSupabaseServerClient } from "@/lib/supabase-server";

function ddayTone(deadline: string) {
  if (deadline === "D-2" || deadline === "D-1" || deadline === "D-0") return "bg-red-100 text-red-700";
  if (deadline === "D-3" || deadline === "D-4" || deadline === "D-5" || deadline === "D-6" || deadline === "D-7") {
    return "bg-orange-100 text-orange-700";
  }
  return "bg-green-100 text-green-700";
}

export default async function JobsPage() {
  const supabase = createSupabaseServerClient();
  let items = jobs;

  if (supabase) {
    const { data } = await supabase
      .from("jobs")
      .select("id,title,company,job_type,deadline,apply_url,created_at")
      .order("deadline", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(24);

    if (data && data.length > 0) {
      items = data.map((row) => {
        const label = row.deadline
          ? (() => {
              const now = new Date();
              const end = new Date(`${row.deadline}T23:59:59`);
              const diffMs = end.getTime() - now.getTime();
              const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
              if (diffDays < 0) return "마감";
              return `D-${diffDays}`;
            })()
          : "상시";

        return {
          id: String(row.id),
          title: String(row.title),
          company: String(row.company),
          jobType: String(row.job_type ?? "미정"),
          deadline: label,
          applyUrl: String(row.apply_url),
        };
      });
    }
  }

  return (
    <AppShell title="채용 공고" description="마감 임박순 채용 정보를 확인하고 지원 페이지로 이동합니다.">
      <div className="bg-white rounded-xl p-4 shadow-sm mb-4 text-sm">
        직무 필터: 전체 / ESG / 사회공헌 / CSR
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((job) => (
          <article key={job.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${ddayTone(job.deadline)}`}>
              {job.deadline}
            </span>
            <h2 className="font-semibold mt-3">{job.title}</h2>
            <p className="text-sm text-slate-600 mt-1">{job.company} · {job.jobType}</p>
            <a
              href={job.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 text-sm font-medium text-[#085041] hover:underline"
            >
              지원 페이지 이동
            </a>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
