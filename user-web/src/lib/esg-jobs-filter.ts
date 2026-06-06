export const ESG_JOB_KEYWORDS = [
  "ESG",
  "지속가능",
  "CSR",
  "탄소중립",
  "환경경영",
  "사회공헌",
] as const;

export type JobCategory = "ESG" | "CSR" | "사회공헌" | "기타";

const CSR_KEYWORDS = ["csr", "기업시민", "사회적책임"];
const SOCIAL_KEYWORDS = ["사회공헌", "나눔", "봉사", "기부"];

export function isEsgRelatedJob(title: string, company = ""): boolean {
  const haystack = `${title} ${company}`.toLowerCase();
  return ESG_JOB_KEYWORDS.some((keyword) => haystack.includes(keyword.toLowerCase()));
}

export function classifyJobCategory(title: string, company = ""): JobCategory {
  const haystack = `${title} ${company}`.toLowerCase();

  if (SOCIAL_KEYWORDS.some((keyword) => haystack.includes(keyword))) {
    return "사회공헌";
  }
  if (CSR_KEYWORDS.some((keyword) => haystack.includes(keyword))) {
    return "CSR";
  }
  if (haystack.includes("esg") || haystack.includes("지속가능") || haystack.includes("탄소") || haystack.includes("환경")) {
    return "ESG";
  }
  return "기타";
}
