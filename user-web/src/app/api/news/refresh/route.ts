import { NextResponse } from "next/server";
import { refreshRollingNewsInBackground } from "@/lib/recent-news";

export const maxDuration = 60;

export async function POST() {
  try {
    const result = await refreshRollingNewsInBackground();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "뉴스 갱신 중 오류가 발생했습니다.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
