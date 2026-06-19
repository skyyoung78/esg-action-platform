import { NextResponse } from "next/server";
import { fetchCompanyDisclosure } from "@/lib/company-disclosure";
import { recordSearchQuery } from "@/lib/record-search-query";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name")?.trim() ?? "";
  const stockCode = searchParams.get("stockCode")?.trim() ?? undefined;

  if (name.length < 1) {
    return NextResponse.json({ error: "기업명을 입력해 주세요." }, { status: 400 });
  }

  const result = await fetchCompanyDisclosure({ name, stockCode });

  recordSearchQuery({
    query: name,
    searchType: "disclosure",
    context: stockCode ?? null,
    resultCount: result ? 1 : 0,
    userAgent: request.headers.get("user-agent"),
  });

  if (!result) {
    return NextResponse.json(
      { error: "검색 결과에 해당하는 상장사를 찾지 못했습니다." },
      { status: 404 },
    );
  }

  return NextResponse.json(result);
}
