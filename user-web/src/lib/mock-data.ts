export type NewsItem = {
  id: string;
  title: string;
  summary: [string, string, string];
  category: "E" | "S" | "G";
  source: string;
  originalUrl: string;
  originalBody?: string;
  studentTrendSummary?: string;
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
    source: "데모",
    originalUrl: "https://www.korea.kr/news/policyNewsView.do?newsId=148882345",
    originalBody:
      "국내 주요 기업들이 탄소중립 달성을 위해 재생에너지 전환과 에너지 효율 개선에 대한 투자를 확대하고 있다. 정부의 2050 탄소중립 로드맵에 맞춰 온실가스 감축 목표를 상향 조정하는 기업이 늘고 있으며, RE100 가입 기업 수도 꾸준히 증가하는 추세다.",
    studentTrendSummary:
      "탄소중립은 환경경영(E) 분야의 핵심 키워드로, 대학생이 ESG 직무를 준비할 때 반드시 이해해야 할 트렌드입니다. 재생에너지·에너지 효율 관련 기업 공시와 채용 공고가 늘고 있어, 환경공학·경영·정책학 등 다양한 전공 학생이 관련 인턴·신입 포지션을 탐색할 수 있습니다.",
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
    source: "데모",
    originalUrl: "https://www.korea.kr/news/policyNewsView.do?newsId=148881234",
    originalBody:
      "기업들의 사회공헌 예산이 청년 교육·취업 지원 분야로 재편되고 있다. 지역 대학과 연계한 장학 및 멘토링 프로그램이 확대되며, 사회적 가치 측정 체계를 도입하는 기업 사례도 증가하고 있다.",
    studentTrendSummary:
      "사회공헌(S) 영역은 대학생에게 직접적인 참여 기회와 연결됩니다. 기업의 청년 지원 프로그램, 멘토링, 장학 정책을 파악하면 CSR·사회적가치 관련 과제와 취업 준비에 실질적인 사례를 활용할 수 있습니다.",
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
    source: "데모",
    originalUrl: "https://www.korea.kr/news/policyNewsView.do?newsId=148880123",
    originalBody:
      "ESG 공시 의무화 일정에 맞춰 기업들이 지배구조 점검을 강화하고 있다. 이사회 독립성 확보와 내부통제 프로세스 개선이 주요 과제로 제시되며, 투자기관은 공시 신뢰도를 핵심 평가 지표로 활용하고 있다.",
    studentTrendSummary:
      "지배구조(G)와 ESG 공시는 금융·경영·법학 전공 학생에게 중요한 취업 트렌드입니다. 공시 자료 분석, 내부통제, 컴플라이언스 관련 직무 수요가 늘고 있어, DART·KRX 공시를 직접 읽어보는 습관이 경쟁력이 됩니다.",
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

