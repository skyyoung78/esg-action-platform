export default function AdminDashboardPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <h1 className="text-2xl font-bold">관리자 대시보드</h1>
      <p className="text-sm text-slate-600 mt-1">봉사 공고 등록과 운영 통계를 관리하는 화면입니다.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <article className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-slate-500">총 클릭 수</p>
          <p className="text-2xl font-bold mt-1">248</p>
        </article>
        <article className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-slate-500">등록 봉사 수</p>
          <p className="text-2xl font-bold mt-1">12</p>
        </article>
        <article className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-slate-500">활성 공고</p>
          <p className="text-2xl font-bold mt-1">8</p>
        </article>
      </div>

      <section className="bg-white rounded-xl p-4 shadow-sm mt-6">
        <h2 className="font-semibold">봉사 등록 (데모 폼)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <input className="border rounded-md p-2 text-sm" placeholder="제목" />
          <input className="border rounded-md p-2 text-sm" placeholder="카테고리 (E/S)" />
          <input className="border rounded-md p-2 text-sm" placeholder="모집 인원" />
          <input className="border rounded-md p-2 text-sm" placeholder="대표 이미지 URL" />
          <textarea className="border rounded-md p-2 text-sm md:col-span-2" rows={4} placeholder="봉사 설명" />
          <input className="border rounded-md p-2 text-sm md:col-span-2" placeholder="신청 링크 (target_outlink_url)" />
        </div>
        <button type="button" className="mt-4 bg-[#085041] text-white rounded-md px-4 py-2 text-sm font-medium">
          등록 (데모)
        </button>
      </section>
    </main>
  );
}
