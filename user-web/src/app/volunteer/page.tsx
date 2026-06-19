import Link from "next/link";
import AppShell from "@/components/app-shell";
import VolunteerApplyButton from "@/components/volunteer-apply-button";
import { loadPublicVolunteers } from "@/lib/volunteers-data";

export default async function VolunteerPage() {
  const items = await loadPublicVolunteers(24);

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
              {volunteer.is1365 ? (
                <span className="text-xs rounded px-2 py-1 bg-green-100 text-green-700">1365 인증</span>
              ) : null}
            </div>
            <h2 className="font-semibold">{volunteer.title}</h2>
            <p className="text-sm text-slate-600 mt-2">모집 인원: {volunteer.capacity}</p>
            <p className="text-sm mt-1">{volunteer.description}</p>
            <VolunteerApplyButton
              volunteerId={volunteer.id}
              targetUrl={volunteer.targetOutlinkUrl}
              label={
                volunteer.targetOutlinkUrl.includes("forms.gle")
                  ? "구글 폼으로 신청하기"
                  : "학교 홈페이지에서 신청하기"
              }
            />
          </article>
        ))}
      </div>

      <div className="mt-10 pt-6 border-t border-slate-200 flex justify-center">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:border-[#085041]/40 hover:text-[#085041] transition-colors"
        >
          관리자 페이지
        </Link>
      </div>
    </AppShell>
  );
}
