import type { Product, ProductSlug } from '../types'

export const products: Product[] = [
  {
    slug: '카드단말기',
    name: '카드단말기',
    nameEn: 'Card Terminal',
    icon: '💳',
    tagline: '유선·무선·블루투스까지',
    description:
      '유선·무선·블루투스·자동커팅까지. VAN사 수수료를 비교해 가장 유리한 조건으로 설치합니다.',
    metaCount: '4가지 모델',
    features: [
      '유선 단말기 (안정적 카운터 결제)',
      '무선 단말기 (이동·테이블 결제)',
      '블루투스 단말기 (스마트폰 연동)',
      '자동커팅 단말기 (영수증 자동)',
    ],
    useCases: [
      'VAN사 수수료 비교 · 연 수십만원 절약',
      '기존 단말기 교체 시 무상 이관',
      '피크 타임 회전율 개선',
    ],
  },
  {
    slug: '포스기',
    name: '포스기',
    nameEn: 'POS System',
    icon: '🖥️',
    tagline: '매출·재고·세무 통합',
    description:
      '주문·결제·매출·재고를 하나의 화면에서. 세무사에게 바로 넘길 수 있는 자동 리포트까지.',
    metaCount: '3가지 타입',
    features: [
      '일반형 POS (식당·카페)',
      '배달 연동 POS (배민·쿠팡이츠)',
      '프랜차이즈형 POS (다점포 관리)',
    ],
    useCases: [
      '요일별·시간대별 매출 자동 분석',
      '재고 부족 알림',
      '세무사 이관용 자동 리포트',
    ],
  },
  {
    slug: '키오스크',
    name: '키오스크',
    nameEn: 'Kiosk',
    icon: '🤖',
    tagline: '무인 주문·결제',
    description:
      '무인 주문·결제로 홀 인건비 월 200만원 절감. 소형 매장부터 대형 프랜차이즈까지.',
    metaCount: '5가지 사이즈',
    featured: true,
    features: [
      '미니 키오스크 (분식집·작은 카페)',
      '스탠딩 키오스크 (중형 매장)',
      '벽걸이 키오스크 (좁은 공간)',
      '대형 키오스크 (프랜차이즈)',
      '이중화면 키오스크 (광고 병행)',
    ],
    useCases: [
      '홀 인건비 월 200만원 이상 절감',
      '피크 타임 주문 대기 시간 단축',
      '24시간 무인 매장 전환',
    ],
  },
]

export function findProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug)
}

export function getProductSlugs(): ProductSlug[] {
  return products.map((p) => p.slug)
}
