export type NewsItem = {
  id: string;
  title: string;
  summary: [string, string, string];
  category: "E" | "S" | "G";
  source: string;
  originalUrl: string;
  isFallback?: boolean;
};

export type JobItem = {
  id: string;
  title: string;
  company: string;
  jobType: string;
  deadline: string;
  applyUrl: string;
};

export type VolunteerItem = {
  id: string;
  title: string;
  category: "E" | "S";
  capacity: string;
  description: string;
  imageUrl?: string;
  targetOutlinkUrl: string;
  is1365: boolean;
};

export const newsItems: NewsItem[] = [
  {
    id: "n1",
    title: "국내 주요 기업, 탄소중립 투자 계획 확대",
    summary: [
      "국내 주요 기업들이 탄소중립 달성을 위한 투자 규모를 늘렸다.",
      "재생에너지 전환과 에너지 효율 개선이 핵심 전략으로 제시됐다.",
      "대학생 대상 ESG 직무 채용 수요도 함께 증가할 전망이다.",
    ],
    category: "E",
    source: "fallback",
    originalUrl: "",
    isFallback: true,
  },
  {
    id: "n2",
    title: "사회공헌 예산, 청년 교육 분야 중심으로 재편",
    summary: [
      "기업 사회공헌 예산이 청년 교육과 취업 지원 영역으로 이동하고 있다.",
      "지역 대학과 연계한 장학 및 멘토링 프로그램도 확대되는 추세다.",
      "사회적 가치 측정 체계를 도입하는 기업 사례가 늘고 있다.",
    ],
    category: "S",
    source: "fallback",
    originalUrl: "",
    isFallback: true,
  },
  {
    id: "n3",
    title: "ESG 공시 의무화 대비, 지배구조 점검 강화",
    summary: [
      "공시 의무화 일정에 맞춰 기업들의 지배구조 점검이 강화되고 있다.",
      "이사회 독립성과 내부통제 프로세스 개선이 주요 과제로 제시됐다.",
      "투자기관은 공시 신뢰도를 중점 평가 지표로 활용하는 분위기다.",
    ],
    category: "G",
    source: "fallback",
    originalUrl: "",
    isFallback: true,
  },
];

export const jobs: JobItem[] = [
  {
    id: "j1",
    title: "ESG 전략 인턴",
    company: "그린퓨처",
    jobType: "인턴",
    deadline: "D-2",
    applyUrl: "https://jobs.example.com/esg-intern",
  },
  {
    id: "j2",
    title: "사회공헌 기획 매니저",
    company: "희망네트워크",
    jobType: "정규직",
    deadline: "D-5",
    applyUrl: "https://jobs.example.com/csr-manager",
  },
  {
    id: "j3",
    title: "CSR 데이터 리서처",
    company: "임팩트랩",
    jobType: "계약직",
    deadline: "D-8",
    applyUrl: "https://jobs.example.com/csr-researcher",
  },
];

export const volunteers: VolunteerItem[] = [
  {
    id: "v1",
    title: "한강 플로깅 환경정화 활동",
    category: "E",
    capacity: "30명",
    description: "주말 오전 한강 일대 쓰레기 수거 및 분리배출 캠페인을 진행합니다.",
    imageUrl: "https://images.unsplash.com/photo-1509099863731-ef4bff19e808?q=80&w=1200&auto=format&fit=crop",
    targetOutlinkUrl: "https://forms.gle/example1",
    is1365: true,
  },
  {
    id: "v2",
    title: "지역아동 학습 멘토링",
    category: "S",
    capacity: "15명",
    description: "지역아동센터에서 중학생 대상 학습 멘토링을 운영합니다.",
    imageUrl: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1200&auto=format&fit=crop",
    targetOutlinkUrl: "https://university.example.com/volunteer/2",
    is1365: false,
  },
];

export const terms = [
  {
    term: "TCFD",
    category: "공시프레임워크",
    summary: "기후 관련 재무정보 공개를 위한 국제 권고안입니다.",
    sourceUrl: "https://www.fsb-tcfd.org/",
  },
  {
    term: "RE100",
    category: "E지표",
    summary: "기업 전력 사용량을 100% 재생에너지로 전환하겠다는 이니셔티브입니다.",
    sourceUrl: "https://www.there100.org/",
  },
];

