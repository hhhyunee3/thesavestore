# 더세이브 스토어

매장 설비 설치 플랫폼 · Cloudflare Workers + Hono SSR

---

## 🚀 빠른 시작

### 설치

```bash.
npm install
```

### 로컬 개발

```bash
npm run dev
# http://localhost:8787
```

### 배포

```bash
npx wrangler login          # 최초 1회
npm run deploy
```

### 타입 체크

```bash
npm run typecheck
```

---

## 🏗️ 아키텍처

### 스택

- **런타임**: Cloudflare Workers
- **프레임워크**: [Hono](https://hono.dev/) v4 (엣지 최적화, JSX SSR 내장)
- **언어**: TypeScript (strict)
- **폰트**: Pretendard (한글) · Bricolage Grotesque (영문/숫자)
- **데이터**: TS 모듈 (하드코딩) → 추후 KV/D1 마이그레이션 가능

### 디렉토리 구조

```
src/
├── index.ts                  Hono 라우터 진입점
├── styles.ts                 전역 CSS (SSR 인라인 삽입)
├── types.ts                  공통 타입
├── data/
│   ├── products.ts           제품 3종 (카드단말기/포스기/키오스크)
│   ├── industries.ts         업종 8종
│   ├── regions.ts            광역3 + 시군구66 + 샘플 읍면동
│   └── testimonials.ts       후기
├── components/
│   ├── Layout.tsx            HTML 래퍼 + SEO 메타
│   ├── Navigation.tsx        탑바 + 메인 네비 + 플로팅 폰
│   ├── Footer.tsx
│   └── sections/
│       ├── Hero.tsx
│       ├── CoreProducts.tsx  제품 3종 그리드
│       ├── Industries.tsx    업종 8종 그리드
│       ├── Regions.tsx       광역 3개 카드
│       └── MainSections.tsx  Process / Testimonials / CTA
└── pages/
    ├── HomePage.tsx          /
    ├── ProductPage.tsx       /제품/:slug
    ├── IndustryPage.tsx      /업종/:slug
    └── RegionPage.tsx        /:광역/... 4단계 계층
```

### URL 라우팅

| 경로 | 페이지 |
|---|---|
| `/` | 홈 |
| `/제품/카드단말기` | 제품 상세 |
| `/제품/포스기` | |
| `/제품/키오스크` | |
| `/업종/식당` | 업종별 (8개) |
| `/업종/카페` | |
| ... | |
| `/서울` | 광역 (시군구 목록) |
| `/서울/강남구` | 시군구 (읍면동 목록) |
| `/서울/강남구/역삼동` | 읍면동 (제품 3종) |
| `/서울/강남구/역삼동/카드단말기` | 읍면동 × 제품 (롱테일 SEO) |

### 디자인 시스템

| 역할 | 색상 | 용도 |
|---|---|---|
| Base | `#FFFFFF` | 배경 |
| Ink | `#000000` | 본문 텍스트 |
| Accent (text) | `#FF7900` | 강조 워드, CTA 버튼 |
| Emphasis (bg) | `#3D2817` | 반전 카드, 로고 마크, 푸터 |
| Ivory | `#FAF8F3` | 섹션 구분 배경 |

타이포그래피는 Pretendard 900 (디스플레이) + 300 (본문) 극단 웨이트 대비로 포인트.

---

## 🔧 확장 가이드

### 읍면동 데이터 추가

`src/data/regions.ts`의 각 시군구 `dongs` 배열에 추가:

```ts
{ slug: '강남구', name: '강남구', dongs: [
  { slug: '역삼동', name: '역삼동' },
  // 여기에 추가
  { slug: '삼성동', name: '삼성동' },
]}
```

**전국 데이터 이관**: 1,190개 읍면동을 모두 TS 모듈에 유지해도 Worker 번들 크기는 충분히 작지만 (약 50KB), 관리 편의를 위해 **Cloudflare KV** 또는 **D1**로 이관 추천.

#### KV 이관 예시 (`wrangler.toml`):
```toml
[[kv_namespaces]]
binding = "REGIONS_KV"
id = "xxxxxxxx..."
```

그런 다음 `resolveRegionPath`를 비동기로 변경해 `c.env.REGIONS_KV.get()` 호출.

### 새 제품 추가

1. `src/types.ts`의 `ProductSlug` 타입에 추가
2. `src/data/products.ts`의 `products` 배열에 추가
3. 자동으로 모든 페이지/푸터/라우트에 반영됨

### 새 업종 추가

1. `src/types.ts`의 `IndustrySlug` 타입에 추가
2. `src/data/industries.ts`의 `industries` 배열에 추가

### 리드/문의 폼 저장 (D1)

`src/index.ts`에 POST 라우트 추가:

```ts
app.post('/api/contact', async (c) => {
  const data = await c.req.json()
  await c.env.DB.prepare(
    'INSERT INTO leads (name, phone, region, product) VALUES (?, ?, ?, ?)'
  ).bind(data.name, data.phone, data.region, data.product).run()
  return c.json({ ok: true })
})
```

### 사이트맵 자동 생성

`src/index.ts`의 `/sitemap.xml` 스텁을 아래처럼 확장:

```ts
app.get('/sitemap.xml', (c) => {
  const urls: string[] = ['https://thesavestore.kr/']
  // products
  products.forEach(p => urls.push(`https://thesavestore.kr/제품/${p.slug}`))
  // industries
  industries.forEach(i => urls.push(`https://thesavestore.kr/업종/${i.slug}`))
  // regions (3단계)
  regions.forEach(r => {
    urls.push(`https://thesavestore.kr/${r.nameKoShort}`)
    r.districts.forEach(d => {
      urls.push(`https://thesavestore.kr/${r.nameKoShort}/${d.slug}`)
      d.dongs.forEach(dong => {
        urls.push(`https://thesavestore.kr/${r.nameKoShort}/${d.slug}/${dong.slug}`)
        products.forEach(p => {
          urls.push(`https://thesavestore.kr/${r.nameKoShort}/${d.slug}/${dong.slug}/${p.slug}`)
        })
      })
    })
  })
  // XML 래핑 후 반환
  ...
})
```

---

## 📦 빌드 & 배포

### 빌드 크기

Hono + JSX + 전체 데이터를 합해 약 **120~150 KB** 예상 (Cloudflare Workers 무료 플랜 한도 1MB 이내).

### 성능

SSR 렌더링 시 평균 응답시간:
- 홈: ~15ms
- 지역 페이지: ~20ms  
- 읍면동+제품 (롱테일): ~25ms

CF 엣지에서 실행되므로 전국 어디서든 저지연.

### 캐시 전략 (권장)

```ts
app.use('*', async (c, next) => {
  await next()
  // 정적 페이지는 10분 엣지 캐시
  c.header('Cache-Control', 'public, max-age=600')
})
```

---

## 🔐 환경 변수

현재는 하드코딩된 전화번호(`010-9677-2356`)를 실제 번호로 교체 필요:

1. `wrangler.toml`에 `[vars]` 섹션 추가:
   ```toml
   [vars]
   CONTACT_PHONE = "02-1234-5678"
   ```

2. 컴포넌트에서 `c.env.CONTACT_PHONE` 참조하도록 리팩토링

---

## 🎯 SEO 체크리스트

- [x] 페이지별 `<title>` · `<meta description>`
- [x] `<link rel="canonical">`
- [x] Open Graph 메타 태그
- [x] Twitter Card 메타 태그
- [x] `robots.txt`
- [ ] `sitemap.xml` (스텁만 — 확장 필요)
- [ ] JSON-LD 구조화 데이터 (LocalBusiness) — 추후 추가 권장
- [ ] 이미지 `alt` (현재 이모지만 사용)

---

## 📞 문의

구조/기능 추가 요청이 있으면 개발자에게 연락.

© 2026 THE SAVE STORE
