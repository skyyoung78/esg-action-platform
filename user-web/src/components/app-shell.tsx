import Link from "next/link";
import { ReactNode } from "react";

const menus = [
  { href: "/", label: "홈" },
  { href: "/news", label: "뉴스" },
  { href: "/jobs", label: "채용" },
  { href: "/info", label: "ESG정보" },
  { href: "/volunteer", label: "봉사활동" },
];

export default function AppShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f0f4f2] text-[#111827]">
      <nav className="hidden md:flex h-14 bg-[#085041] text-white items-center px-6 sticky top-0 z-50">
        <p className="font-bold mr-8">ESG 액션</p>
        <div className="flex gap-5 text-sm">
          {menus.map((menu) => (
            <Link key={menu.href} href={menu.href} className="hover:underline underline-offset-4">
              {menu.label}
            </Link>
          ))}
        </div>
      </nav>

      <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-4 md:py-7 page-wrap">
        <header className="mb-5">
          <h1 className="text-2xl font-bold">{title}</h1>
          {description ? <p className="text-sm text-slate-600 mt-1">{description}</p> : null}
        </header>
        {children}
      </div>

      <nav className="flex md:hidden fixed bottom-0 inset-x-0 bg-white border-t z-50 h-16 items-center justify-around text-sm">
        {menus.map((menu) => (
          <Link key={menu.href} href={menu.href} className="font-medium text-slate-700">
            {menu.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
