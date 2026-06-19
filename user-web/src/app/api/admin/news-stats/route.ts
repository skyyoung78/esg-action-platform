import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { readNewsClickLogs } from "@/lib/local-news-clicks";
import { buildNewsClickStats } from "@/lib/news-click-stats";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "인증이 필요합니다." }, { status: 401 });
  }

  const stats = buildNewsClickStats(readNewsClickLogs());
  return NextResponse.json({ ok: true, stats });
}
