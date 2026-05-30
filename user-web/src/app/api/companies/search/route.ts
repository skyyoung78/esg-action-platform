import { NextResponse } from "next/server";
import { searchCompanies } from "@/lib/company-disclosure";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 1) {
    return NextResponse.json({ companies: [] });
  }

  const companies = await searchCompanies(q);
  return NextResponse.json({ companies });
}
