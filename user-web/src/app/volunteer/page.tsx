import AppShell from "@/components/app-shell";
import { volunteers } from "@/lib/mock-data";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export default async function VolunteerPage() {
  const supabase = createSupabaseServerClient();
  let items = volunteers;

  if (supabase) {
    const { data } = await supabase
      .from("volunteers")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(24);

    if (data && data.length > 0) {
      items = data.map((row) => ({
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
    <AppShell title="봉사활동" description="관리자가 등록한 봉사 공고를 확인하고 신청 페이지로 이동합니다.">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((volunteer) => (
          <article key={volunteer.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            {volunteer.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={volunteer.imageUrl} alt={volunteer.title} className="w-full h-44 object-cover rounded-lg mb-3" />
            ) : null}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs rounded px-2 py-1 bg-slate-100">{volunteer.category}</span>
              {volunteer.is1365 ? <span className="text-xs rounded px-2 py-1 bg-green-100 text-green-700">1365 인증</span> : null}
            </div>
            <h2 className="font-semibold">{volunteer.title}</h2>
            <p className="text-sm text-slate-600 mt-2">모집 인원: {volunteer.capacity}</p>
            <p className="text-sm mt-1">{volunteer.description}</p>
            <a
              href={volunteer.targetOutlinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 rounded-md bg-[#085041] text-white px-3 py-2 text-sm"
            >
              {volunteer.targetOutlinkUrl.includes("forms.gle") ? "구글 폼으로 신청하기" : "학교 홈페이지에서 신청하기"}
            </a>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
