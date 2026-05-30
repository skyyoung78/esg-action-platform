import Link from "next/link";
import AppShell from "@/components/app-shell";
import { jobs, newsItems, volunteers } from "@/lib/mock-data";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { normalizeExternalUrl } from "@/lib/url";
import { fetchLiveNews } from "@/lib/live-news";

export default async function Home() {
  const liveTopNews = await fetchLiveNews(3);
  const supabase = createSupabaseServerClient();
  let homeNews =
    liveTopNews.length > 0
      ? liveTopNews.map((item) => ({
          id: item.originalUrl,
          title: item.title,
          summary: ["", "", ""] as [string, string, string],
          category: "E" as const,
          source: item.source,
          originalUrl: item.originalUrl,
        }))
      : newsItems.slice(0, 3);
  let homeJobs = jobs.slice(0, 3);
  let homeVolunteers = volunteers;

  if (supabase) {
    const [newsRes, jobsRes, volunteerRes] = await Promise.all([
      supabase
        .from("news")
        .select("id,title,summary,esg_category,source,original_url,published_at")
        .order("published_at", { ascending: false })
        .limit(3),
      supabase
        .from("jobs")
        .select("id,title,company,job_type,deadline,apply_url,created_at")
        .order("deadline", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(3),
      supabase.from("volunteers").select("*").is("deleted_at", null).order("created_at", { ascending: false }).limit(5),
    ]);

    if (liveTopNews.length === 0 && newsRes.data && newsRes.data.length > 0) {
      homeNews = newsRes.data.map((row) => ({
        id: String(row.id),
        title: String(row.title),
        summary: ["", "", ""] as [string, string, string],
        category: String(row.esg_category) as "E" | "S" | "G",
        source: String(row.source ?? ""),
        originalUrl: String(row.original_url),
      }));
    }

    if (jobsRes.data && jobsRes.data.length > 0) {
      homeJobs = jobsRes.data.map((row) => {
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

    if (volunteerRes.data && volunteerRes.data.length > 0) {
      homeVolunteers = volunteerRes.data.map((row) => ({
        id: String(row.id),
        title: String(row.title),
        category: String(row.esg_category) as "E" | "S",
        capacity: String(row.capacity ?? "미정"),
        description: String(row.description ?? ""),
        imageUrl: typeof row.image_url === "string" ? row.image_url : undefined,
        targetOutlinkUrl: String(row.target_outlink_url),
        is1365: Boolean(row.is_1365),
      }));
    }
  }

  return (
    <AppShell title="대학생 ESG 액션 플랫폼" description="뉴스 · 채용 · ESG 정보 · 봉사활동을 한 곳에서 확인합니다.">
      <section className="bg-gradient-to-r from-[#085041] to-[#1D9E75] rounded-xl p-6 text-white mb-6">
        <h2 className="text-xl font-bold">오늘의 추천 봉사활동</h2>
        <p className="mt-2 text-sm">환경 정화, 멘토링 등 대학생 참여형 활동을 확인해보세요.</p>
        <Link href="/volunteer" className="inline-block mt-4 px-4 py-2 bg-white text-[#085041] rounded-md text-sm font-semibold">
          봉사활동 보러가기
        </Link>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <article className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold mb-3">뉴스 TOP3</h3>
          <ul className="space-y-2 text-sm">
            {homeNews.map((item) => (
              <li key={item.id}>
                {(() => {
                  const articleUrl = normalizeExternalUrl(item.originalUrl);
                  return articleUrl ? (
                    <a href={articleUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {item.title}
                    </a>
                  ) : (
                    <span className="text-slate-500">{item.title} (원문 링크 확인 중)</span>
                  );
                })()}
              </li>
            ))}
          </ul>
        </article>
        <article className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold mb-3">마감 임박 채용 TOP3</h3>
          <ul className="space-y-2 text-sm">
            {homeJobs.map((job) => (
              <li key={job.id}>
                <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  [{job.deadline}] {job.title} - {job.company}
                </a>
              </li>
            ))}
          </ul>
        </article>
      </div>

      <section className="mt-6 bg-white rounded-xl p-4 shadow-sm">
        <h3 className="font-semibold mb-3">새로 등록된 봉사활동</h3>
        <ul className="space-y-2 text-sm">
          {homeVolunteers.map((item) => (
            <li key={item.id}>
              {item.title} · 모집 {item.capacity}
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}
