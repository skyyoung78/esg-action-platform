import Link from "next/link";

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <section className="w-full max-w-md bg-white rounded-xl p-6 shadow-sm">
        <h1 className="text-xl font-bold">관리자 로그인</h1>
        <p className="text-sm text-slate-600 mt-1">관리자 계정으로 로그인 후 대시보드를 사용할 수 있습니다.</p>

        <form className="mt-5 space-y-3">
          <input className="w-full border rounded-md p-2 text-sm" placeholder="이메일" type="email" />
          <input className="w-full border rounded-md p-2 text-sm" placeholder="비밀번호" type="password" />
          <button type="button" className="w-full bg-[#085041] text-white rounded-md py-2 text-sm font-medium">
            로그인 (데모)
          </button>
        </form>

        <Link href="/admin/dashboard" className="inline-block mt-4 text-sm text-[#085041] hover:underline">
          데모 대시보드 보기
        </Link>
      </section>
    </main>
  );
}
