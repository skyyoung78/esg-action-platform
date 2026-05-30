export type InfoResource = {
  name: string;
  summary: string;
  highlights: string[];
  sourceUrl: string;
};

export type InfoTerm = {
  term: string;
  category: "핵심용어" | "E지표" | "S지표" | "G지표" | "공시프레임워크";
  summary: string;
  sourceUrl: string;
};

export const disclosureResources: InfoResource[] = [
  {
    name: "ESG포털 (한국거래소 KRX)",
    summary:
      "상장사 ESG 등급, ESG 정보공개 현황, 지속가능경영보고서, ESG 지수·증권상품, 책임투자 규모, ESG 채권 상장 현황 등 국내 ESG 핵심 통계를 제공하는 공식 허브입니다.",
    highlights: [
      "상장사 ESG 등급(KCGS 등급자료 기준) 조회",
      "ESG 정보공개 현황 및 공시기준 확인",
      "ESG 투자동향(지수, 증권상품, 책임투자, ESG 채권) 통계",
    ],
    sourceUrl: "https://esg.krx.co.kr/",
  },
  {
    name: "한국ESG기준원 (KCGS)",
    summary:
      "국내 상장사·대기업 ESG 평가를 수행하는 공신력 있는 평가기관으로, KRX ESG포털 등급 자료의 기반이 되는 평가 결과를 제공합니다.",
    highlights: [
      "국내 기업 ESG 평가 등급 산출",
      "ESG 평가 방법론 및 기준 정보 제공",
      "기업 ESG 성과 비교·분석 자료 활용",
    ],
    sourceUrl: "https://www.esgkorea.or.kr/",
  },
  {
    name: "DART 전자공시시스템 (지속가능경영보고서)",
    summary:
      "상장사가 제출하는 지속가능경영보고서(ESG 보고서), 기업지배구조보고서 등 공시 원문을 검색·열람할 수 있는 금융감독원 공식 전자공시 시스템입니다.",
    highlights: [
      "지속가능경영보고서 원문 검색",
      "기업지배구조보고서 확인",
      "공시 이력 및 재무·비재무 정보 통합 조회",
    ],
    sourceUrl: "https://dart.fss.or.kr/",
  },
];

export const guidelineResources: InfoResource[] = [
  {
    name: "K-ESG 가이드라인 (산업통상자원부)",
    summary:
      "국내 기업의 글로벌 ESG 대응을 돕기 위해 마련된 한국형 가이드라인으로, 정보공시·환경·사회·지배구조 4개 영역과 61개 기본 진단 항목으로 기업의 ESG 자가 진단을 지원합니다.",
    highlights: [
      "4개 영역: 정보공시(P), 환경(E), 사회(S), 지배구조(G)",
      "61개 기본 진단 항목 및 항목정의서 제공",
      "중견·중소기업용 27개 우선 활용 항목 안내",
    ],
    sourceUrl: "https://www.esg.go.kr/",
  },
  {
    name: "환경부 · 환경산업기술원 (동향자료)",
    summary:
      "한국형 녹색분류체계(K-택소노미) 가이드라인, 탄소중립·녹색금융 실무 교육, 환경·기후 관련 정책·동향 자료를 제공합니다.",
    highlights: [
      "K-택소노미 적합성 판단 기준 및 가이드북",
      "녹색금융·온실가스 실무 교육 프로그램",
      "환경·탄소중립 정책 및 기술 동향 자료",
    ],
    sourceUrl: "https://www.keiti.re.kr/",
  },
];

export const careerResources: InfoResource[] = [
  {
    name: "금융위원회 · 자본시장연구원 보고서",
    summary:
      "ESG 금융, 녹색채권, ESG 공시 의무화, 책임투자 확대 등 국내 자본시장 ESG 트렌드와 정책 방향을 분석한 연구 보고서를 제공합니다.",
    highlights: [
      "ESG·녹색금융 시장 동향 분석",
      "공시 의무화 및 ESG 투자 확대 전망",
      "ESG 관련 직무·인력 수요 정책 자료",
    ],
    sourceUrl: "https://www.kcmi.re.kr/",
  },
  {
    name: "유엔글로벌콤팩트 한국협회 (UNGC)",
    summary:
      "UN 기반 기업 지속가능경영 이니셔티브로, ESG 세미나·아카데미·인턴십·네트워킹 등 대학생과 취업 준비생이 활용할 수 있는 프로그램 정보를 제공합니다.",
    highlights: [
      "ESG·지속가능경영 세미나 및 교육",
      "대학생 대상 아카데미·인턴십 공고",
      "기업 ESG 사례·글로벌 네트워크 정보",
    ],
    sourceUrl: "https://www.ungc.kr/",
  },
];

export const esgTerms: InfoTerm[] = [
  {
    term: "ESG",
    category: "핵심용어",
    summary:
      "환경(Environmental), 사회(Social), 지배구조(Governance)의 약자로, 기업의 지속가능성과 장기적 재무·비재무 가치에 영향을 주는 핵심 요소입니다.",
    sourceUrl: "https://esg.krx.co.kr/contents/01/01010100/ESG01010100.jsp",
  },
  {
    term: "K-ESG 가이드라인",
    category: "핵심용어",
    summary:
      "정부가 마련한 한국형 ESG 자가진단 가이드라인으로, 정보공시·환경·사회·지배구조 4개 영역과 61개 기본 진단 항목으로 구성됩니다.",
    sourceUrl: "https://www.esg.go.kr/",
  },
  {
    term: "K-택소노미",
    category: "핵심용어",
    summary:
      "한국형 녹색분류체계로, 환경적으로 지속가능한 경제활동의 범위를 정의하고 금융·투자 판단 기준으로 활용되는 가이드라인입니다.",
    sourceUrl: "https://www.korea.kr/archive/expDocView.do?docId=40017",
  },
  {
    term: "환경(E)",
    category: "E지표",
    summary:
      "온실가스·에너지·용수·폐기물·오염물질 등 기업 활동이 환경에 미치는 영향을 관리하는 영역으로, K-ESG 환경 진단 항목 17개가 포함됩니다.",
    sourceUrl: "https://www.esg.go.kr/",
  },
  {
    term: "온실가스 Scope 1·2·3",
    category: "E지표",
    summary:
      "Scope 1은 직접 배출, Scope 2는 전력 등 간접 배출, Scope 3는 공급망·사용 단계 등 기타 간접 배출을 의미하며 K-ESG 환경 항목의 핵심 지표입니다.",
    sourceUrl: "https://www.esg.go.kr/",
  },
  {
    term: "녹색부문 · 전환부문",
    category: "E지표",
    summary:
      "K-택소노미에서 녹색부문은 환경목표에 직접 기여하는 활동, 전환부문은 탄소중립 전환 과정에서 일시적으로 인정되는 활동을 뜻합니다.",
    sourceUrl: "https://www.korea.kr/archive/expDocView.do?docId=40017",
  },
  {
    term: "6대 환경목표",
    category: "E지표",
    summary:
      "K-택소노미의 기준으로, 온실가스 감축·기후변화 적응·물의 지속가능한 보전·자원순환·오염 방지·생물다양성 보전을 포함합니다.",
    sourceUrl: "https://www.korea.kr/archive/expDocView.do?docId=40017",
  },
  {
    term: "사회(S)",
    category: "S지표",
    summary:
      "노동·다양성·산업안전·인권·동반성장·지역사회 등 기업이 이해관계자에게 미치는 사회적 영향을 다루는 K-ESG 영역(22개 항목)입니다.",
    sourceUrl: "https://www.esg.go.kr/",
  },
  {
    term: "지배구조(G)",
    category: "G지표",
    summary:
      "이사회 구성·윤리경영·공익제보·정보공개 투명성 등 기업 경영의 건전성과 책임성을 확보하는 K-ESG 영역(17개 항목)입니다.",
    sourceUrl: "https://www.esg.go.kr/",
  },
  {
    term: "지속가능경영보고서",
    category: "공시프레임워크",
    summary:
      "기업의 ESG·지속가능경영 활동과 성과를 공시하는 보고서로, DART를 통해 원문을 확인할 수 있습니다.",
    sourceUrl: "https://dart.fss.or.kr/",
  },
  {
    term: "ESG 정보공개",
    category: "공시프레임워크",
    summary:
      "기업이 ESG 관련 정보를 투명하게 공개하는 활동으로, KRX ESG포털에서 상장사 공시 현황과 공시기준을 확인할 수 있습니다.",
    sourceUrl: "https://esg.krx.co.kr/",
  },
  {
    term: "그린워싱",
    category: "E지표",
    summary:
      "실제보다 친환경인 것처럼 과장·허위 표현하는 행위를 뜻하며, K-택소노미는 이러한 녹색위장 행위 예방을 위한 판단 기준을 제시합니다.",
    sourceUrl: "https://www.korea.kr/archive/expDocView.do?docId=40017",
  },
];

export const termCategories = ["전체", "핵심용어", "E지표", "S지표", "G지표", "공시프레임워크"] as const;
