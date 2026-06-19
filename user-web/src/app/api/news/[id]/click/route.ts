import { NextResponse } from "next/server";
import { recordNewsClick } from "@/lib/news-click-tracker";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    type?: string;
    title?: string;
    category?: string;
  };

  const clickType = body.type === "outlink" ? "outlink" : "detail";
  const userAgent = request.headers.get("user-agent");

  recordNewsClick(id, clickType, userAgent, {
    title: body.title,
    category: body.category,
  });

  return NextResponse.json({ ok: true });
}
