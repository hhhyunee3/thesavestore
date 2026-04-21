/**
 * 카피 뱅크 - 페이지마다 다른 문구로 렌더링하기 위한 템플릿 풀
 *
 * {location}, {product}, {industry} 등의 변수가 런타임에 치환됨.
 */

// ========================================
// 히어로 헤드라인 변형 (20종)
// ========================================
export const heroHeadlines_dong: string[] = [
  '{location} 매장,\n설비 한번에.',
  '{location}의 사장님,\n장비 걱정 없이.',
  '{location}에서 장사 시작하셨다면.',
  '{location} 전용\n출장 설치.',
  '{location} 사장님 전담팀.',
  '{location} 매장도\n당일 설치.',
  '{location}까지 30분.\n바로 설치.',
  '{location} 창업 준비,\n설비부터 챙기세요.',
  '{location} 동네 장사,\n우리가 돕습니다.',
  '{location} 상권에 맞춘\n최적 장비 구성.',
  '{location},\n찾아가는 설치팀.',
  '{location}에 딱 맞는\n장비 한 세트.',
  '{location} 자영업자를 위한\n올인원 솔루션.',
  '{location}에서도\n프리미엄 장비.',
  '{location} 매장 오픈\n이제 시작하세요.',
  '{location} 영업 시작,\n오늘부터 가능.',
  '{location} 사장님들의\n선택을 받습니다.',
  '{location} 거리\n가장 빠른 설치팀.',
  '{location} 1호점,\n저희가 맡겠습니다.',
  '{location}의 매장 개업,\n전문가와 함께.',
]

export const heroHeadlines_district: string[] = [
  '{location}\n전지역 출장.',
  '{location} 전문\n설치 서비스.',
  '{location} 사장님을 위한\n원스톱 솔루션.',
  '{location} 매장,\n설비 파트너.',
  '{location} 전담\n매니저팀 운영.',
  '{location}의\n설비 파트너.',
  '{location} 곳곳,\n당일 방문 가능.',
  '{location} 상권 전체\n커버.',
  '{location} 1호점부터\n프랜차이즈까지.',
  '{location} 전 동 출장\n설치 완료.',
]

// ========================================
// 서브카피 변형
// ========================================
export const heroSubcopy_dong: string[] = [
  '{location} 지역 매장을 위한 카드단말기 · 포스기 · 키오스크 출장 설치. 전화 한 통이면 당일에도 설치 가능합니다.',
  '{location}에서 장사를 시작하셨다면, 복잡한 장비 세팅은 저희에게. 전문 매니저가 직접 방문해 세팅까지 끝냅니다.',
  '{location} 상권 특성을 알고 있는 매니저가 매장 규모에 맞춰 최적 구성을 제안합니다.',
  '{location}의 사장님들이 선택한 설치 파트너. 카드단말기부터 키오스크까지 한번에.',
  '{location}까지 가장 빠른 출장 설치. 당일·익일 현장 방문이 원칙입니다.',
  '{location}에서도 장비 걱정 없이 영업을 시작하세요. 수수료·세팅·A/S 모두 포함.',
]

export const heroSubcopy_district: string[] = [
  '{location} 전 읍면동을 커버하는 출장 설치팀. 어디든 당일·익일 방문합니다.',
  '{location}의 수많은 매장에 설치한 경험을 바탕으로, 지역 상권에 맞는 구성을 제안합니다.',
  '{location} 전담 매니저가 상주해 빠른 A/S가 가능합니다. 장애 시 24시간 내 대응.',
  '{location}에서 활동하는 매장 사장님들이 가장 많이 선택한 설치 파트너.',
]

// ========================================
// 지역 인사이트 섹션 라벨 변형
// ========================================
export const insightLabels: string[] = [
  'LOCAL INSIGHT',
  'AREA NOTES',
  'DISTRICT BRIEF',
  'NEIGHBORHOOD GUIDE',
  'MARKET PULSE',
  'STORE TRENDS',
]

// ========================================
// FAQ 질문 풀 (지역 + 제품별 변형)
// ========================================
export interface FaqItem {
  q: string
  a: string
}

export const faqPool: FaqItem[] = [
  {
    q: '{location}까지 당일 설치가 가능한가요?',
    a: '네, 오전 중 상담 완료 시 당일 오후 설치가 가능합니다. {location} 지역은 전담 매니저가 상주하여 가장 빠른 대응을 보장합니다.',
  },
  {
    q: '{location} 매장 규모가 작아도 설치 가능한가요?',
    a: '1평 이하 소형 매장부터 설치해왔습니다. 공간에 맞춘 미니 키오스크·소형 POS 옵션도 준비되어 있어요.',
  },
  {
    q: '{location}에서 기존 단말기 교체하면 수수료는?',
    a: 'VAN사 수수료를 비교하여 가장 유리한 조건으로 안내드립니다. 대부분 기존 대비 연 30~60만원 절약 가능합니다.',
  },
  {
    q: '{location} 사업장에 24시간 A/S가 되나요?',
    a: '원격 지원은 24시간, 현장 재방문은 영업시간 내 24시간 내 보장합니다. {location} 지역은 매니저 상주로 더 빠른 편입니다.',
  },
  {
    q: '{location} 지역에 설치 실적이 얼마나 되나요?',
    a: '최근 3개월간 {installCount}건 이상 설치 진행했습니다. 지역 상권 특성을 잘 아는 매니저가 담당합니다.',
  },
  {
    q: '{location} 매장에 키오스크만 설치 가능한가요?',
    a: '필요한 장비만 선택해 설치 가능합니다. 카드단말기·포스기·키오스크 중 1개만 설치해도 무방합니다.',
  },
  {
    q: '{location}에서 카드단말기만 빌리는 것도 되나요?',
    a: '네, 렌탈과 구매 모두 가능합니다. 초기 비용 부담을 줄이려면 렌탈을 추천드립니다.',
  },
  {
    q: '{location} 배달 앱과 연동 설정도 해주나요?',
    a: '배민·쿠팡이츠·요기요 등 주요 배달 앱 연동까지 설치 당일 완료해드립니다.',
  },
  {
    q: '{location}에 영업 중인 매장도 교체 가능한가요?',
    a: '영업에 지장 없도록 심야·새벽 시간 설치도 가능합니다. {location} 지역은 유연한 일정 조율이 가능합니다.',
  },
  {
    q: '{location} 프랜차이즈 본사 장비도 호환되나요?',
    a: '주요 프랜차이즈 본사 시스템과 연동 작업 경험이 있습니다. 본사 승인 후 설치 진행합니다.',
  },
]

// ========================================
// 설치 히스토리 로그 (가상) 템플릿
// ========================================
export const installRecordTemplates: Array<{
  days: number
  industry: string
  product: string
  outcome: string
}> = [
  { days: 3, industry: '카페', product: '키오스크', outcome: '주문 대기 시간 40% 단축' },
  { days: 5, industry: '식당', product: '포스기', outcome: '배달 통합 관리 시스템 구축' },
  { days: 7, industry: '미용실', product: '카드단말기', outcome: '예약·결제 통합 완료' },
  { days: 8, industry: '분식집', product: '키오스크', outcome: '홀 인건비 40% 절감' },
  { days: 10, industry: '베이커리', product: '포스기', outcome: '재고 관리 자동화' },
  { days: 12, industry: '치킨집', product: '포스기', outcome: '배달 앱 3사 통합' },
  { days: 14, industry: '카페', product: '카드단말기', outcome: 'VAN 수수료 연 48만원 절약' },
  { days: 15, industry: '학원', product: '포스기', outcome: '수강료 자동 관리' },
  { days: 17, industry: '피트니스', product: '키오스크', outcome: '회원권 무인 판매' },
  { days: 20, industry: '식당', product: '키오스크', outcome: '피크 타임 회전율 30% 개선' },
  { days: 22, industry: '분식집', product: '카드단말기', outcome: '무선 단말기로 테이블 결제' },
  { days: 25, industry: '카페', product: '포스기', outcome: '매출 리포트 자동화' },
]

// ========================================
// 시즌/상황별 팁 (지역에 따라 다르게)
// ========================================
export const seasonalTips: string[] = [
  '개업 직전 최대 2주 전에 설치 상담을 시작하면 세팅과 테스트까지 충분히 여유를 가질 수 있습니다.',
  '신규 오픈 매장은 카드단말기·POS를 먼저 설치하고, 키오스크는 운영 1~2주 후 추가하는 것을 추천합니다.',
  '프랜차이즈 가맹점이라면 본사 지정 장비 여부를 먼저 확인하세요. 독립 운영 매장은 VAN사 비교로 수수료 절약이 가능합니다.',
  '피크 타임 회전율이 중요한 매장이라면 자동커팅 단말기와 키오스크 조합이 효과적입니다.',
  '배달 매장은 POS에 배민·쿠팡이츠·요기요 통합 설정을 꼭 포함하세요. 주문 누락 위험이 크게 줄어듭니다.',
  '24시간 운영 매장은 무인결제·CCTV·원격 모니터링을 묶어서 설치하면 효율이 극대화됩니다.',
  '1인 운영 매장은 포스 없이 키오스크 + 카드단말기 조합으로도 충분히 운영 가능합니다.',
  '임대 만료 시기가 가까운 매장은 렌탈 방식을 선택해 초기 비용 부담을 줄이는 것이 합리적입니다.',
]

// ========================================
// 섹션 제목 변형
// ========================================
export const productSectionTitles: Array<{ label: string; title: string; emph: string }> = [
  { label: 'CORE PRODUCTS', title: '결제부터 주문까지', emph: '세 가지 핵심 장비.' },
  { label: 'ESSENTIALS', title: '매장에 꼭 필요한', emph: '세 가지 설비.' },
  { label: 'OUR LINEUP', title: '검증된', emph: '3종 장비 라인업.' },
  { label: 'SETUP PACKAGE', title: '한 번에 끝내는', emph: '3종 설치 패키지.' },
  { label: 'KEY DEVICES', title: '매출을 바꾸는', emph: '세 가지 장비.' },
]
