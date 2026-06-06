import Link from "next/link";
import AppShell from "@/components/app-shell";
import { newsItems, volunteers } from "@/lib/mock-data";
import { loadRecentJobs } from "@/lib/recent-jobs";
import { loadRecentNewsPeriod } from "@/lib/recent-news";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { normalizeExternalUrl } from "@/lib/url";

export default async function Home() {
  const recentPeriod = await loadRecentNewsPeriod();
  let homeNews =
    recentPeriod.items.length > 0
      ? recentPeriod.items.slice(0, 3).map((item) => ({
          id: item.id,
          title: item.title,
          originalUrl: item.originalUrl,
        }))
      : newsItems.slice(0, 3).map((item) => ({
          id: item.id,
          title: item.title,
          originalUrl: item.originalUrl,
        }));
  const homeJobs = (await loadRecentJobs(3)).map((item) => ({
    id: item.id,
    title: item.title,
    company: item.company,
    jobType: item.jobType,
    deadline: item.deadline,
    applyUrl: item.applyUrl,
  }));
  let homeVolunteers = volunteers;

  const supabase = createSupabaseServerClient();
  if (supabase) {
    const volunteerRes = await supabase
      .from("volunteers")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(5);

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
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">최근 7일 뉴스 TOP3</h3>
            <Link href="/news" className="text-xs text-[#085041] hover:underline">
              전체 뉴스 보기
            </Link>
          </div>
          <ul className="space-y-2 text-sm">
            {homeNews.map((item) => (
              <li key={item.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <Link
                  href={`/news/${encodeURIComponent(item.id)}`}
                  className="hover:text-[#085041] hover:underline"
                >
                  {item.title}
                </Link>
                {normalizeExternalUrl(item.originalUrl) ? (
                  <a
                    href={normalizeExternalUrl(item.originalUrl)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-400 hover:text-[#085041] hover:underline shrink-0"
                  >
                    원문 ↗
                  </a>
                ) : null}
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
