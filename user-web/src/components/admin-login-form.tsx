"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

export default function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("admin@esg-action.kr");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "로그인에 실패했습니다.");
      }

      const next = searchParams.get("next") ?? "/admin/dashboard";
      router.push(next);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
      <input
        className="w-full border border-slate-200 rounded-md p-2.5 text-sm"
        placeholder="이메일"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        autoComplete="username"
        required
      />
      <input
        className="w-full border border-slate-200 rounded-md p-2.5 text-sm"
        placeholder="비밀번호"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        autoComplete="current-password"
        required
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#085041] text-white rounded-md py-2.5 text-sm font-medium disabled:opacity-60"
      >
        {loading ? "로그인 중..." : "로그인"}
      </button>
      <p className="text-xs text-slate-500">
        로컬 개발 기본 계정: admin@esg-action.kr / demo-admin (`.env.local`의 `ADMIN_EMAIL`, `ADMIN_PASSWORD`로 변경 가능)
      </p>
    </form>
  );
}
