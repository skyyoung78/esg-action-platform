# 🌿 ESG 액션 플랫폼 — Cursor AI 개발 명세서 v2.1

> 대학생 맞춤형 ESG 종합 액션 플랫폼 MVP  
> **PC 반응형 웹 + 모바일 하단 네비 완전 반응형 구조**

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 프로젝트명 | 대학생 맞춤형 ESG 종합 액션 플랫폼 (MVP) |
| 목표 | 비로그인 기반 대학생 전용 ESG 정보·실천 통합 허브 구축 |
| 핵심 특징 | 정보 메뉴 100% 자동화 + 봉사활동 큐레이션 하이브리드 구조 |
| 개발 환경 | Cursor AI — Next.js 14 App Router + Supabase |
| 배포 타겟 | Vercel (프론트) + Supabase Cloud (DB·Edge Functions) |
| 운영 구조 | 사용자 웹/관리자 웹 완전 분리 (Vercel 별도 프로젝트 2개 운영) |

---

## 2. 기술 스택

| 영역 | 기술 / 서비스 |
|------|------|
| 프론트엔드 | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| 백엔드 / DB | Supabase (PostgreSQL + Row Level Security) |
| 뉴스 수집 | 네이버 검색 API (뉴스) — 일 25,000건 무료 |
| AI 요약 | OpenAI GPT-4o-mini API — 뉴스 3줄 요약 자동 생성 |
| 채용 수집 | 사람인 채용 RSS 피드 파싱 (`xml2js` 라이브러리) |
| 배치 스케줄러 | Supabase Edge Functions (cron: 매일 새벽 02:00 KST) |
| 인증 (관리자) | Supabase Auth — 이메일/비밀번호 |

---

## 3. 반응형 레이아웃 설계

### 3-1. 브레이크포인트

| 구간 | 범위 | 레이아웃 |
|------|------|------|
| 모바일 | ~768px | 하단 탭 네비 + 단일 컬럼 카드 |
| 태블릿 | 768px~1024px | 상단 네비 + 사이드바(180px) + 콘텐츠 |
| PC | 1024px~ | 상단 네비 + 사이드바(220px) + 콘텐츠 그리드 |

### 3-2. PC 레이아웃 (1024px 이상)

```
┌─────────────────────────────────────────────────────┐
│  🌿 ESG 액션    홈  뉴스  채용  ESG정보  봉사활동    │  ← 상단 네비 (다크 그린 #085041)
├──────────┬──────────────────────────────────────────┤
│          │                                          │
│  메뉴    │   콘텐츠 영역                             │
│  ──────  │   (카드 그리드 auto-fill minmax 300px)   │
│  현황    │                                          │
│  ──────  │                                          │
│  추천봉사│                                          │
│          │                                          │
└──────────┴──────────────────────────────────────────┘
  220px 사이드바        flex: 1 콘텐츠
```

**상세 패널:** 카드 클릭 시 오른쪽에서 슬라이드인 (width: 420px, position: fixed)

### 3-3. 모바일 레이아웃 (768px 이하)

```
┌──────────────────┐
│  콘텐츠 (단일열) │
│                  │
│                  │
│                  │
├──────────────────┤
│ 홈 뉴스 채용     │  ← 하단 탭 네비 (fixed)
│ ESG정보 봉사     │
└──────────────────┘
```

- 상단 네비바·사이드바 → `display: none`
- 하단 `.mobile-bottom-nav` → `display: flex`
- 카드 그리드 → 1열
- 상세 패널 → `width: 100%`, `top: 0` (전체화면)

### 3-4. Tailwind 반응형 클래스 패턴

```tsx
// 사이드바
<aside className="hidden md:block w-[180px] lg:w-[220px] shrink-0">

// 상단 네비
<nav className="hidden md:flex bg-[#085041] h-14 sticky top-0 z-50">

// 모바일 하단 네비
<nav className="flex md:hidden fixed bottom-0 inset-x-0 bg-white border-t z-50">

// 카드 그리드
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

// 최대 너비
<div className="max-w-[1280px] mx-auto px-4 md:px-6 py-4 md:py-7">
```

---

## 4. 라우팅 구조 (Next.js App Router)

| 경로 | 파일 | 설명 |
|------|------|------|
| `/` | `app/page.tsx` | 홈 — 뉴스 TOP3, 마감 임박 채용 TOP3, 추천 봉사 배너 |
| `/news` | `app/news/page.tsx` | ESG 뉴스 — AI 3줄 요약, E/S/G 필터, 키워드 검색 |
| `/jobs` | `app/jobs/page.tsx` | 채용 공고 — 사람인 RSS, 직무 필터, D-day 마감순 정렬 |
| `/info` | `app/info/page.tsx` | ESG 정보 — 기업등급 / 직무가이드 / 용어사전 탭 |
| `/volunteer` | `app/volunteer/page.tsx` | 봉사 목록 — E/S 탭 필터, 1365 인증 라벨 |
| `/volunteer/[id]` | `app/volunteer/[id]/page.tsx` | 봉사 상세 — 요강 뷰어 + 하단 고정 신청 버튼 |
| `/admin` | `app/admin/page.tsx` | 관리자 로그인 — Supabase Auth |
| `/admin/dashboard` | `app/admin/dashboard/page.tsx` | 관리자 대시보드 — 통계 / 봉사 등록 / 공고 관리 |

> 사용자 화면(` /`, `/news`, `/jobs`, `/info`, `/volunteer`)은 비로그인 접근 허용  
> 관리자 화면은 별도 관리자 웹 주소에서만 접근 (예: `admin.esg-action.kr`, 사용자 웹과 별도 Vercel 프로젝트)  
> 관리자 웹에서 ` /admin/dashboard` 이하 경로는 로그인 필수, 미인증 시 `/admin`으로 리다이렉트

### 4-1. 접근 권한 정책

- 사용자(일반 방문자): 로그인 없이 모든 사용자 페이지 열람 가능
- 관리자: 관리자 전용 웹 주소의 `/admin`에서 이메일/비밀번호 로그인 후 `/admin/dashboard` 접근
- 관리자 계정은 단일 계정(1인 운영) 기준으로 관리한다.
- 관리자 전용 기능: 봉사 등록/수정/삭제, ESG 정보 데이터 수정, 운영 통계 확인
- 사용자 UI에는 관리자 메뉴/링크를 노출하지 않음
- 사용자 웹에서는 관리자 라우트 자체를 제공하지 않음
- 관리자 웹은 접근 제어를 위해 로그인 페이지 외 전체 경로에 인증 가드 적용

---

## 5. DB 테이블 설계 (Supabase PostgreSQL)

> 모든 테이블 RLS(Row Level Security) 활성화

### 5-1. `news` — ESG 뉴스

```sql
create table news (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  summary        text[] not null,          -- GPT 3줄 요약 배열
  esg_category   varchar(1) not null,      -- 'E' | 'S' | 'G'
  source         text not null,
  original_url   text not null unique,     -- 중복 수집 방지
  published_at   timestamptz not null,
  collected_at   timestamptz not null,
  created_at     timestamptz default now()
);
```

### 5-2. `jobs` — 채용 공고

```sql
create table jobs (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  company        text not null,
  location       text,
  job_type       text,                     -- '정규직' | '인턴' 등
  deadline       date,
  apply_url      text not null,
  rss_guid       text not null unique,     -- RSS <guid> 중복 방지
  collected_at   timestamptz not null,
  created_at     timestamptz default now()
);
```

### 5-3. `volunteers` — 봉사활동 공고

```sql
create table volunteers (
  id                   uuid primary key default gen_random_uuid(),
  title                text not null,
  esg_category         varchar(1) not null,   -- 'E' | 'S'
  hours                text not null,
  location             text not null,
  capacity             text,
  benefit              text,
  description          text,
  image_url            text,                  -- 선택: 대표 이미지 URL
  target_outlink_url   text not null,         -- ⚠️ AI 수정 절대 금지 (Lock)
  is_1365              boolean default false,
  deleted_at           timestamptz,           -- Soft Delete (NULL = 활성)
  created_at           timestamptz default now()
);
```

> 봉사활동 데이터는 외부 자동 수집이 아닌 **관리자 직접 등록(수동 업로드)**을 원칙으로 한다.

### 5-4. `volunteer_click_logs` — 클릭 로그

```sql
create table volunteer_click_logs (
  id             bigserial primary key,
  volunteer_id   uuid references volunteers(id) on delete set null,
  clicked_at     timestamptz default now(),
  user_agent     text
);
```

> `volunteer_id`는 `ON DELETE SET NULL` — 공고 삭제(soft delete) 후에도 클릭 로그 보존

### 5-5. `esg_company_grades` — 기업 ESG 등급

```sql
create table esg_company_grades (
  id             uuid primary key default gen_random_uuid(),
  company_name   text not null,
  e_score        numeric(5,2),
  s_score        numeric(5,2),
  g_score        numeric(5,2),
  overall_grade  text,
  as_of_date     date not null,              -- 등급 기준일
  source_url     text,                       -- 원문 출처 링크
  is_active      boolean default true,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);
```

### 5-6. `esg_job_guides` — 직무 가이드

```sql
create table esg_job_guides (
  id                 uuid primary key default gen_random_uuid(),
  job_name           text not null unique,   -- ESG / 사회공헌 / CSR 등
  short_description  text not null,
  required_skills    text[] not null default '{}',
  details            text,
  display_order      int default 100,
  is_active          boolean default true,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);
```

### 5-7. `esg_terms` — ESG 용어사전

```sql
create table esg_terms (
  id             uuid primary key default gen_random_uuid(),
  term           text not null unique,
  category       text not null,              -- 핵심용어 / 공시프레임워크 / E지표 / S지표 / G지표
  summary        text not null,              -- 카드 기본 노출 요약
  source_url     text,                       -- 자세히 보기 링크
  is_active      boolean default true,
  display_order  int default 100,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);
```

---

## 6. API 데이터 수집 파이프라인

### 6-1. 뉴스 수집 — 네이버 검색 API

**엔드포인트**
```
GET https://openapi.naver.com/v1/search/news.json
  ?query={keyword}&display=10&sort=date
```

**인증 헤더**
```
X-Naver-Client-Id: {NAVER_CLIENT_ID}
X-Naver-Client-Secret: {NAVER_CLIENT_SECRET}
```

**검색 키워드 (5개 순환)**
`ESG` / `탄소중립` / `지속가능경영` / `ESG공시` / `사회공헌`

**수집 플로우**
```
1. 네이버 API 호출 → 최신 뉴스 10건 수집
2. original_url 기준 중복 체크 → 신규 기사만 통과
3. GPT-4o-mini 호출 → 3줄 요약 + E/S/G 카테고리 분류
4. Supabase news 테이블 INSERT (ON CONFLICT DO NOTHING)
```

**GPT 프롬프트 (3줄 요약 구조 고정, 라벨 미노출)**
```
다음 뉴스 기사를 대학생이 이해하기 쉽게 3줄로 요약하고,
ESG 카테고리(E/S/G 중 하나)를 JSON으로 반환하라.

summary 3줄 내용 구조:
1줄: 핵심 팩트 및 기업/기관 액션
2줄: 원인, 정량 수치, 구체적 방법
3줄: 대학생 관점(취업준비/과제/상식/트렌드) 의미

주의:
- (WHAT-핵심사건), (WHY/HOW), (INSIGHT-대학생관점) 같은 템플릿 라벨은 summary에 쓰지 않음
- URL/출처명/메타 문구를 summary에 쓰지 않음
- 원문에 없는 정보·수치·추측은 절대 추가하지 말 것

응답 형식:
{"summary": ["핵심 사건 문장", "원인/방법 문장", "대학생 관점 문장"], "category": "E"}
```

**실행 주기:** Supabase Edge Function cron **하루 2회**  
- KST 오전 12:00 (UTC `0 15 * * *`)
- KST 오후 12:00 (UTC `0 3 * * *`)

---

### 6-2. 채용 수집 — 사람인 RSS

> 사람인 RSS는 `location`, `job_type`, `deadline` 필드가 누락되거나 불완전할 수 있다.  
> 누락 시 저장 정책: `location = null`, `job_type = null`, `deadline = null`

**RSS URL 예시**
```
https://www.saramin.co.kr/zf_user/rss?search_area=main&search_done=y&keyword=ESG
```

**직무/검색 키워드(단순화)**
`ESG` / `사회공헌` / `CSR`

**파싱 코드 구조**
```typescript
import xml2js from 'xml2js';

const res = await fetch(
  'https://www.saramin.co.kr/zf_user/rss?keyword=ESG'
);
const xml = await res.text();
const parsed = await xml2js.parseStringPromise(xml);
const items = parsed.rss.channel[0].item;

// 각 item 구조
// items[i].title[0]    → 공고 제목
// items[i].link[0]     → 공고 URL
// items[i].guid[0]     → 중복 방지용 고유 ID
// items[i].pubDate[0]  → 게시 일시
```

**실행 주기:** Supabase Edge Function cron **하루 2회**  
- KST 오전 12:10 (UTC `10 15 * * *`)
- KST 오후 12:10 (UTC `10 3 * * *`)

**정렬/노출 정책**
- 정렬 기준: `마감 임박순` 단일 우선순위
- D-day 계산 기준: **현재 시각 기준(KST)**
- 만료 공고 처리: 마감 상태로 2일간 노출 후 삭제(또는 비노출 처리)
- 중복 기준: `rss_guid` 단일 기준(보조 중복키 미사용)

---

## 7. 페이지별 UI 상세 명세

### 7-1. 홈 (`/`)

| 영역 | PC | 모바일 |
|------|------|------|
| 추천 봉사 배너 | 가로 풀너비 히어로 (다크 그린 그라데이션) | 동일 |
| 뉴스 TOP3 + 채용 TOP3 | 2열 그리드 나란히 | 1열 순차 배치 |
| 채용 TOP3 정렬 기준 | D-day 오름차순 (마감 임박순) | 동일 |

### 7-2. ESG 뉴스 (`/news`)

- E(초록) / S(파랑) / G(보라) 카테고리 컬러 배지
- 키워드 검색 (제목 기준 클라이언트 필터)
- 카드 그리드: PC 2~3열, 모바일 1열

### 7-3. 채용 공고 (`/jobs`)

- 직무 필터: 전체 / ESG / 사회공헌 / CSR
- D-day 배지 컬러: D-3 이하 빨강, D-7 이하 주황, 이후 초록
- 마감 임박순 자동 정렬
- 카드 클릭 → PC: 우측 슬라이드 상세 패널 / 모바일: 전체화면 패널
- 만료 공고는 `마감` 상태 표시 후 2일 경과 시 목록에서 제거

### 7-4. ESG 정보 (`/info`)

탭 순서: **기업 ESG 등급 → 직무 가이드 → 용어사전**

| 탭 | 내용 |
|------|------|
| 기업 ESG 등급 | E·S·G 점수 카드 그리드, 대표 사례, 키 이니셔티브 pill (등급 변경사항 발생 시 최신 값으로 수정 반영) |
| 직무 가이드 | ESG기획·투자·탄소관리·사회공헌 4개 직무, 필요 역량 태그 |
| 용어사전 | 전체/핵심용어/공시프레임워크/E지표/S지표/G지표 서브탭, 키워드 검색, 펼치기 카드, 용어별 요약 설명 + 상세 학습용 외부 링크 |

**운영 규칙 (ESG 정보)**
- 기업 ESG 등급은 고정 데이터가 아니며, 공시/평가 변경 시 관리자 업데이트로 최신화한다.
- 용어사전 카드는 `용어명 + 짧은 요약 설명`을 기본 노출한다.
- 사용자가 더 자세히 보길 원할 때를 위해, 각 용어에 `참고 웹사이트 링크(source_url)`를 제공한다.
- 외부 링크는 새 탭으로 연다 (`target="_blank"`, `rel="noopener noreferrer"`).

### 7-5. 봉사활동 (`/volunteer`)

- E(환경보호) / S(사회공헌) 탭 필터
- 1365 인증 가능 공고: 초록 라벨 시각화
- 노출 데이터 소스: `volunteers` 테이블 (관리자 등록분만 노출)
- 사용자 노출 항목: 봉사활동 제목, 모집인원, 봉사 내용(요약), 대표 이미지(있는 경우)
- 신청 버튼 텍스트 동적 변경:
  - `forms.gle` 포함 → `구글 폼으로 신청하기`
  - 그 외 → `학교 홈페이지에서 신청하기`
- `target="_blank"` 아웃링크
- `deleted_at is null` 인 공고만 사용자 화면에 노출
- `target_outlink_url`은 `http://` 또는 `https://` 유효 URL만 허용
- 사용자가 `참여 신청` 버튼 클릭 시, 관리자가 등록한 `target_outlink_url` 웹페이지로 즉시 이동
- 봉사 대표 이미지는 관리자가 업로드하며, 업로드된 파일 URL을 `image_url`에 저장해 노출한다.

### 7-6. 관리자 대시보드 (`/admin/dashboard`)

| 탭 | 기능 |
|------|------|
| 📊 통계 | 총 클릭 수, 등록 봉사 수, Top 5 선호도 바 차트 |
| ➕ 봉사 등록 | 입력 폼(제목/카테고리/시간/장소/모집인원/혜택/설명/대표이미지URL/신청링크/1365 여부) → Supabase INSERT |
| 📋 공고 관리 | 목록 + Soft Delete (`deleted_at = now()`) |

**봉사 등록 운영 규칙**
- 봉사 공고는 관리자 페이지에서만 등록/수정/삭제(soft delete) 가능
- 사용자 페이지에는 봉사 등록/수정 기능을 노출하지 않음
- 신청 링크(`target_outlink_url`)는 관리자 입력값을 원본 그대로 저장하고 AI가 수정하지 않음

---

## 8. 공통 컴포넌트 구조

```
components/
├── layout/
│   ├── TopNav.tsx          # PC 상단 네비 (hidden md:flex)
│   ├── Sidebar.tsx         # PC 좌측 사이드바 (hidden md:block)
│   └── MobileBottomNav.tsx # 모바일 하단 탭 (flex md:hidden)
├── ui/
│   ├── Badge.tsx           # ESG 카테고리 배지 (E/S/G/공시)
│   ├── DdayBadge.tsx       # D-day 컬러 배지
│   ├── CardGrid.tsx        # 반응형 카드 그리드 래퍼
│   └── DetailPanel.tsx     # 우측 슬라이드 상세 패널
├── news/
│   └── NewsCard.tsx
├── jobs/
│   └── JobCard.tsx
├── volunteer/
│   ├── VolunteerCard.tsx
│   └── VolunteerDetail.tsx
└── info/
    ├── GradeCard.tsx
    ├── JobGuideCard.tsx
    └── DictCard.tsx        # 펼치기/접기 용어 카드
```

---

## 9. AI 설계 제약 (Cursor AI 필수 준수)

| 항목 | 규칙 |
|------|------|
| 할루시네이션 방지 | 뉴스 3줄 요약 시 원문에 없는 수치·정보·인용구 절대 생성 금지 |
| **URL 변조 금지** | `target_outlink_url`을 AI가 임의 수정·단축·리다이렉션 분석 절대 금지 |
| Soft Delete | 봉사 삭제 시 `DELETE` 아닌 `deleted_at = now()` UPDATE만 허용 |
| 클릭 로그 보존 | `volunteer_id FK`는 `ON DELETE SET NULL` — 공고 삭제 후에도 로그 유지 |
| 개인정보 미수집 | 유저 테이블·인적사항 DB 저장 구조 생성 금지 (비로그인 정책) |
| 관리자 UI 분리 | `/admin` 이하 경로를 사용자 화면 어디에서도 노출하지 않는다 |
| 관리자 인증 필수 | `/admin/dashboard` 이하 기능은 Supabase Auth 세션 인증된 관리자만 접근 |
| 단일 관리자 계정 | 관리자 인증은 사전에 지정한 1개 계정 기준으로 허용 |

---

## 10. 환경변수 (`.env.local`)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...        # Edge Function 전용
NAVER_CLIENT_ID=xxxxxxxx
NAVER_CLIENT_SECRET=xxxxxxxx
OPENAI_API_KEY=sk-...
ADMIN_BASE_URL=https://admin.esg-action.kr
ADMIN_EMAIL=admin@esg-action.kr
```

---

## 11. 글로벌 CSS 핵심 설정

```css
/* globals.css */
:root {
  --green: #1D9E75;
  --dark:  #085041;
}

/* PC: 좌우 여백 배경, 앱 영역 그림자 */
body {
  background: #F0F4F2;
}

/* 모바일: 하단 탭 높이만큼 콘텐츠 패딩 */
@media (max-width: 768px) {
  .page-wrap {
    padding-bottom: 80px;
  }
}
```

---

## 12. Phase 2 확장 고려사항

> MVP 검증 후 아래 기능 도입 시 DB 확장 필요. Phase 1 설계 시 `users` 테이블 추가를 염두에 둘 것.

- 개인별 ESG 활동 포트폴리오 PDF 자동 발행
- 회원 가입 체계 전환 (Supabase Auth 소셜 로그인)
- 클릭 로그 기반 개인화 추천 알고리즘
- 봉사활동 참여 확인 QR 코드 발행

---

## 13. Cursor 구현용 실행 체크리스트 (복붙 실행)

> 아래 체크박스 기준으로 구현 순서를 고정한다.  
> 원칙: **스키마/보안(RLS) → 수집 파이프라인 → 페이지 UI → 관리자 기능 → 테스트/배포**

### 13-1. 프로젝트 부트스트랩

- [ ] Next.js 14 + TypeScript + Tailwind 프로젝트 생성
- [ ] Supabase 프로젝트 연결 (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- [ ] `.env.local` 키 주입 (`NAVER_*`, `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
- [ ] App Router 기본 라우트 파일 생성 (`/`, `/news`, `/jobs`, `/info`, `/volunteer`, `/admin`, `/admin/dashboard`)

### 13-2. DB 스키마 및 인덱스

- [ ] `news`, `jobs`, `volunteers`, `volunteer_click_logs` 테이블 생성
- [ ] RLS 활성화 (모든 테이블)
- [ ] 인덱스 생성
  - [ ] `news (published_at desc, esg_category)`
  - [ ] `jobs (deadline, created_at)`
  - [ ] `volunteers (esg_category, deleted_at)`
  - [ ] `volunteer_click_logs (volunteer_id, clicked_at)`

### 13-3. RLS 정책 (필수 구체화)

> "RLS 활성화"만으로는 부족. 아래 정책을 실제 SQL 정책으로 구현해야 함.

- [ ] 공개 조회 허용: `news`, `jobs`, `volunteers(deleted_at is null)`
- [ ] 비공개 테이블 제한: `volunteer_click_logs`는 관리자만 조회 허용
- [ ] 관리자 쓰기 권한: `volunteers INSERT/UPDATE`, soft delete(`deleted_at=now()`) 관리자만 허용
- [ ] 관리자 경로 보호: `/admin/dashboard` 이하는 미인증 시 `/admin` 리다이렉트

### 13-4. 뉴스 수집 파이프라인

- [ ] Edge Function 생성: 네이버 뉴스 수집
- [ ] 키워드 5개 순환 호출 (`ESG`, `탄소중립`, `지속가능경영`, `ESG공시`, `사회공헌`)
- [ ] 중복 제거 (`original_url unique` + upsert/ignore)
- [ ] GPT 요약 입력 규칙 고정: `title + description`만 사용
- [ ] GPT 출력 JSON 검증 실패 시 해당 건 skip + 로그 기록
- [ ] cron 등록 (하루 2회)
  - [ ] KST 오전 12:00 (UTC `0 15 * * *`)
  - [ ] KST 오후 12:00 (UTC `0 3 * * *`)

### 13-5. 채용 수집 파이프라인

- [ ] Edge Function 생성: 사람인 RSS 파싱
- [ ] 중복 제거 (`rss_guid unique`)
- [ ] 필드 파싱 실패 처리 규칙
  - [ ] `deadline` 파싱 실패 시 `null`
  - [ ] `location/job_type` 누락 시 `null`
  - [ ] 필수값(`title/company/apply_url/rss_guid`) 누락 시 skip
- [ ] cron 등록 (하루 2회)
  - [ ] KST 오전 12:10 (UTC `10 15 * * *`)
  - [ ] KST 오후 12:10 (UTC `10 3 * * *`)

### 13-6. 프론트 반응형 레이아웃

- [ ] PC: 상단 네비 + 좌측 사이드바 + 콘텐츠 그리드
- [ ] 모바일: 하단 탭 네비 + 단일 컬럼 + 전체화면 상세 패널
- [ ] 모바일 하단 safe-area 대응 (`padding-bottom: calc(80px + env(safe-area-inset-bottom))`)
- [ ] `components/layout/*`, `components/ui/*` 공통 컴포넌트 먼저 구현

### 13-7. 페이지 구현

- [ ] 홈: 뉴스 TOP3 + 채용 TOP3 + 추천 봉사 배너
- [ ] 뉴스: E/S/G 필터 + 제목 검색 + 3줄 요약 카드
- [ ] 채용: 직무 필터 + D-day 배지 + 마감 임박 정렬
- [ ] ESG 정보: 3탭(기업등급/직무가이드/용어사전)
- [ ] 봉사: E/S 탭 + 1365 라벨 + 외부신청 버튼 텍스트 분기
- [ ] 관리자 대시보드: 통계/등록/공고관리(soft delete)

### 13-8. 운영 안정성 (필수)

- [ ] 수집 함수 에러 로깅 구조 통일 (`job_name`, `status`, `error_message`, `created_at`)
- [ ] "당일 수집 0건" 탐지 시 경고 로그 남기기
- [ ] 동일 배치 중복 실행 방지 플래그(락) 적용
- [ ] 외부 API timeout/retry 정책 정의 (예: timeout 10초, retry 2회)

### 13-9. 테스트 체크리스트 (MVP 최소)

- [ ] `/news` 필터/검색 정상 동작
- [ ] `/jobs` D-day 정렬 및 배지 색상 규칙 일치
- [ ] `/volunteer` 버튼 분기(`forms.gle`) 정확
- [ ] 관리자 미인증 접근 차단 확인
- [ ] soft delete 후 사용자 화면에서 비노출 확인
- [ ] 클릭 로그 저장 및 통계 반영 확인

### 13-10. 배포 전 최종 점검

- [ ] Vercel 환경변수 모두 등록
- [ ] Supabase Edge Function 환경변수 등록
- [ ] cron 정상 등록/실행 확인
- [ ] RLS 정책 재검증 (anon이 관리자 쓰기 불가인지 확인)
- [ ] Lighthouse 모바일 기본 점수 확인 (성능/접근성)

---

*🌿 ESG 액션 플랫폼 개발 명세서 v2.1 · Cursor 구현 실행용 포함*
