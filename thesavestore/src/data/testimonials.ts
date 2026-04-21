import type { Testimonial } from '../types'
import { pickMany } from '../utils/variance'

// 15개 후기 풀 - 지역/업종 다양화
export const testimonialPool: Testimonial[] = [
  {
    tag: '매출 40% ↑',
    stars: 5,
    text: '카드단말기 교체 후\n카드매출이 급증했어요',
    body:
      'VAN사 수수료까지 비교해주셔서 연간 60만원 절약. 단말기 속도도 빨라져서 피크 타임 회전율이 눈에 띄게 좋아졌습니다.',
    authorName: '강남구 카페 사장님',
    authorRegion: '서울',
    regionEn: 'SEOUL',
  },
  {
    tag: '인건비 50% ↓',
    stars: 5,
    text: '키오스크 설치 후\n홀 인건비가 반으로',
    body:
      '테이블오더 + 키오스크 조합으로 홀 직원 2명에서 1명으로. 서비스 품질은 그대로인데 마진이 확 개선됐습니다.',
    authorName: '수원시 음식점 사장님',
    authorRegion: '경기',
    regionEn: 'GYEONGGI',
  },
  {
    tag: '무인화 성공',
    stars: 5,
    text: '24시간 무인매장\n전환이 가능했습니다',
    body:
      'CCTV + 무인결제 + 원격 모니터링까지 한번에. 새벽 시간 매출이 전체의 30%를 차지할 정도로 효과가 컸습니다.',
    authorName: '연수구 스터디카페 사장님',
    authorRegion: '인천',
    regionEn: 'INCHEON',
  },
  {
    tag: '당일 설치',
    stars: 5,
    text: '전화 한 통에\n오후 바로 설치',
    body:
      '오픈 전날 단말기 문제 생겼는데 바로 출동해주셨습니다. 덕분에 오픈일 영업 차질 없었어요.',
    authorName: '마포구 베이커리 사장님',
    authorRegion: '서울',
    regionEn: 'SEOUL',
  },
  {
    tag: '수수료 절감',
    stars: 5,
    text: 'VAN사 비교 후\n연 48만원 절약',
    body:
      '기존에 쓰던 단말기 수수료가 비싸다는 걸 이번 견적 비교로 알았어요. 교체만 했는데 월 4만원씩 절약됩니다.',
    authorName: '성남시 음식점 사장님',
    authorRegion: '경기',
    regionEn: 'GYEONGGI',
  },
  {
    tag: '재고 자동화',
    stars: 5,
    text: '빵 재고 관리\n자동으로 됩니다',
    body:
      '판매되는 즉시 재고 차감되고, 부족한 품목 알림까지 와요. 폐기율도 20% 줄었습니다.',
    authorName: '고양시 베이커리 사장님',
    authorRegion: '경기',
    regionEn: 'GYEONGGI',
  },
  {
    tag: '배달 통합',
    stars: 5,
    text: '배달앱 3사\n주문이 한 화면에',
    body:
      '배민·쿠팡이츠·요기요를 따로 확인하던 걸 하나로 통합. 주문 누락 0건이 됐습니다.',
    authorName: '은평구 치킨집 사장님',
    authorRegion: '서울',
    regionEn: 'SEOUL',
  },
  {
    tag: '예약 관리',
    stars: 5,
    text: '예약과 결제가\n한번에 끝납니다',
    body:
      '예약 손님 받고 결제까지 POS 하나로 해결. 예약 장부 손으로 관리하던 시절은 끝났어요.',
    authorName: '용인시 미용실 사장님',
    authorRegion: '경기',
    regionEn: 'GYEONGGI',
  },
  {
    tag: '피크 타임',
    stars: 5,
    text: '점심 회전율\n눈에 띄게 개선',
    body:
      '키오스크 2대 설치 후 점심 피크 대기줄이 없어졌어요. 객단가도 오히려 더 올랐습니다.',
    authorName: '서초구 분식집 사장님',
    authorRegion: '서울',
    regionEn: 'SEOUL',
  },
  {
    tag: '세무 편의',
    stars: 5,
    text: '세무사한테\n엑셀 한 장이면 끝',
    body:
      '월별 매출 리포트 자동 생성되니까 세무사에게 그대로 넘겨줍니다. 비용 처리가 훨씬 편해졌어요.',
    authorName: '송파구 카페 사장님',
    authorRegion: '서울',
    regionEn: 'SEOUL',
  },
  {
    tag: '회원권 관리',
    stars: 5,
    text: 'PT 회원권이\n한 화면에 정리',
    body:
      '회원별 잔여 세션, 결제 이력이 한 눈에 보여요. 장부 헷갈릴 일이 없어졌습니다.',
    authorName: '부천시 피트니스 사장님',
    authorRegion: '경기',
    regionEn: 'GYEONGGI',
  },
  {
    tag: '원격 지원',
    stars: 5,
    text: '장애 발생해도\n10분 만에 해결',
    body:
      '저녁 영업 중 포스가 멈췄는데 전화 한 통에 원격 지원. 10분 만에 다시 영업 재개했습니다.',
    authorName: '남동구 음식점 사장님',
    authorRegion: '인천',
    regionEn: 'INCHEON',
  },
  {
    tag: '수강료 관리',
    stars: 5,
    text: '학원 수강료\n미납 0건 달성',
    body:
      '수강료 자동 정산과 미납 알림 기능으로 수강료 미납률이 0%가 됐습니다.',
    authorName: '노원구 학원 사장님',
    authorRegion: '서울',
    regionEn: 'SEOUL',
  },
  {
    tag: '공간 절약',
    stars: 5,
    text: '1평 매장에도\n딱 맞는 크기',
    body:
      '가게가 워낙 좁아서 걱정했는데 미니 키오스크가 딱 맞아요. 추가 공간 필요 없이 설치 완료.',
    authorName: '관악구 분식집 사장님',
    authorRegion: '서울',
    regionEn: 'SEOUL',
  },
  {
    tag: '신속 A/S',
    stars: 5,
    text: '24시간 내\n재방문 원칙',
    body:
      '키오스크에 문제 생겨서 연락드렸는데 다음 날 오전에 바로 오셔서 교체까지 해주셨어요.',
    authorName: '안양시 음식점 사장님',
    authorRegion: '경기',
    regionEn: 'GYEONGGI',
  },
]

/** 시드(URL 기반)로 3개 리뷰 선택 - 페이지마다 다른 조합 */
export function selectTestimonials(seed: string, count = 3): Testimonial[] {
  const picked = pickMany(testimonialPool, count, seed)
  // 2번째 위치를 featured로 (디자인상 반전 카드)
  return picked.map((t, idx) => ({ ...t, featured: idx === 1 }))
}

// 기존 호환용 (홈 페이지에서 사용)
export const testimonials: Testimonial[] = [
  { ...testimonialPool[0]!, featured: false },
  { ...testimonialPool[1]!, featured: true },
  { ...testimonialPool[2]!, featured: false },
]
