// thesavestore.com 카드단말기 지역별 페이지 워커
// /region/{시도}/{시군구}/{법정동} 영어 슬러그로 라우팅
// 5347개 페이지 동적 생성 + 사이트맵 + robots.txt

import { SIDO, SIGUNGU, DONG, SIDO_INDEX, SIGUNGU_INDEX, DONG_INDEX } from './regions.js';

const BASE_URL = 'https://thesavestore.com';

// ==================== 유틸 ====================
// URL 시드 기반 결정적 변형(같은 URL은 항상 같은 콘텐츠)
function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function pick(arr, seed) {
  return arr[seed % arr.length];
}

// ==================== 콘텐츠 변형 풀 ====================
const INTRO_OPENINGS = [
  (region) => `${region} 카드단말기는 자영업자와 매장 운영자에게 필수적인 결제 솔루션입니다.`,
  (region) => `${region} 지역에서 매장을 운영하신다면 카드단말기 선택은 매출과 직결되는 중요한 결정입니다.`,
  (region) => `${region}에서 카드단말기 설치를 고민 중이시라면 더세이브스토어를 추천드립니다.`,
  (region) => `최근 ${region} 자영업 시장은 카드 및 간편결제 비중이 90%를 넘어서고 있습니다.`,
  (region) => `${region} 매장에서 안정적인 결제 환경 구축은 매장 운영의 기본입니다.`,
  (region) => `${region} 자영업자라면 누구나 한 번쯤 카드단말기 교체를 고민하게 됩니다.`,
  (region) => `${region} 지역 상권의 변화에 맞춰 카드단말기도 진화하고 있습니다.`,
];

const STRENGTH_INTROS = [
  '더세이브스토어를 선택해야 하는 이유는 다음과 같습니다.',
  '다른 업체와 비교해도 더세이브스토어가 차별화되는 부분이 분명합니다.',
  '왜 자영업자분들이 더세이브스토어를 선택하시는지 그 이유를 정리해 드립니다.',
  '경쟁 업체와 비교했을 때 더세이브스토어만의 강점은 다음과 같습니다.',
];

const CTA_LINES = [
  '지금 바로 무료 상담을 신청하시고 매장 운영 효율을 높여보세요.',
  '부담 없이 상담받으시고 매장에 가장 적합한 단말기를 추천받아 보세요.',
  '상담은 무료이며, 의무 가입 조건은 전혀 없습니다.',
  '지금 신청하시면 가장 빠른 일정으로 설치해 드립니다.',
];

const TERMINAL_TIPS = [
  '편의점·약국처럼 결제가 빠르게 이루어져야 하는 매장은 유선 단말기가 안정적입니다.',
  '카페·음식점처럼 테이블 결제가 잦은 곳은 무선 단말기를 추천드립니다.',
  '미용실·학원처럼 예약 관리까지 필요한 매장은 포스(POS)형 단말기가 효율적입니다.',
  '배달·출장이 잦은 업종은 모바일 결제 단말기가 가장 적합합니다.',
  '도매·시장 업종처럼 고액 결제가 많은 매장은 처리 속도가 빠른 전용 단말기가 좋습니다.',
];

// ==================== 콘텐츠 생성 ====================
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function buildSidoPage(sido) {
  const url = `${BASE_URL}/region/${sido.slug}`;
  const seed = hash(url);
  const intro = pick(INTRO_OPENINGS, seed)(sido.name);
  const strengthIntro = pick(STRENGTH_INTROS, seed + 1);
  const cta = pick(CTA_LINES, seed + 2);
  const tip1 = pick(TERMINAL_TIPS, seed + 3);
  const tip2 = pick(TERMINAL_TIPS, seed + 5);
  
  const districtCount = SIGUNGU.filter(s => s.sido === sido.slug).length;
  const highlights = sido.highlights.join(', ');
  
  return wrapHtml({
    title: `${sido.short} 카드단말기 무료 설치 | 더세이브스토어`,
    description: `${sido.name} 카드단말기 무료 설치 더세이브스토어. ${highlights} 등 ${districtCount}개 지역 당일 설치 가능. 합리적 수수료, 24시간 A/S.`,
    canonical: url,
    breadcrumb: [{name: '홈', url: '/'}, {name: '지역별', url: '/region'}, {name: sido.short}],
    bodyHtml: `
<h1>${sido.name} 카드단말기 무료 설치 - 더세이브스토어</h1>

<p class="lead">${sido.name} ${districtCount}개 시군구 전 지역, 카드단말기를 무료로 설치해 드립니다. ${highlights} 등 어느 지역이든 당일 또는 1~2일 이내 빠른 설치가 가능합니다.</p>

<h2>${sido.short} 카드단말기 설치, 왜 더세이브스토어인가?</h2>
<p>${intro} ${sido.name}은 ${sido.trait}으로, ${sido.industries} 등 다양한 업종이 활발하게 운영되고 있습니다. ${highlights} 핵심 상권에서 매일 수많은 결제가 이루어지며, 안정적인 카드단말기는 매출 누락 방지와 고객 결제 편의 향상에 직결됩니다.</p>

<p>최근 ${sido.short} 자영업 시장에서는 현금 결제 비중이 빠르게 줄고 카드 및 간편결제 비중이 90%를 넘어서고 있습니다. 손님이 카드 또는 페이로 결제하려는데 단말기가 작동하지 않거나 특정 결제 수단을 지원하지 않으면 그 자리에서 매출이 사라집니다. 그래서 ${sido.short} 매장은 단말기 선택과 설치 업체 선정이 그 어느 때보다 중요합니다. 더세이브스토어는 ${sido.short} 지역 특성을 반영한 맞춤형 카드단말기 설치 서비스를 제공합니다.</p>

<h2>${sido.short} 자영업자가 카드단말기 교체를 고민해야 할 시기</h2>
<p>이미 단말기를 사용 중인 ${sido.short} 매장이라면 다음 상황에서 교체를 적극 검토해야 합니다. 첫째, 결제 처리 속도가 눈에 띄게 느려졌거나 결제 오류가 자주 발생하는 경우입니다. 손님 대기 시간이 길어지면 매장 이미지에 부정적인 영향을 주고 단골 고객의 이탈로 이어질 수 있습니다. 둘째, 신규 결제 수단을 지원하지 못하는 경우입니다. 애플페이, 삼성페이, 카카오페이 등 간편결제가 일상화된 지금, 구형 단말기는 매출 손실의 직접적인 원인이 됩니다. 셋째, A/S가 원활하지 않은 경우입니다. 영업 중 고장이 발생했을 때 즉시 대응받지 못한다면 그날 매출 전체가 위협받습니다.</p>

<h2>더세이브스토어 ${sido.short} 카드단말기 4가지 강점</h2>
<p>${strengthIntro}</p>

<h3>1. ${sido.short} 전 지역 무료 출장 설치</h3>
<p>${highlights} 등 ${sido.name} ${districtCount}개 시군구 어디든 무료 출장 설치가 가능합니다. 별도의 설치비 부담 없이 자영업자가 안정적인 결제 환경을 구축할 수 있도록 지원합니다. 외곽 지역이라고 해서 설치비가 추가되거나 일정이 늦어지는 일이 없으며, ${sido.short} 전 지역 동일한 조건으로 진행됩니다.</p>

<h3>2. 당일 또는 1~2일 이내 빠른 설치</h3>
<p>${sido.short} 지역은 신청 후 최단 당일 설치가 가능하며, 평균 1~2일 이내 완료됩니다. 신규 창업자, 매장 이전 자영업자, 오픈을 앞둔 매장 모두 빠르게 결제 환경을 갖출 수 있습니다. 오픈 일정이 정해진 매장이라면 미리 상담해 두시면 오픈 당일에 맞춰 단말기가 가동되도록 일정을 조율해 드립니다.</p>

<h3>3. 합리적인 수수료 자동 적용</h3>
<p>신용카드, 체크카드, 간편결제(삼성페이, 애플페이, 카카오페이, 제로페이 등)에 대해 합리적인 수수료를 적용합니다. 영세·중소 가맹점 우대수수료가 자동 적용되어 ${sido.short} 자영업자의 수수료 부담을 최소화합니다. 매월 부과되는 단말기 임대료, 통신비, 부가 서비스 비용 역시 투명하게 공개해 예측 가능한 비용 구조를 제공합니다.</p>

<h3>4. 24시간 A/S 신속 지원</h3>
<p>${sido.short} 전역에 A/S 거점을 확보해 단말기 오류 발생 시 신속히 대응합니다. 영업 중 결제가 끊기지 않도록 빠르게 조치해 매출 손실을 막아드립니다. 점심시간, 저녁 피크 타임처럼 결제가 몰리는 시간대에도 즉시 대응 가능한 ${sido.short} 전담 기사를 운영합니다.</p>

<h2>${sido.short} 매장에 맞는 카드단말기 종류</h2>
<p>${tip1} ${tip2} ${sido.short} 매장 환경과 업종에 따라 적합한 단말기가 다르므로, 상담을 통해 가장 효율적인 솔루션을 안내해 드립니다.</p>

<h3>유선 카드단말기</h3>
<p>편의점, 약국, 작은 식당 등 고정 카운터 운영 매장에 적합합니다. 안정적인 통신과 빠른 처리 속도가 장점이며, 통신 장애에 강합니다. 전용 회선을 사용하기 때문에 인터넷 끊김에 영향을 적게 받아 결제 누락 위험이 낮습니다.</p>

<h3>무선 카드단말기</h3>
<p>이동이 잦은 매장에 적합합니다. 와이파이 또는 LTE로 어디서든 결제가 가능해 카페, 푸드트럭, 야외 매장에서 인기가 높습니다. 테이블에서 직접 결제를 받을 수 있어 손님이 카운터까지 이동하지 않아도 됩니다.</p>

<h3>포스(POS)형 단말기</h3>
<p>음식점, 미용실, 학원 등 결제와 매출 관리를 동시에 해야 하는 매장에 추천합니다. 메뉴 관리, 재고 관리, 매출 통계 기능까지 통합 제공됩니다.</p>

<h3>모바일 결제 단말기</h3>
<p>배달 매장, 출장 서비스, 행사장 등 휴대성이 중요한 곳에 적합합니다. 스마트폰과 연동해 사용하므로 공간 제약이 없고, 초기 비용이 가장 적게 듭니다.</p>

<h2>${sido.short} 카드단말기 설치 절차</h2>
<ol>
  <li><strong>상담 신청</strong>: 홈페이지 또는 전화로 무료 상담을 신청합니다.</li>
  <li><strong>매장 환경 확인</strong>: 위치, 업종, 결제 빈도를 확인하고 최적의 단말기를 추천합니다.</li>
  <li><strong>서류 제출</strong>: 사업자등록증, 신분증, 통장사본 등을 준비해 주세요.</li>
  <li><strong>가맹점 등록</strong>: 카드사 가맹점 등록을 대행해 드립니다.</li>
  <li><strong>매장 방문 설치</strong>: 직접 매장을 방문해 무료로 설치하고 사용법을 안내합니다.</li>
  <li><strong>사용 시작</strong>: 설치 직후 바로 결제를 받을 수 있습니다.</li>
</ol>
<p>설치 당일에는 단말기 작동법, 영수증 출력, 매출 마감, 정산 확인, 오류 대처법까지 자세히 안내해 드리므로 처음 카드단말기를 사용하시는 분도 어려움 없이 운영하실 수 있습니다.</p>

<h2>${sido.short} 카드단말기 수수료 안내</h2>
<p>${sido.short} 자영업자의 가장 큰 관심사는 수수료입니다. 더세이브스토어는 영세 가맹점(연매출 3억 원 이하)과 중소 가맹점에 대해 우대 수수료를 자동 적용하며, 단말기 설치비는 무료입니다. 별도의 월 임대료 부담 없이 합리적인 조건으로 이용하실 수 있습니다. 정확한 수수료율은 매장 업종과 매출 규모에 따라 차이가 있으므로 상담을 통해 정확히 안내해 드립니다.</p>

<h2>자주 묻는 질문 (FAQ)</h2>
<h3>Q. ${sido.short} 어느 지역까지 설치 가능한가요?</h3>
<p>${sido.name} ${districtCount}개 시군구 전 지역 설치가 가능합니다. 외곽 지역도 추가 비용 없이 동일한 조건으로 진행됩니다.</p>

<h3>Q. 설치까지 얼마나 걸리나요?</h3>
<p>서류 접수 후 최단 당일, 평균 1~2일 이내 설치가 완료됩니다.</p>

<h3>Q. 어떤 결제 수단을 지원하나요?</h3>
<p>신용카드, 체크카드, 삼성페이, 애플페이, 카카오페이, 제로페이, 모바일상품권 등 모든 주요 결제 수단을 지원합니다.</p>

<h3>Q. 매장을 옮길 경우 어떻게 하나요?</h3>
<p>${sido.short} 내 이전이라면 단말기를 그대로 사용 가능하며, 더세이브스토어가 무료로 재설치를 지원합니다.</p>

<h2>지금 바로 무료 상담을 신청하세요</h2>
<p>${sido.short}에서 카드단말기 설치를 고민하고 있다면 더세이브스토어가 가장 합리적인 선택입니다. 무료 설치, 빠른 처리, 합리적인 수수료, 안정적인 A/S까지 자영업자에게 필요한 모든 조건을 갖추고 있습니다. ${highlights} 어느 지역이든 신속하게 방문하여 매장에 최적화된 결제 환경을 구축해 드립니다. ${cta}</p>

<div class="cta"><a href="/contact">${sido.short} 카드단말기 무료 상담 신청</a></div>

<h2>${sido.short} 시군구별 페이지</h2>
<ul class="region-list">
${SIGUNGU.filter(s => s.sido === sido.slug).map(s => `  <li><a href="/region/${sido.slug}/${s.slug}">${s.name}</a></li>`).join('\n')}
</ul>
`,
  });
}

function buildSigunguPage(sigungu) {
  const sido = SIDO_INDEX[sigungu.sido];
  const url = `${BASE_URL}/region/${sigungu.sido}/${sigungu.slug}`;
  const seed = hash(url);
  const intro = pick(INTRO_OPENINGS, seed)(`${sido.short} ${sigungu.name}`);
  const strengthIntro = pick(STRENGTH_INTROS, seed + 1);
  const cta = pick(CTA_LINES, seed + 2);
  const tip1 = pick(TERMINAL_TIPS, seed + 3);
  const tip2 = pick(TERMINAL_TIPS, seed + 5);
  const tip3 = pick(TERMINAL_TIPS, seed + 7);
  
  const dongCount = DONG.filter(d => d.sido === sigungu.sido && d.sigungu === sigungu.slug).length;
  const fullName = `${sido.name} ${sigungu.name}`;
  const region = `${sido.short} ${sigungu.name}`;
  
  return wrapHtml({
    title: `${region} 카드단말기 무료 설치 | 더세이브스토어`,
    description: `${fullName} 카드단말기 무료 설치. 당일 또는 1~2일 이내 빠른 설치 가능. 합리적 수수료, 24시간 A/S 지원. 더세이브스토어.`,
    canonical: url,
    breadcrumb: [{name:'홈',url:'/'},{name:'지역별',url:'/region'},{name:sido.short,url:`/region/${sido.slug}`},{name:sigungu.name}],
    bodyHtml: `
<h1>${region} 카드단말기 무료 설치</h1>

<p class="lead">${fullName} 전 지역, 카드단말기를 무료로 설치해 드립니다. ${sigungu.name} 어느 동이든 당일 또는 1~2일 이내 빠른 설치가 가능합니다.</p>

<h2>${region} 카드단말기, 왜 더세이브스토어인가?</h2>
<p>${intro} ${sigungu.name}은 ${sido.short}의 주요 자치구 중 하나로, 다양한 업종의 매장이 활발하게 운영되고 있습니다. 안정적인 카드단말기는 매출 누락 방지와 고객 결제 편의 향상에 직결됩니다. 더세이브스토어는 ${sigungu.name} 지역 특성을 반영한 맞춤형 설치 서비스를 제공합니다.</p>

<p>${region}에서 매장을 운영하는 자영업자라면 한 번쯤 단말기 교체를 고민하게 됩니다. 결제 속도가 느려졌거나, 신규 결제 수단을 지원하지 못하거나, A/S가 원활하지 않다면 교체를 적극 검토해야 합니다. 더세이브스토어는 ${sigungu.name} 매장 환경에 맞춰 최적의 단말기를 추천해 드리고, 신속한 설치와 안정적인 운영을 보장합니다.</p>

<h2>더세이브스토어 ${region} 카드단말기 강점</h2>
<p>${strengthIntro}</p>

<h3>${region} 무료 출장 설치</h3>
<p>${sigungu.name} 전 지역 어디든 무료 출장 설치가 가능합니다. 별도의 설치비 부담 없이 ${region} 자영업자가 안정적인 결제 환경을 구축할 수 있도록 지원합니다. ${sigungu.name} 내 어느 동이라도 동일한 조건으로 신속하게 진행됩니다.</p>

<h3>당일 또는 1~2일 이내 빠른 설치</h3>
<p>${region}은 신청 후 최단 당일 설치가 가능하며, 평균 1~2일 이내 완료됩니다. 신규 창업자, 매장 이전 자영업자, 오픈을 앞둔 매장 모두 빠르게 결제 환경을 갖출 수 있습니다.</p>

<h3>합리적인 수수료 자동 적용</h3>
<p>신용카드, 체크카드, 삼성페이, 애플페이, 카카오페이, 제로페이 등 모든 주요 결제 수단에 대해 합리적인 수수료를 적용합니다. 영세·중소 가맹점 우대수수료가 자동 적용되어 ${region} 자영업자의 수수료 부담을 최소화합니다.</p>

<h3>24시간 A/S 신속 지원</h3>
<p>${sido.short} 전역에 A/S 거점을 확보해 ${sigungu.name} 매장에서 단말기 오류 발생 시 신속히 대응합니다. 영업 중 결제가 끊기지 않도록 빠르게 조치해 매출 손실을 막아드립니다.</p>

<h2>${region} 매장에 맞는 카드단말기 추천</h2>
<p>${tip1} ${tip2} ${tip3}</p>

<p>${sigungu.name}에는 다양한 업종의 매장이 운영되고 있으며, 각 업종에 맞는 단말기 선택이 매출에 직접 영향을 줍니다. 더세이브스토어는 매장 위치, 업종, 결제 빈도를 종합적으로 고려해 가장 적합한 단말기를 추천해 드립니다. 카페, 음식점, 편의점, 미용실, 학원, 의료기관, 도매상가 등 어떤 업종이든 매장 환경에 맞춘 솔루션을 안내해 드립니다.</p>

<h3>유선 카드단말기</h3>
<p>편의점, 약국, 작은 식당 등 고정 카운터 운영 매장에 적합합니다. 안정적인 통신과 빠른 처리 속도가 장점이며, 통신 장애에 강합니다.</p>

<h3>무선 카드단말기</h3>
<p>이동이 잦은 매장에 적합합니다. 와이파이 또는 LTE로 어디서든 결제가 가능해 카페, 푸드트럭, 야외 매장에서 인기가 높습니다.</p>

<h3>포스(POS)형 단말기</h3>
<p>음식점, 미용실, 학원 등 결제와 매출 관리를 동시에 해야 하는 매장에 추천합니다.</p>

<h3>모바일 결제 단말기</h3>
<p>배달 매장, 출장 서비스, 행사장 등 휴대성이 중요한 곳에 적합합니다.</p>

<h2>${region} 카드단말기 설치 절차</h2>
<ol>
  <li>상담 신청 - 홈페이지 또는 전화 문의</li>
  <li>매장 환경 확인 및 단말기 추천</li>
  <li>사업자등록증·신분증·통장사본 등 서류 제출</li>
  <li>가맹점 등록 대행</li>
  <li>${sigungu.name} 매장 방문 설치 (무료)</li>
  <li>사용법 안내 및 결제 시작</li>
</ol>
<p>설치 당일에는 단말기 작동법부터 영수증 출력, 매출 마감, 정산 확인, 오류 대처법까지 모두 안내해 드립니다.</p>

<h2>${region} 카드단말기 수수료</h2>
<p>${region} 자영업자에게 가장 중요한 수수료는 영세·중소 가맹점 우대수수료가 자동 적용됩니다. 단말기 설치비는 무료이며, 별도의 월 임대료 부담 없이 합리적인 조건으로 이용하실 수 있습니다. 매출 변동에 따라 우대 수수료율이 자동 조정되므로 별도 신청이 필요 없습니다.</p>

<h2>자주 묻는 질문</h2>
<h3>Q. ${sigungu.name} 어디든 설치 가능한가요?</h3>
<p>${sigungu.name} 전 지역(${dongCount}개 동) 어디든 설치 가능합니다.</p>

<h3>Q. 설치까지 얼마나 걸리나요?</h3>
<p>최단 당일, 평균 1~2일 이내 설치가 완료됩니다.</p>

<h3>Q. 영업 중 고장 나면 어떻게 하나요?</h3>
<p>${sido.short} 전담 A/S 기사가 신속히 출동해 조치합니다.</p>

<h3>Q. 어떤 결제 수단을 지원하나요?</h3>
<p>신용카드, 체크카드, 삼성페이, 애플페이, 카카오페이, 제로페이 등 모든 주요 결제를 지원합니다.</p>

<h2>지금 바로 무료 상담을 신청하세요</h2>
<p>${region}에서 카드단말기 설치를 고민하고 있다면 더세이브스토어가 가장 합리적인 선택입니다. ${cta}</p>

<div class="cta"><a href="/contact">${region} 카드단말기 무료 상담 신청</a></div>

${dongCount > 0 ? `<h2>${sigungu.name} 동별 페이지</h2>
<ul class="region-list">
${DONG.filter(d => d.sido === sigungu.sido && d.sigungu === sigungu.slug).slice(0, 100).map(d => `  <li><a href="/region/${sigungu.sido}/${sigungu.slug}/${d.slug}">${d.name}</a></li>`).join('\n')}
</ul>` : ''}
`,
  });
}

function buildDongPage(dong) {
  const sido = SIDO_INDEX[dong.sido];
  const sigungu = SIGUNGU_INDEX[`${dong.sido}/${dong.sigungu}`];
  const url = `${BASE_URL}/region/${dong.sido}/${dong.sigungu}/${dong.slug}`;
  const seed = hash(url);
  const intro = pick(INTRO_OPENINGS, seed)(`${sigungu.name} ${dong.name}`);
  const cta = pick(CTA_LINES, seed + 2);
  const tip1 = pick(TERMINAL_TIPS, seed + 3);
  
  const fullName = `${sido.name} ${sigungu.name} ${dong.name}`;
  const region = `${sigungu.name} ${dong.name}`;
  
  return wrapHtml({
    title: `${region} 카드단말기 설치 | 더세이브스토어`,
    description: `${fullName} 카드단말기 무료 설치. 당일 설치 가능, 합리적 수수료. 더세이브스토어.`,
    canonical: url,
    breadcrumb: [
      {name:'홈',url:'/'},{name:'지역별',url:'/region'},
      {name:sido.short,url:`/region/${sido.slug}`},
      {name:sigungu.name,url:`/region/${sido.slug}/${sigungu.slug}`},
      {name:dong.name}
    ],
    bodyHtml: `
<h1>${region} 카드단말기 무료 설치</h1>

<p class="lead">${fullName} 카드단말기 설치 전문, 더세이브스토어. ${dong.name} 매장 어디든 당일 출장 설치 가능.</p>

<h2>${region} 카드단말기 설치 안내</h2>
<p>${intro} ${dong.name}은 ${sigungu.name}에 속한 지역으로, 다양한 자영업자가 매장을 운영하고 있습니다. 카드 결제 비중이 90%를 넘는 지금, 안정적인 단말기는 매출과 직결되는 핵심 인프라입니다. 더세이브스토어는 ${dong.name} 매장에 무료 출장 설치 서비스를 제공합니다.</p>

<p>${region}에서 카드단말기를 설치하려면 매장 환경에 맞는 단말기 선택이 가장 중요합니다. ${tip1} 더세이브스토어는 ${dong.name} 매장 위치와 업종을 고려해 가장 적합한 단말기를 추천해 드립니다.</p>

<h2>${region} 카드단말기 설치 4가지 강점</h2>
<ul>
  <li><strong>무료 설치</strong>: ${dong.name} 어디든 설치비 무료</li>
  <li><strong>빠른 설치</strong>: 최단 당일, 평균 1~2일 이내 완료</li>
  <li><strong>합리적 수수료</strong>: 영세·중소 가맹점 우대수수료 자동 적용</li>
  <li><strong>24시간 A/S</strong>: ${sido.short} 전담 기사 신속 출동</li>
</ul>

<h2>${region} 매장에 맞는 단말기 종류</h2>
<p>유선 단말기는 ${dong.name}의 편의점·약국·작은 식당에 적합하고, 무선 단말기는 카페·음식점에 좋습니다. 포스형 단말기는 메뉴·재고 관리까지 통합 처리하며, 모바일 단말기는 배달·출장 매장에 추천드립니다.</p>

<p>${dong.name}에서 매장을 운영하시는 자영업자분들 중 단말기 교체를 고민하고 계신다면, 결제 속도, 결제 수단 지원, A/S 신속성을 점검해 보시기 바랍니다. 세 가지 중 하나라도 부족하다면 매출에 영향을 주고 있을 가능성이 높습니다. 더세이브스토어는 이 모든 조건을 충족하는 단말기를 ${region}에 무료로 설치해 드립니다.</p>

<h2>${region} 설치 절차</h2>
<ol>
  <li>홈페이지 또는 전화로 무료 상담 신청</li>
  <li>${dong.name} 매장 환경 확인 및 단말기 추천</li>
  <li>사업자등록증·신분증·통장사본 제출</li>
  <li>카드사 가맹점 등록 대행</li>
  <li>${dong.name} 매장 방문 설치(무료)</li>
  <li>사용법 안내 및 결제 시작</li>
</ol>

<h2>${region} 카드단말기 FAQ</h2>
<h3>Q. ${dong.name}도 무료 설치 가능한가요?</h3>
<p>네, ${region}은 무료 설치 대상 지역입니다. 추가 비용 없이 진행됩니다.</p>

<h3>Q. 설치까지 얼마나 걸리나요?</h3>
<p>${dong.name} 지역은 신청 후 최단 당일, 평균 1~2일 이내 설치가 완료됩니다.</p>

<h3>Q. 어떤 결제 수단을 지원하나요?</h3>
<p>신용카드·체크카드는 물론 삼성페이·애플페이·카카오페이·제로페이까지 모든 주요 결제 수단을 지원합니다.</p>

<h2>지금 바로 무료 상담</h2>
<p>${region}에서 카드단말기 설치를 고민 중이시라면 더세이브스토어로 문의해 주세요. ${cta}</p>

<div class="cta"><a href="/contact">${region} 카드단말기 무료 상담 신청</a></div>

<p><a href="/region/${sido.slug}/${sigungu.slug}">← ${sigungu.name} 전체 보기</a></p>
`,
  });
}

// ==================== HTML 래퍼 ====================
function wrapHtml({ title, description, canonical, breadcrumb, bodyHtml }) {
  const breadcrumbHtml = breadcrumb.map((b, i) => {
    if (i === breadcrumb.length - 1) return `<span>${escapeHtml(b.name)}</span>`;
    return `<a href="${b.url}">${escapeHtml(b.name)}</a>`;
  }).join(' &gt; ');
  
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:locale" content="ko_KR">
<meta property="og:site_name" content="더세이브스토어">
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Pretendard', 'Apple SD Gothic Neo', sans-serif; max-width: 800px; margin: 0 auto; padding: 24px; line-height: 1.7; color: #222; }
  h1 { font-size: 28px; margin-top: 8px; }
  h2 { font-size: 22px; margin-top: 36px; padding-bottom: 8px; border-bottom: 2px solid #eee; }
  h3 { font-size: 18px; margin-top: 24px; }
  p { margin: 12px 0; }
  ul, ol { padding-left: 22px; }
  li { margin: 6px 0; }
  a { color: #0066ff; text-decoration: none; }
  a:hover { text-decoration: underline; }
  .lead { font-size: 17px; color: #444; }
  .cta { background: #f5f7fa; padding: 20px; border-radius: 8px; margin: 32px 0; text-align: center; }
  .cta a { display: inline-block; background: #0066ff; color: #fff; padding: 12px 28px; border-radius: 6px; font-weight: 600; }
  .cta a:hover { text-decoration: none; background: #0052cc; }
  nav.breadcrumb { font-size: 14px; color: #666; margin-bottom: 16px; }
  .region-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; padding-left: 0; list-style: none; }
  .region-list li { margin: 0; }
  .region-list a { display: block; padding: 8px 12px; background: #f5f7fa; border-radius: 6px; }
</style>
</head>
<body>
<nav class="breadcrumb" aria-label="breadcrumb">${breadcrumbHtml}</nav>
<article>${bodyHtml}</article>
</body>
</html>`;
}

// ==================== 사이트맵 ====================
function buildSitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [];
  urls.push({ loc: BASE_URL + '/', priority: '1.0', freq: 'weekly' });
  for (const s of SIDO) urls.push({ loc: `${BASE_URL}/region/${s.slug}`, priority: '0.9', freq: 'weekly' });
  for (const s of SIGUNGU) urls.push({ loc: `${BASE_URL}/region/${s.sido}/${s.slug}`, priority: '0.7', freq: 'monthly' });
  for (const d of DONG) urls.push({ loc: `${BASE_URL}/region/${d.sido}/${d.sigungu}/${d.slug}`, priority: '0.5', freq: 'monthly' });
  
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map(u => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${u.freq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`).join('\n') +
    '\n</urlset>';
  return xml;
}

// ==================== 홈페이지 ====================
function buildHomePage() {
  return wrapHtml({
    title: '더세이브스토어 - 카드단말기 전국 무료 설치',
    description: '전국 카드단말기 무료 설치 더세이브스토어. 17개 시도, 264개 시군구, 5066개 법정동 어디든 설치 가능. 합리적 수수료, 24시간 A/S.',
    canonical: BASE_URL + '/',
    breadcrumb: [{name:'홈'}],
    bodyHtml: `
<h1>더세이브스토어 카드단말기 전국 무료 설치</h1>
<p class="lead">전국 어느 지역이든 카드단말기를 무료로 설치해 드립니다. 시도, 시군구, 법정동 단위로 지역별 안내를 확인하실 수 있습니다.</p>

<h2>지역별 안내</h2>
<ul class="region-list">
${SIDO.map(s => `  <li><a href="/region/${s.slug}">${s.name}</a></li>`).join('\n')}
</ul>

<div class="cta"><a href="/contact">전국 카드단말기 무료 상담 신청</a></div>
`,
  });
}

// ==================== 메인 핸들러 ====================
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '') || '/';
    
    // robots.txt
    if (path === '/robots.txt') {
      return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${BASE_URL}/sitemap.xml\n`, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
    
    // sitemap.xml
    if (path === '/sitemap.xml') {
      return new Response(buildSitemap(), {
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
      });
    }
    
    // 홈
    if (path === '/') {
      return new Response(buildHomePage(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }
    
    // /region/:sido/:sigungu/:dong
    const m = path.match(/^\/region\/([^/]+)(?:\/([^/]+))?(?:\/([^/]+))?$/);
    if (m) {
      const [, sidoSlug, sigunguSlug, dongSlug] = m;
      
      if (dongSlug) {
        const dong = DONG_INDEX[`${sidoSlug}/${sigunguSlug}/${dongSlug}`];
        if (dong) {
          return new Response(buildDongPage(dong), {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          });
        }
      } else if (sigunguSlug) {
        const sigungu = SIGUNGU_INDEX[`${sidoSlug}/${sigunguSlug}`];
        if (sigungu) {
          return new Response(buildSigunguPage(sigungu), {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          });
        }
      } else {
        const sido = SIDO_INDEX[sidoSlug];
        if (sido) {
          return new Response(buildSidoPage(sido), {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          });
        }
      }
    }
    
    // /region (목록)
    if (path === '/region') {
      return new Response(buildHomePage(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }
    
    return new Response('Not Found', { status: 404 });
  },
};
