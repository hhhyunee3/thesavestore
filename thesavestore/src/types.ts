// 제품
export type ProductSlug = '카드단말기' | '포스기' | '키오스크'

export interface Product {
  slug: ProductSlug
  name: string
  nameEn: string
  icon: string
  tagline: string
  description: string
  metaCount: string
  featured?: boolean
  // 상세 페이지용 추가 필드
  features?: string[]
  useCases?: string[]
}

// 업종
export type IndustrySlug =
  | '식당'
  | '카페'
  | '미용실'
  | '분식집'
  | '치킨집'
  | '베이커리'
  | '피트니스'
  | '학원'

export interface Industry {
  slug: IndustrySlug
  name: string
  icon: string
  meta: string
  recommendedProducts: ProductSlug[]
  // 상세 페이지용
  description?: string
  commonIssues?: string[]
}

// 지역 - 3레벨 트리
export type RegionCode = 'seoul' | 'gyeonggi' | 'incheon'

export interface Region {
  code: RegionCode
  nameKo: string        // 서울특별시
  nameKoShort: string   // 서울
  nameEn: string        // Seoul
  districts: District[]
  districtCount: number
  dongCount: number
}

export interface District {
  slug: string          // 강남구
  name: string          // 강남구
  nameEn?: string
  dongs: Dong[]
}

export interface Dong {
  slug: string          // 역삼동
  name: string          // 역삼동
}

// 후기
export interface Testimonial {
  tag: string
  stars: number
  text: string
  body: string
  authorName: string
  authorRegion: string
  regionEn: string
  featured?: boolean
}

// SEO 메타
export interface PageMeta {
  title: string
  description: string
  canonical?: string
  ogImage?: string
}
