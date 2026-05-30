export type InfoResource = {
  name: string;
  summary: string;
  highlights: string[];
  sourceUrl: string;
};

export type EsgPillar = "E" | "S" | "G" | "공통";

export type TermSourceId =
  | "kresg"
  | "kcgs"
  | "kis"
  | "krx"
  | "kesg"
  | "dart"
  | "taxonomy"
  | "fsc"
  | "kcmi"
  | "ungc";

export type TermSource = {
  id: TermSourceId;
  name: string;
  tag: string;
  url: string;
};

export type InfoTerm = {
  term: string;
  pillar: EsgPillar;
  summary: string;
  sourceId: TermSourceId;
  referenceUrl?: string;
};

export const termSources: Record<TermSourceId, TermSource> = {
  kresg: {
    id: "kresg",
    name: "한국ESG연구소",
    tag: "KRESG",
    url: "https://portal.kresg.co.kr",
  },
  kcgs: {
    id: "kcgs",
    name: "한국ESG기준원",
    tag: "KCGS",
    url: "https://www.cgs.or.kr",
  },
  kis: {
    id: "kis",
    name: "한국신용평가",
    tag: "KIS",
    url: "https://www.kisrating.com",
  },
  krx: {
    id: "krx",
    name: "KRX ESG포털",
    tag: "KRX",
    url: "https://esg.krx.co.kr/",
  },
  kesg: {
    id: "kesg",
    name: "K-ESG 가이드라인",
    tag: "K-ESG",
    url: "https://k-esg.org/guide/guideline01",
  },
  dart: {
    id: "dart",
    name: "DART 전자공시",
    tag: "DART",
    url: "https://dart.fss.or.kr/",
  },
  taxonomy: {
    id: "taxonomy",
    name: "K-택소노미",
    tag: "K-택소노미",
    url: "https://www.korea.kr/archive/expDocView.do?docId=40017",
  },
  fsc: {
    id: "fsc",
    name: "금융위원회",
    tag: "금융위",
    url: "https://www.fsc.go.kr",
  },
  kcmi: {
    id: "kcmi",
    name: "자본시장연구원",
    tag: "KCMI",
    url: "https://www.kcmi.re.kr",
  },
  ungc: {
    id: "ungc",
    name: "유엔글로벌콤팩트 한국협회",
    tag: "UNGC",
    url: "https://unglobalcompact.kr",
  },
};

export const pillarTabs = ["전체", "E", "S", "G"] as const;

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
      "국내 상장사·대기업 ESG 평가의 정석 기관으로, ESG 모범규준·평가 기준·등급 결과를 제공합니다. 주총 공지, 사외이사 비중 등 지배구조(G) 지표 기준 확인에 적합합니다.",
    highlights: [
      "ESG 모범규준 및 평가 기준·방법론",
      "국내 기업 ESG 평가 등급 산출",
      "지배구조(G) 정량·정성 지표 기준",
    ],
    sourceUrl: "https://www.cgs.or.kr",
  },
  {
    name: "한국ESG연구소 (KRESG)",
    summary:
      "대학생이 헷갈리기 쉬운 환경·금융 ESG 용어(BOD, TOE, 업사이클링 등)를 체계적으로 정리한 ESG 용어 자료를 제공합니다.",
    highlights: [
      "ESG 용어 사전 및 개념 해설",
      "환경·에너지·금융 관련 핵심 용어 정리",
      "공시·평가 프레임워크 용어 안내",
    ],
    sourceUrl: "https://portal.kresg.co.kr",
  },
  {
    name: "한국신용평가 (KIS Rating)",
    summary:
      "채권·신용등급 관점의 ESG 인증·평가 방법론 및 등급 정의를 제공합니다. 온실가스 배출량 산식, 산업재해율 등 금융·리스크 정량 지표 중심입니다.",
    highlights: [
      "ESG 인증·평가 방법론 및 등급 체계",
      "온실가스 배출량 산식 등 정량 지표",
      "산업재해율·안전 리스크 지표 정의",
    ],
    sourceUrl: "https://www.kisrating.com",
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
    name: "K-ESG 가이드라인 (산업통상자원부 · 지속가능경영지원센터)",
    summary:
      "국내 기업의 글로벌 ESG 대응을 돕기 위해 마련된 한국형 가이드라인으로, 정보공시·환경·사회·지배구조 4개 영역과 61개 기본 진단 항목으로 기업의 ESG 자가 진단을 지원합니다.",
    highlights: [
      "4개 영역: 정보공시(P), 환경(E), 사회(S), 지배구조(G)",
      "61개 기본 진단 항목 및 항목정의서 제공",
      "중견·중소기업용 27개 우선 활용 항목 안내",
    ],
    sourceUrl: "https://k-esg.org/guide/guideline01",
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
    name: "금융위원회 (ESG 금융·공시 정책)",
    summary:
      "ESG 공시 의무화 로드맵, ISSB·SASB 기준 국문 번역, 지속가능금융·기후금융 정책, ESG 평가기관 가이던스 등 국내 ESG 금융 규제·정책의 공식 출처입니다.",
    highlights: [
      "ESG 공시 의무화 일정·로드맵 및 KSSB(지속가능성기준위원회) 운영",
      "ISSB(IFRS S1·S2)·SASB 기준 국문 번역본 제공",
      "ESG 평가기관 가이던스·지속가능금융 추진단 정책",
    ],
    sourceUrl: "https://www.fsc.go.kr",
  },
  {
    name: "자본시장연구원 (KCMI)",
    summary:
      "금융위 산하 Think Tank로, 책임투자·녹색채권·그리니엄·ESG 공시 등 자본시장 ESG 트렌드와 정책 시사점을 분석한 연구 보고서를 제공합니다.",
    highlights: [
      "책임투자(RI)·SRI·ESG 통합 등 투자 용어 정의",
      "녹색채권·그리니엄·녹색증권화 시장 분석",
      "ESG 공시 의무화·기업지배구조 보고서 효과 연구",
    ],
    sourceUrl: "https://www.kcmi.re.kr",
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
    sourceUrl: "https://unglobalcompact.kr",
  },
];

export const esgTerms: InfoTerm[] = [
  {
    term: "ESG",
    pillar: "공통",
    summary:
      "환경(Environmental), 사회(Social), 지배구조(Governance)의 약자로, 기업의 지속가능성과 장기적 재무·비재무 가치에 영향을 주는 핵심 요소입니다.",
    sourceId: "krx",
  },
  {
    term: "K-ESG 가이드라인",
    pillar: "공통",
    summary:
      "정부가 마련한 한국형 ESG 자가진단 가이드라인으로, 정보공시·환경·사회·지배구조 4개 영역과 61개 기본 진단 항목으로 구성됩니다.",
    sourceId: "kesg",
  },
  {
    term: "BOD (생화학적 산소요구량)",
    pillar: "E",
    summary:
      "수중 유기물이 미생물에 의해 분해될 때 소모되는 산소량으로, 폐수·수질 관리의 대표 환경 지표입니다. ESG 환경 공시에서 수질 영향 평가에 자주 등장합니다.",
    sourceId: "kresg",
  },
  {
    term: "COD (화학적 산소요구량)",
    pillar: "E",
    summary:
      "강산화제로 유기물을 산화할 때 필요한 산소량입니다. BOD와 함께 수질 오염·폐수 배출 강도를 나타내는 환경 지표로 활용됩니다.",
    sourceId: "kresg",
  },
  {
    term: "TOE (석유환산톤)",
    pillar: "E",
    summary:
      "다양한 에너지원(전력, 가스, 연료 등)의 사용량을 석유 1톤 발열량 기준으로 환산한 단위입니다. 기업 에너지·온실가스 공시에서 에너지 소비량 비교에 쓰입니다.",
    sourceId: "kresg",
  },
  {
    term: "업사이클링 (Upcycling)",
    pillar: "E",
    summary:
      "폐기물·부산물의 가치를 높여 새로운 제품·소재로 재활용하는 방식입니다. 단순 재활용(다운사이클링)과 달리 자원순환·순환경제 ESG 지표와 연결됩니다.",
    sourceId: "kresg",
  },
  {
    term: "다운사이클링 (Downcycling)",
    pillar: "E",
    summary:
      "재활용 과정에서 원재료 대비 품질·가치가 낮아지는 재활용 형태입니다. 업사이클링과 대비되어 자원순환 전략·공시 품질을 구분할 때 사용됩니다.",
    sourceId: "kresg",
  },
  {
    term: "TCFD",
    pillar: "E",
    summary:
      "기후 관련 재무정보공개(Task Force on Climate-related Financial Disclosures) 프레임워크로, 기후 리스크·기회를 거버넌스·전략·리스크관리·지표 목표 4개 영역으로 공시합니다.",
    sourceId: "kresg",
  },
  {
    term: "GRI",
    pillar: "공통",
    summary:
      "글로벌 지속가능성 보고 표준(Global Reporting Initiative)으로, 환경·사회·지배구조 항목별 공시 지침을 제공하는 국제 프레임워크입니다.",
    sourceId: "kresg",
  },
  {
    term: "CDP",
    pillar: "E",
    summary:
      "기후변화·물·산림 관련 기업 공시 플랫폼(Carbon Disclosure Project)으로, 투자자·기관이 요청하는 환경 데이터 공개·점수화 체계입니다.",
    sourceId: "kresg",
  },
  {
    term: "RE100",
    pillar: "E",
    summary:
      "전 세계 기업이 100% 재생에너지 사용을 목표로 하는 글로벌 이니셔티브입니다. 기업의 재생에너지 전환 의지·진행률을 ESG 평가에서 확인할 수 있습니다.",
    sourceId: "kresg",
  },
  {
    term: "이중 중요성 (Double Materiality)",
    pillar: "공통",
    summary:
      "기업 활동이 환경·사회에 미치는 영향(impact materiality)과 ESG 이슈가 기업 재무에 미치는 영향(financial materiality)을 모두 고려하는 공시·평가 관점입니다.",
    sourceId: "kresg",
  },
  {
    term: "K-택소노미",
    pillar: "E",
    summary:
      "한국형 녹색분류체계로, 환경적으로 지속가능한 경제활동의 범위를 정의하고 금융·투자 판단 기준으로 활용되는 가이드라인입니다.",
    sourceId: "taxonomy",
  },
  {
    term: "환경(E)",
    pillar: "E",
    summary:
      "온실가스·에너지·용수·폐기물·오염물질 등 기업 활동이 환경에 미치는 영향을 관리하는 영역으로, K-ESG 환경 진단 항목 17개가 포함됩니다.",
    sourceId: "kesg",
  },
  {
    term: "온실가스 Scope 1·2·3",
    pillar: "E",
    summary:
      "Scope 1은 직접 배출, Scope 2는 전력 등 간접 배출, Scope 3는 공급망·사용 단계 등 기타 간접 배출을 의미합니다. ESG·신용평가에서 핵심 정량 지표입니다.",
    sourceId: "kis",
  },
  {
    term: "온실가스 배출량 산식",
    pillar: "E",
    summary:
      "활동자료(연료 사용량, 전력 사용량 등)에 배출계수를 곱해 tCO₂eq(이산화탄소 환산톤)으로 환산하는 방식입니다. ESG 인증·평가에서 배출량 검증의 기본 방법입니다.",
    sourceId: "kis",
  },
  {
    term: "녹색부문 · 전환부문",
    pillar: "E",
    summary:
      "K-택소노미에서 녹색부문은 환경목표에 직접 기여하는 활동, 전환부문은 탄소중립 전환 과정에서 일시적으로 인정되는 활동을 뜻합니다.",
    sourceId: "taxonomy",
  },
  {
    term: "6대 환경목표",
    pillar: "E",
    summary:
      "K-택소노미의 기준으로, 온실가스 감축·기후변화 적응·물의 지속가능한 보전·자원순환·오염 방지·생물다양성 보전을 포함합니다.",
    sourceId: "taxonomy",
  },
  {
    term: "그린워싱",
    pillar: "E",
    summary:
      "실제보다 친환경인 것처럼 과장·허위 표현하는 행위를 뜻하며, K-택소노미는 이러한 녹색위장 행위 예방을 위한 판단 기준을 제시합니다.",
    sourceId: "taxonomy",
  },
  {
    term: "그린본드 (Green Bond)",
    pillar: "E",
    summary:
      "환경 개선·기후 대응 등 녹색 프로젝트 자금 조달에 사용되는 채권입니다. 한국신용평가 등 ESG 인증기관의 녹색채권 평가·등급 체계와 연계됩니다.",
    sourceId: "kis",
  },
  {
    term: "사회(S)",
    pillar: "S",
    summary:
      "노동·다양성·산업안전·인권·동반성장·지역사회 등 기업이 이해관계자에게 미치는 사회적 영향을 다루는 K-ESG 영역(22개 항목)입니다.",
    sourceId: "kesg",
  },
  {
    term: "산업재해율",
    pillar: "S",
    summary:
      "근로자 100만 명당 산업재해 발생 건수 등으로 표현되는 안전 지표입니다. ESG S 영역과 신용·리스크 평가에서 정량 지표로 활용됩니다.",
    sourceId: "kis",
  },
  {
    term: "LTIFR (중대재해 발생률)",
    pillar: "S",
    summary:
      "Lost Time Injury Frequency Rate의 약자로, 근로 100만 시간당 업무상 사고로 인한 손실 근로일수가 발생한 사고 건수입니다. 산업안전 ESG 지표로 널리 쓰입니다.",
    sourceId: "kis",
  },
  {
    term: "다양성·포용 (D&I)",
    pillar: "S",
    summary:
      "성별·연령·장애 등 다양한 배경의 인재를 채용·승진·유지하고 포용하는 경영 활동입니다. K-ESG 사회 영역과 KCGS S 지표에서 핵심 항목입니다.",
    sourceId: "kcgs",
  },
  {
    term: "지배구조(G)",
    pillar: "G",
    summary:
      "이사회 구성·윤리경영·공익제보·정보공개 투명성 등 기업 경영의 건전성과 책임성을 확보하는 K-ESG 영역(17개 항목)입니다.",
    sourceId: "kesg",
  },
  {
    term: "ESG 모범규준",
    pillar: "G",
    summary:
      "KCGS가 제시하는 국내 기업 ESG 경영의 모범 사례·원칙으로, 평가 항목 설계와 기업 자율 개선의 기준점으로 활용됩니다.",
    sourceId: "kcgs",
  },
  {
    term: "ESG 평가 기준",
    pillar: "G",
    summary:
      "KCGS가 국내 상장사·대기업을 평가할 때 적용하는 정량·정성 지표 체계입니다. 환경·사회·지배구조 영역별 가중치와 등급 산출 규칙을 포함합니다.",
    sourceId: "kcgs",
  },
  {
    term: "ESG 평가 등급",
    pillar: "G",
    summary:
      "KCGS 등 국내 평가기관이 부여하는 ESG 종합·영역별 등급(예: S/A/B+/B/C/D 등)으로, KRX ESG포털에서 상장사 등급 조회에 활용됩니다.",
    sourceId: "kcgs",
  },
  {
    term: "정량 지표 · 정성 지표",
    pillar: "G",
    summary:
      "정량 지표는 수치로 측정 가능한 항목(배출량, 사외이사 비율 등), 정성 지표는 정책·절차·공시 수준 등을 평가하는 항목입니다. KCGS 평가 체계의 기본 구분입니다.",
    sourceId: "kcgs",
  },
  {
    term: "사외이사",
    pillar: "G",
    summary:
      "회사 경영에 종사하지 않는 외부 이사로, 이사회의 독립성·감시 기능 강화를 위해 G 지표에서 핵심적으로 평가됩니다. 사외이사 비중·전문성이 주요 항목입니다.",
    sourceId: "kcgs",
  },
  {
    term: "이사회 독립성",
    pillar: "G",
    summary:
      "이사회가 경영진·대주주로부터 독립적으로 의사결정할 수 있는 정도입니다. 사외이사 구성, 위원회 설치, 이사회 내 의견 다양성 등으로 평가됩니다.",
    sourceId: "kcgs",
  },
  {
    term: "주주총회 · 주총 공지",
    pillar: "G",
    summary:
      "주주 의결권 행사와 경영 투명성을 확보하는 핵심 거버넌스 절차입니다. KCGS G 지표에서는 주총 소집·의안 공지·전자투표 등 절차 준수를 평가합니다.",
    sourceId: "kcgs",
  },
  {
    term: "내부통제",
    pillar: "G",
    summary:
      "재무·비재무 정보의 신뢰성과 법규 준수를 보장하는 조직·절차 체계입니다. ESG 정보공개의 정확성·윤리경영과 연계되어 G 영역 지표로 평가됩니다.",
    sourceId: "kcgs",
  },
  {
    term: "ESG 인증",
    pillar: "공통",
    summary:
      "한국신용평가 등 인증기관이 기업·채권·프로젝트의 ESG 적합성을 방법론에 따라 검증·등급 부여하는 제도입니다. 녹색채권·사회채권 등과 연계됩니다.",
    sourceId: "kis",
  },
  {
    term: "ESG 등급 정의",
    pillar: "공통",
    summary:
      "ESG 종합·영역별 성과를 등급으로 구분하는 체계로, 각 등급별 의미·산출 기준·한계가 방법론서에 명시됩니다. 투자·채권 발행 의사결정에 참고됩니다.",
    sourceId: "kis",
  },
  {
    term: "지속가능연계대출 (SLL)",
    pillar: "E",
    summary:
      "차입자의 ESG·지속가능성 목표 달성 여부에 따라 금리 등 대출 조건이 연동되는 금융 상품입니다. ESG 금융·리스크 관리 용어로 확대되고 있습니다.",
    sourceId: "kis",
  },
  {
    term: "지속가능경영보고서",
    pillar: "공통",
    summary:
      "기업의 ESG·지속가능경영 활동과 성과를 공시하는 보고서로, DART를 통해 원문을 확인할 수 있습니다.",
    sourceId: "dart",
  },
  {
    term: "ESG 정보공개",
    pillar: "공통",
    summary:
      "기업이 ESG 관련 정보를 투명하게 공개하는 활동으로, KRX ESG포털에서 상장사 공시 현황과 공시기준을 확인할 수 있습니다.",
    sourceId: "krx",
  },
  {
    term: "ISSB (국제지속가능성기준위원회)",
    pillar: "공통",
    summary:
      "IFRS재단 산하 국제 지속가능성 공시기준 제정기구입니다. IFRS S1(일반 요구사항)·S2(기후) 등 글로벌 ESG 공시 표준을 발표하며, 금융위·회계기준원이 국문 번역본을 제공합니다.",
    sourceId: "fsc",
    referenceUrl: "https://www.fsc.go.kr/no010101/81328",
  },
  {
    term: "IFRS S1·S2",
    pillar: "공통",
    summary:
      "ISSB가 제정한 지속가능성 공시 국제기준입니다. S1은 일반 공시 요구사항, S2는 기후 관련 리스크·기회·배출량 공시를 다룹니다. 국내 ESG 공시 의무화의 핵심 참고 기준입니다.",
    sourceId: "fsc",
    referenceUrl: "https://www.kasb.or.kr",
  },
  {
    term: "SASB (지속가능회계기준위원회)",
    pillar: "공통",
    summary:
      "산업별로 재무적으로 중요한(material) 지속가능성 이슈와 지표를 제시하는 공시 프레임워크입니다. 금융위는 기업 참고용 SASB 기준 국문 번역본을 공개합니다.",
    sourceId: "fsc",
    referenceUrl: "https://www.fsc.go.kr/no010101/76848",
  },
  {
    term: "KSSB (지속가능성기준위원회)",
    pillar: "공통",
    summary:
      "한국회계기준원 산하 위원회로, ISSB 기준 등을 참고해 국내에 적용할 ESG·지속가능성 공시기준을 검토·제정합니다. 금융위가 설립을 발표하고 운영을 지원합니다.",
    sourceId: "fsc",
    referenceUrl: "https://www.fsc.go.kr/no010101/79112",
  },
  {
    term: "ESG 공시 의무화",
    pillar: "공통",
    summary:
      "상장사 등이 ESG·지속가능성 정보를 법·규정에 따라 공시해야 하는 제도입니다. 금융위는 대형 상장사부터 단계적 도입 로드맵을 검토·발표하고 있습니다.",
    sourceId: "fsc",
    referenceUrl: "https://www.fsc.go.kr/no010101/86326",
  },
  {
    term: "ESG 정보공개 가이던스",
    pillar: "공통",
    summary:
      "한국거래소가 마련한 ESG 정보공개 안내서로, 지속가능경영보고서 작성·공개 절차와 GRI·SASB 등 글로벌 표준 선택 적용 방법을 제시합니다. 금융위 ESG 공시 정책과 연계됩니다.",
    sourceId: "fsc",
    referenceUrl: "https://esg.krx.co.kr/",
  },
  {
    term: "ESG 평가기관 가이던스",
    pillar: "G",
    summary:
      "국내 ESG 평가기관(서스틴베스트·KCGS·KRESG 등)이 자율규제로 따르는 평가 방법론 공개·투명성 기준입니다. 금융위·한국거래소가 이행 현황을 점검합니다.",
    sourceId: "fsc",
    referenceUrl: "https://www.fsc.go.kr/no010101/81339",
  },
  {
    term: "지속가능금융",
    pillar: "공통",
    summary:
      "환경·사회·지배구조(ESG) 요소를 금융 의사결정·상품 설계에 반영하는 금융 활동 전반을 뜻합니다. 금융위 ESG 금융추진단이 녹색채권·공시·책임투자 등 정책을 총괄합니다.",
    sourceId: "fsc",
  },
  {
    term: "기후금융",
    pillar: "E",
    summary:
      "탄소중립·기후변화 대응 프로젝트에 자금을 공급하는 금융으로, 녹색채권·전환금융·기후리스크 공시 등과 연계됩니다. 금융위 역점 과제 중 하나입니다.",
    sourceId: "fsc",
  },
  {
    term: "책임투자 (RI, Responsible Investment)",
    pillar: "공통",
    summary:
      "종목 선정·의결권 행사 등 투자 의사결정 과정에서 ESG·윤리·지배구조 요소를 통합적으로 고려하는 투자 방식입니다. 자본시장연구원은 UN PRI 등 국제 동향과 함께 국내 확산을 분석합니다.",
    sourceId: "kcmi",
  },
  {
    term: "사회책임투자 (SRI)",
    pillar: "공통",
    summary:
      "재무 수익뿐 아니라 사회·환경·지배구조 성과를 함께 고려하는 투자 기법입니다. Negative·Positive Screening, 주주 Engagement 등 세부 방식으로 구분되며, 최근에는 RI(책임투자) 용어로 통합되는 추세입니다.",
    sourceId: "kcmi",
  },
  {
    term: "PRI (책임투자원칙)",
    pillar: "공통",
    summary:
      "UN이 2006년 제정한 기관투자자용 6대 원칙으로, ESG 이슈를 투자 분석·의사결정·소유권 행사·협력·공시·실행에 반영하도록 권고합니다. 국내 연기금·자산운용사 참여가 확대 중입니다.",
    sourceId: "kcmi",
  },
  {
    term: "ESG 통합 (ESG Integration)",
    pillar: "공통",
    summary:
      "전통적 재무 분석에 ESG 요인을 체계적으로 반영해 투자 가치·리스크를 평가하는 방식입니다. Screening과 달리 모든 종목 분석 과정에 ESG 데이터를 녹여 넣는 접근입니다.",
    sourceId: "kcmi",
  },
  {
    term: "Negative Screening (부정적 스크리닝)",
    pillar: "공통",
    summary:
      "담배, 무기, 석탄 등 특정 업종·활동에 투자를 배제하는 책임투자 기법입니다. 윤리적·가치 기반 투자 포트폴리오 구성에 널리 쓰입니다.",
    sourceId: "kcmi",
  },
  {
    term: "Positive Screening (긍정적 스크리닝)",
    pillar: "공통",
    summary:
      "ESG 성과가 우수한 기업·업종을 선별해 투자하는 방식입니다. Best-in-class(동일 업종 내 상위 기업 선별) 등이 대표적이며, 포트폴리오 ESG 리스크를 줄이는 데 활용됩니다.",
    sourceId: "kcmi",
  },
  {
    term: "스튜어드십 (Stewardship)",
    pillar: "G",
    summary:
      "기관투자자가 보유 지분을 통해 기업의 장기적 가치·지속가능성을 높이도록 적극적으로 소통·개입하는 활동입니다. 국내 스튜어드십 코드와 주주 Engagement가 이에 해당합니다.",
    sourceId: "kcmi",
  },
  {
    term: "주주 Engagement",
    pillar: "G",
    summary:
      "투자자가 기업 경영진·이사회와 대화하거나 의결권·주주제안권을 행사해 ESG·지배구조 개선을 요구하는 적극적 소유권 행사입니다. 책임투자의 핵심 실행 수단 중 하나입니다.",
    sourceId: "kcmi",
  },
  {
    term: "그리니엄 (Greenium)",
    pillar: "E",
    summary:
      "녹색채권이 동일 조건 일반채권보다 낮은 금리로 발행되는 현상입니다. ESG 투자 수요가 발행금리를 낮추는 프리미엄으로, 시장 성숙·규제 강화에 따라 변동합니다.",
    sourceId: "kcmi",
    referenceUrl:
      "https://www.kcmi.re.kr/publications/pub_detail_view?cno=6006&syear=2022&zcd=002001016&zno=1687",
  },
  {
    term: "넷제로 (Net Zero)",
    pillar: "E",
    summary:
      "온실가스 순배출량을 실질적으로 0에 가깝게 만드는 목표·전략입니다. 기업·국가·금융기관의 기후 공약과 녹색·전환금융 상품 설계의 핵심 개념입니다.",
    sourceId: "kcmi",
  },
  {
    term: "사회채권 (Social Bond)",
    pillar: "S",
    summary:
      "교육·보건·일자리·주거 등 사회적 목적 프로젝트 자금 조달용 채권입니다. 그린본드와 함께 ESG 채권(sustainable bond)의 대표 유형으로, 자금 사용처 공시·외부 검증이 중요합니다.",
    sourceId: "kcmi",
  },
  {
    term: "CSRD (EU 지속가능성 보고 지침)",
    pillar: "공통",
    summary:
      "EU가 도입한 기업 지속가능성 정보 공시 규정으로, ESRS(유럽 지속가능성 보고 표준) 적용·공시 의무를 규정합니다. 금융위는 EU 동향을 국내 ESG 공시 로드맵 검토 시 참고합니다.",
    sourceId: "fsc",
    referenceUrl: "https://www.fsc.go.kr/no010101/84410",
  },
  {
    term: "스튜어드십 코드",
    pillar: "G",
    summary:
      "기관투자자가 수탁자 책임에 따라 투자대상 기업의 장기적 가치 제고를 위해 의결권 행사·경영과 소통 등 주주활동을 수행하도록 권고하는 자율 행동 지침입니다. 자본시장연구원이 국내 이행 현황·실효성을 분석합니다.",
    sourceId: "kcmi",
    referenceUrl: "https://www.kcmi.re.kr/report/report_view?report_no=2226",
  },
  {
    term: "대리인 자본주의 (Agency Capitalism)",
    pillar: "G",
    summary:
      "소수 기관투자자가 다수 수익소유자(연기금 가입자 등)를 대리해 대규모 지분을 운용하는 자본시장 구조입니다. KCMI는 이 구조에서 스튜어드십·주주활동이 대리비용을 줄이는 역할을 분석합니다.",
    sourceId: "kcmi",
    referenceUrl:
      "https://www.kcmi.re.kr/publications/pub_detail_view?cno=5263&syear=2019&zcd=002001016&zno=1475",
  },
  {
    term: "행동주의 투자 (Activist Investing)",
    pillar: "G",
    summary:
      "저평가·지배구조 문제 기업에 지분을 취득해 경영 개선·주주가치 제고를 요구하는 투자 방식입니다. 스튜어드십 코드(제도적)와 대비되는 시장 내생적 주주활동으로 KCMI 보고서에서 다룹니다.",
    sourceId: "kcmi",
    referenceUrl:
      "https://www.kcmi.re.kr/publications/pub_detail_view?cno=5263&syear=2019&zcd=002001016&zno=1475",
  },
  {
    term: "수탁자 책임 (Fiduciary Duty)",
    pillar: "G",
    summary:
      "연기금·자산운용사 등이 수익소유자 이익을 위해 충실히 투자·의결권을 행사해야 하는 법적·윤리적 의무입니다. ESG·스튜어드십 논의의 핵심 근거로 KCMI가 국내 제도 개선 과제를 제시합니다.",
    sourceId: "kcmi",
    referenceUrl: "https://www.kcmi.re.kr/report/report_view?report_no=2226",
  },
  {
    term: "ESG 채권 (Sustainable Bond)",
    pillar: "공통",
    summary:
      "환경·사회·지속가능 목적 자금 조달을 위해 발행하는 채권 총칭으로, 그린본드·사회채권·지속가능연계채권 등을 포함합니다. KCMI는 글로벌 ESG 채권시장 다변화와 발행 후 공시 강화 필요성을 분석합니다.",
    sourceId: "kcmi",
    referenceUrl:
      "https://www.kcmi.re.kr/publications/pub_detail_view?cno=5809&syear=2021&zcd=002001016&zno=1629",
  },
  {
    term: "전환금융 (Transition Finance)",
    pillar: "E",
    summary:
      "탄소 집약 산업 등이 순환경경제·넷제로 전환을 위해 조달하는 금융입니다. 녹색채권과 구분되며, KCMI·국제 기준(기후전환금융 핸드북 등)에서 전환 경로 자금 조달 수단으로 논의됩니다.",
    sourceId: "kcmi",
    referenceUrl:
      "https://www.kcmi.re.kr/publications/pub_detail_view?cno=5809&syear=2021&zcd=002001016&zno=1629",
  },
  {
    term: "녹색증권화 (Green Securitization)",
    pillar: "E",
    summary:
      "녹색채권·녹색대출 등을 기초자산으로 묶어 새로운 금융상품(증권)을 만드는 구조입니다. EU 녹색채권기준과 KCMI 분석에 따르면 중소·개인 녹색전환 자금 유동성 확대에 활용됩니다.",
    sourceId: "kcmi",
    referenceUrl:
      "https://www.kcmi.re.kr/publications/pub_detail_view?cno=6383&syear=2024&zcd=002001016&zno=1799",
  },
  {
    term: "DNSH (중대한 환경피해 금지)",
    pillar: "E",
    summary:
      "Do No Significant Harm의 약자로, EU Taxonomy 등에서 녹색·전환 활동이 다른 환경목표를 심각하게 훼손하지 않아야 한다는 원칙입니다. KCMI EU 녹색채권기준 분석에서 핵심 판단 기준으로 소개됩니다.",
    sourceId: "kcmi",
    referenceUrl:
      "https://www.kcmi.re.kr/publications/pub_detail_view?cno=6383&syear=2024&zcd=002001016&zno=1799",
  },
  {
    term: "비재무정보 공시",
    pillar: "공통",
    summary:
      "재무제표 외 ESG·지속가능성·지배구조 등 비재무 성과·리스크 정보를 공개하는 활동입니다. KCMI는 ESG 가치 측정·공정 평가 인프라와 함께 비재무 공시 확대가 ESG 경영 촉진의 핵심임을 강조합니다.",
    sourceId: "kcmi",
    referenceUrl: "https://www.kcmi.re.kr/report/report_view?report_no=1242",
  },
  {
    term: "UNGC (유엔글로벌콤팩트)",
    pillar: "공통",
    summary:
      "UN 사무총장 직속 세계 최대 기업 지속가능성 이니셔티브로, 가입 기업이 10대 원칙에 따라 인권·노동·환경·반부패를 경영에 반영하도록 지원합니다. 한국협회(unglobalcompact.kr)가 국내 참여기업을 돕습니다.",
    sourceId: "ungc",
  },
  {
    term: "UNGC 10대 원칙",
    pillar: "공통",
    summary:
      "인권 2개, 노동 4개, 환경 3개, 반부패 1개로 구성된 UNGC 핵심 행동강령입니다. 법적 구속력은 없으나 글로벌 기업 지속가능경영·CSR 실천의 공통 기준으로 널리 인용됩니다.",
    sourceId: "ungc",
    referenceUrl: "https://unglobalcompact.kr/about/un-global-compact/10%eb%8c%80-%ec%9b%90%ec%b9%99/",
  },
  {
    term: "SDGs (지속가능발전목표)",
    pillar: "공통",
    summary:
      "2030년까지 달성을 목표로 UN이 채택한 17개 글로벌 목표(빈곤·기후·불평등 등)입니다. UNGC는 기업이 SDGs Compass 등을 활용해 경영 전략과 연계하도록 지원합니다.",
    sourceId: "ungc",
    referenceUrl: "https://unglobalcompact.kr",
  },
  {
    term: "CSR (기업의 사회적 책임)",
    pillar: "공통",
    summary:
      "기업이 이윤 추구와 함께 사회·환경에 대한 책임을 다하는 경영 개념입니다. UNGC는 UN이 기업을 직접 대상으로 한 최초의 포괄적 CSR 이니셔티브로 소개됩니다.",
    sourceId: "ungc",
    referenceUrl: "https://unglobalcompact.kr/about/un-global-compact/10%eb%8c%80-%ec%9b%90%ec%b9%99/",
  },
  {
    term: "COP (참여보고서, Communication on Progress)",
    pillar: "공통",
    summary:
      "UNGC 가입 기업이 매년 10대 원칙 이행 현황과 SDGs 기여 활동을 UN에 제출하는 공개 보고서입니다. 지속가능경영 실행·투명성의 핵심 절차로 UNGC 참여기업에 요구됩니다.",
    sourceId: "ungc",
  },
  {
    term: "SDGs Compass",
    pillar: "공통",
    summary:
      "UNGC·GRI·WBCSD가 공동 개발한 SDGs 연계 가이드로, 기업이 지속가능발전목표를 전략·목표·지표·거버넌스에 통합하는 5단계 방법론을 제시합니다.",
    sourceId: "ungc",
  },
  {
    term: "인권 실사 (Human Rights Due Diligence)",
    pillar: "S",
    summary:
      "기업이 인권 침해 위험을 식별·예방·완화·구제하는 체계적 절차입니다. UNGC 10대 원칙(인권 1·2번)과 UN 기업과 인권 이사회 원칙(UNGPs)의 핵심 실행 개념입니다.",
    sourceId: "ungc",
    referenceUrl: "https://unglobalcompact.kr/about/un-global-compact/10%eb%8c%80-%ec%9b%90%ec%b9%99/",
  },
  {
    term: "예방적 원칙 (Precautionary Principle)",
    pillar: "E",
    summary:
      "환경 위해가 과학적으로 완전히 입증되기 전에도 예방 조치를 취하자는 원칙입니다. UNGC 10대 원칙 7번(환경)과 연결되며, 기후·환경 리스크 대응의 기본 개념입니다.",
    sourceId: "ungc",
    referenceUrl: "https://unglobalcompact.kr/about/un-global-compact/10%eb%8c%80-%ec%9b%90%ec%b9%99/",
  },
  {
    term: "반부패 (Anti-Corruption)",
    pillar: "G",
    summary:
      "기업이 뇌물·횡령·부정청탁 등 부패 행위에 저항하고 내부 통제·윤리경영을 강화하는 활동입니다. UNGC 10대 원칙 10번(반부패)과 ESG G 영역의 핵심 주제입니다.",
    sourceId: "ungc",
    referenceUrl: "https://unglobalcompact.kr/about/un-global-compact/10%eb%8c%80-%ec%9b%90%ec%b9%99/",
  },
];

export function getTermSourceUrl(term: InfoTerm): string {
  return term.referenceUrl ?? termSources[term.sourceId].url;
}

/** 용어 사전 출처 필터용 — 실제 용어에 사용된 출처만 */
export const dictionarySourceIds: TermSourceId[] = [
  "kresg",
  "kcgs",
  "kis",
  "krx",
  "kesg",
  "dart",
  "taxonomy",
  "fsc",
  "kcmi",
  "ungc",
];
