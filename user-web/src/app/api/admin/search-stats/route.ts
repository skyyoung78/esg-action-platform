import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { readSearchQueryLogs } from "@/lib/local-search-queries";
import { buildSearchQueryStats } from "@/lib/search-query-stats";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "인증이 필요합니다." }, { status: 401 });
  }

  const stats = buildSearchQueryStats(readSearchQueryLogs());
  return NextResponse.json({ ok: true, stats });
}
