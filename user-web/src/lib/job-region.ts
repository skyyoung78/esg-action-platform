/** 대한민국 시·도 표준 순서 */
export const KOREA_REGION_ORDER = [
  "서울",
  "경기",
  "인천",
  "부산",
  "대구",
  "광주",
  "대전",
  "울산",
  "세종",
  "강원",
  "충북",
  "충남",
  "전북",
  "전남",
  "경북",
  "경남",
  "제주",
] as const;

export type KoreaRegion = (typeof KOREA_REGION_ORDER)[number];

const REGION_PREFIXES: Array<{ prefix: string; region: KoreaRegion }> = [
  { prefix: "서울", region: "서울" },
  { prefix: "경기", region: "경기" },
  { prefix: "인천", region: "인천" },
  { prefix: "부산", region: "부산" },
  { prefix: "대구", region: "대구" },
  { prefix: "광주", region: "광주" },
  { prefix: "대전", region: "대전" },
  { prefix: "울산", region: "울산" },
  { prefix: "세종", region: "세종" },
  { prefix: "강원", region: "강원" },
  { prefix: "충북", region: "충북" },
  { prefix: "충남", region: "충남" },
  { prefix: "전북", region: "전북" },
  { prefix: "전남", region: "전남" },
  { prefix: "경북", region: "경북" },
  { prefix: "경남", region: "경남" },
  { prefix: "제주", region: "제주" },
];

export function extractRegionFromLocation(location: string | null | undefined): KoreaRegion | null {
  const raw = String(location ?? "").trim();
  if (!raw) return null;

  if (raw.includes("세종")) return "세종";

  for (const { prefix, region } of REGION_PREFIXES) {
    if (raw.startsWith(prefix)) return region;
  }

  return null;
}

export function sortRegions(regions: Iterable<string>): string[] {
  const unique = [...new Set(regions)];
  return unique.sort((a, b) => {
    const aIndex = KOREA_REGION_ORDER.indexOf(a as KoreaRegion);
    const bIndex = KOREA_REGION_ORDER.indexOf(b as KoreaRegion);
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b, "ko");
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
}

export function buildRegionFilters(items: Array<{ region?: string | null }>): Array<{ value: string; label: string }> {
  const counts = new Map<string, number>();

  for (const item of items) {
    const region = item.region ?? "지역 미정";
    counts.set(region, (counts.get(region) ?? 0) + 1);
  }

  const regions = sortRegions(
    [...counts.keys()].filter((region) => region !== "지역 미정"),
  );

  const filters: Array<{ value: string; label: string }> = [
    { value: "all", label: "전체" },
    ...regions.map((region) => ({
      value: region,
      label: `${region} (${counts.get(region) ?? 0})`,
    })),
  ];

  if (counts.has("지역 미정")) {
    filters.push({
      value: "지역 미정",
      label: `지역 미정 (${counts.get("지역 미정") ?? 0})`,
    });
  }

  return filters;
}
