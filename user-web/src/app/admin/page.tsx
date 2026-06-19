import { Suspense } from "react";
import AdminLoginForm from "@/components/admin-login-form";

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <section className="w-full max-w-md bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <h1 className="text-xl font-bold text-[#111827]">관리자 로그인</h1>
        <p className="text-sm text-slate-600 mt-1">관리자 계정으로 로그인 후 대시보드를 사용할 수 있습니다.</p>
        <Suspense fallback={<p className="mt-5 text-sm text-slate-500">로딩 중...</p>}>
          <AdminLoginForm />
        </Suspense>
      </section>
    </main>
  );
}
