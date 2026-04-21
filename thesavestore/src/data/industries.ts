import type { Industry, IndustrySlug } from '../types'

export const industries: Industry[] = [
  {
    slug: '식당',
    name: '식당·음식점',
    icon: '🍚',
    meta: 'POS · 단말기 · 오더',
    recommendedProducts: ['포스기', '카드단말기'],
    description: '바쁜 식당 운영에 최적화된 통합 패키지.',
    commonIssues: ['피크 타임 결제 대기', '주문 실수', '재고 관리'],
  },
  {
    slug: '카페',
    name: '카페',
    icon: '☕',
    meta: '키오스크 · POS · 벨',
    recommendedProducts: ['키오스크', '포스기'],
    description: '소형·개인 카페부터 프랜차이즈까지.',
    commonIssues: ['피크 타임 줄서기', '홀 인건비', '주문 실수'],
  },
  {
    slug: '미용실',
    name: '미용실',
    icon: '✂️',
    meta: '예약 POS · 단말기',
    recommendedProducts: ['포스기', '카드단말기'],
    description: '예약·멤버십·시술 관리를 한번에.',
    commonIssues: ['예약 관리', '회원권 추적', '수납 혼선'],
  },
  {
    slug: '분식집',
    name: '분식집',
    icon: '🍢',
    meta: '키오스크 · 미니 POS',
    recommendedProducts: ['키오스크', '카드단말기'],
    description: '좁은 공간에도 들어가는 미니 구성.',
    commonIssues: ['공간 제약', '1인 운영', '회전율'],
  },
  {
    slug: '치킨집',
    name: '치킨집',
    icon: '🍗',
    meta: '배달 POS · 프린터',
    recommendedProducts: ['포스기', '카드단말기'],
    description: '배달 앱 통합 + 주방 프린터 연동.',
    commonIssues: ['배달 앱 3사 통합', '주방 전달', '매출 합산'],
  },
  {
    slug: '베이커리',
    name: '베이커리',
    icon: '🥐',
    meta: '재고 POS · 라벨',
    recommendedProducts: ['포스기', '카드단말기'],
    description: '신선 재고 관리 + 라벨 프린터.',
    commonIssues: ['유통기한 관리', '폐기율', '원가 관리'],
  },
  {
    slug: '피트니스',
    name: '피트니스',
    icon: '💪',
    meta: '회원권 · 출입',
    recommendedProducts: ['포스기', '키오스크'],
    description: '회원권·출입·PT 스케줄 통합.',
    commonIssues: ['회원권 관리', '출입 통제', 'PT 예약'],
  },
  {
    slug: '학원',
    name: '학원',
    icon: '📚',
    meta: '수강료 · 출결',
    recommendedProducts: ['포스기', '키오스크'],
    description: '수강료·출결·학부모 알림 연동.',
    commonIssues: ['수강료 수납', '출결 관리', '학부모 커뮤니케이션'],
  },
]

export function findIndustry(slug: string): Industry | undefined {
  return industries.find((i) => i.slug === slug)
}

export function getIndustrySlugs(): IndustrySlug[] {
  return industries.map((i) => i.slug)
}
