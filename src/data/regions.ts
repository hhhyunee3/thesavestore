import type { Region, District, Dong, RegionCode } from '../types'

// ========================================
// 서울특별시 (25개 자치구)
// ========================================
// 읍면동은 각 자치구당 대표 3~5개만 포함. 실제 운영 시 확장 필요.
const seoulDistricts: District[] = [
  { slug: '강남구', name: '강남구', nameEn: 'Gangnam', dongs: [
    { slug: '역삼동', name: '역삼동' },
    { slug: '삼성동', name: '삼성동' },
    { slug: '논현동', name: '논현동' },
    { slug: '청담동', name: '청담동' },
    { slug: '압구정동', name: '압구정동' },
  ]},
  { slug: '강동구', name: '강동구', nameEn: 'Gangdong', dongs: [
    { slug: '천호동', name: '천호동' },
    { slug: '암사동', name: '암사동' },
    { slug: '명일동', name: '명일동' },
  ]},
  { slug: '강북구', name: '강북구', nameEn: 'Gangbuk', dongs: [
    { slug: '미아동', name: '미아동' },
    { slug: '수유동', name: '수유동' },
  ]},
  { slug: '강서구', name: '강서구', nameEn: 'Gangseo', dongs: [
    { slug: '화곡동', name: '화곡동' },
    { slug: '발산동', name: '발산동' },
    { slug: '마곡동', name: '마곡동' },
  ]},
  { slug: '관악구', name: '관악구', nameEn: 'Gwanak', dongs: [
    { slug: '신림동', name: '신림동' },
    { slug: '봉천동', name: '봉천동' },
  ]},
  { slug: '광진구', name: '광진구', nameEn: 'Gwangjin', dongs: [
    { slug: '구의동', name: '구의동' },
    { slug: '자양동', name: '자양동' },
  ]},
  { slug: '구로구', name: '구로구', nameEn: 'Guro', dongs: [
    { slug: '구로동', name: '구로동' },
    { slug: '신도림동', name: '신도림동' },
  ]},
  { slug: '금천구', name: '금천구', nameEn: 'Geumcheon', dongs: [
    { slug: '가산동', name: '가산동' },
    { slug: '독산동', name: '독산동' },
  ]},
  { slug: '노원구', name: '노원구', nameEn: 'Nowon', dongs: [
    { slug: '상계동', name: '상계동' },
    { slug: '중계동', name: '중계동' },
  ]},
  { slug: '도봉구', name: '도봉구', nameEn: 'Dobong', dongs: [
    { slug: '쌍문동', name: '쌍문동' },
    { slug: '방학동', name: '방학동' },
  ]},
  { slug: '동대문구', name: '동대문구', nameEn: 'Dongdaemun', dongs: [
    { slug: '청량리동', name: '청량리동' },
    { slug: '전농동', name: '전농동' },
  ]},
  { slug: '동작구', name: '동작구', nameEn: 'Dongjak', dongs: [
    { slug: '사당동', name: '사당동' },
    { slug: '상도동', name: '상도동' },
    { slug: '흑석동', name: '흑석동' },
  ]},
  { slug: '마포구', name: '마포구', nameEn: 'Mapo', dongs: [
    { slug: '상암동', name: '상암동' },
    { slug: '합정동', name: '합정동' },
    { slug: '망원동', name: '망원동' },
    { slug: '연남동', name: '연남동' },
  ]},
  { slug: '서대문구', name: '서대문구', nameEn: 'Seodaemun', dongs: [
    { slug: '연희동', name: '연희동' },
    { slug: '홍제동', name: '홍제동' },
  ]},
  { slug: '서초구', name: '서초구', nameEn: 'Seocho', dongs: [
    { slug: '서초동', name: '서초동' },
    { slug: '반포동', name: '반포동' },
    { slug: '잠원동', name: '잠원동' },
  ]},
  { slug: '성동구', name: '성동구', nameEn: 'Seongdong', dongs: [
    { slug: '성수동', name: '성수동' },
    { slug: '왕십리동', name: '왕십리동' },
  ]},
  { slug: '성북구', name: '성북구', nameEn: 'Seongbuk', dongs: [
    { slug: '성북동', name: '성북동' },
    { slug: '정릉동', name: '정릉동' },
  ]},
  { slug: '송파구', name: '송파구', nameEn: 'Songpa', dongs: [
    { slug: '잠실동', name: '잠실동' },
    { slug: '문정동', name: '문정동' },
    { slug: '방이동', name: '방이동' },
  ]},
  { slug: '양천구', name: '양천구', nameEn: 'Yangcheon', dongs: [
    { slug: '목동', name: '목동' },
    { slug: '신정동', name: '신정동' },
  ]},
  { slug: '영등포구', name: '영등포구', nameEn: 'Yeongdeungpo', dongs: [
    { slug: '여의도동', name: '여의도동' },
    { slug: '영등포동', name: '영등포동' },
    { slug: '당산동', name: '당산동' },
  ]},
  { slug: '용산구', name: '용산구', nameEn: 'Yongsan', dongs: [
    { slug: '이태원동', name: '이태원동' },
    { slug: '한남동', name: '한남동' },
    { slug: '용산동', name: '용산동' },
  ]},
  { slug: '은평구', name: '은평구', nameEn: 'Eunpyeong', dongs: [
    { slug: '불광동', name: '불광동' },
    { slug: '응암동', name: '응암동' },
  ]},
  { slug: '종로구', name: '종로구', nameEn: 'Jongno', dongs: [
    { slug: '종로동', name: '종로동' },
    { slug: '혜화동', name: '혜화동' },
    { slug: '사직동', name: '사직동' },
  ]},
  { slug: '중구', name: '중구', nameEn: 'Jung', dongs: [
    { slug: '명동', name: '명동' },
    { slug: '을지로동', name: '을지로동' },
    { slug: '회현동', name: '회현동' },
  ]},
  { slug: '중랑구', name: '중랑구', nameEn: 'Jungnang', dongs: [
    { slug: '면목동', name: '면목동' },
    { slug: '상봉동', name: '상봉동' },
  ]},
]

// ========================================
// 경기도 (31개 시/군)
// ========================================
const gyeonggiDistricts: District[] = [
  { slug: '수원시', name: '수원시', nameEn: 'Suwon', dongs: [
    { slug: '영통동', name: '영통동' }, { slug: '광교동', name: '광교동' },
    { slug: '인계동', name: '인계동' },
  ]},
  { slug: '성남시', name: '성남시', nameEn: 'Seongnam', dongs: [
    { slug: '분당동', name: '분당동' }, { slug: '정자동', name: '정자동' },
    { slug: '판교동', name: '판교동' },
  ]},
  { slug: '용인시', name: '용인시', nameEn: 'Yongin', dongs: [
    { slug: '기흥동', name: '기흥동' }, { slug: '수지동', name: '수지동' },
  ]},
  { slug: '고양시', name: '고양시', nameEn: 'Goyang', dongs: [
    { slug: '일산동', name: '일산동' }, { slug: '화정동', name: '화정동' },
  ]},
  { slug: '화성시', name: '화성시', nameEn: 'Hwaseong', dongs: [
    { slug: '동탄동', name: '동탄동' }, { slug: '봉담읍', name: '봉담읍' },
  ]},
  { slug: '부천시', name: '부천시', nameEn: 'Bucheon', dongs: [
    { slug: '중동', name: '중동' }, { slug: '상동', name: '상동' },
  ]},
  { slug: '남양주시', name: '남양주시', nameEn: 'Namyangju', dongs: [
    { slug: '다산동', name: '다산동' }, { slug: '호평동', name: '호평동' },
  ]},
  { slug: '안산시', name: '안산시', nameEn: 'Ansan', dongs: [
    { slug: '고잔동', name: '고잔동' }, { slug: '선부동', name: '선부동' },
  ]},
  { slug: '평택시', name: '평택시', nameEn: 'Pyeongtaek', dongs: [
    { slug: '비전동', name: '비전동' }, { slug: '고덕면', name: '고덕면' },
  ]},
  { slug: '안양시', name: '안양시', nameEn: 'Anyang', dongs: [
    { slug: '평촌동', name: '평촌동' }, { slug: '인덕원동', name: '인덕원동' },
  ]},
  { slug: '시흥시', name: '시흥시', nameEn: 'Siheung', dongs: [
    { slug: '정왕동', name: '정왕동' }, { slug: '배곧동', name: '배곧동' },
  ]},
  { slug: '김포시', name: '김포시', nameEn: 'Gimpo', dongs: [
    { slug: '장기동', name: '장기동' }, { slug: '구래동', name: '구래동' },
  ]},
  { slug: '광주시', name: '광주시', nameEn: 'Gwangju', dongs: [
    { slug: '오포읍', name: '오포읍' },
  ]},
  { slug: '광명시', name: '광명시', nameEn: 'Gwangmyeong', dongs: [
    { slug: '철산동', name: '철산동' }, { slug: '하안동', name: '하안동' },
  ]},
  { slug: '군포시', name: '군포시', nameEn: 'Gunpo', dongs: [
    { slug: '산본동', name: '산본동' },
  ]},
  { slug: '하남시', name: '하남시', nameEn: 'Hanam', dongs: [
    { slug: '망월동', name: '망월동' }, { slug: '미사동', name: '미사동' },
  ]},
  { slug: '오산시', name: '오산시', nameEn: 'Osan', dongs: [
    { slug: '세마동', name: '세마동' },
  ]},
  { slug: '이천시', name: '이천시', nameEn: 'Icheon', dongs: [
    { slug: '부발읍', name: '부발읍' },
  ]},
  { slug: '양주시', name: '양주시', nameEn: 'Yangju', dongs: [
    { slug: '옥정동', name: '옥정동' },
  ]},
  { slug: '구리시', name: '구리시', nameEn: 'Guri', dongs: [
    { slug: '인창동', name: '인창동' },
  ]},
  { slug: '안성시', name: '안성시', nameEn: 'Anseong', dongs: [
    { slug: '공도읍', name: '공도읍' },
  ]},
  { slug: '포천시', name: '포천시', nameEn: 'Pocheon', dongs: [
    { slug: '소흘읍', name: '소흘읍' },
  ]},
  { slug: '의왕시', name: '의왕시', nameEn: 'Uiwang', dongs: [
    { slug: '내손동', name: '내손동' },
  ]},
  { slug: '양평군', name: '양평군', nameEn: 'Yangpyeong', dongs: [
    { slug: '양평읍', name: '양평읍' },
  ]},
  { slug: '여주시', name: '여주시', nameEn: 'Yeoju', dongs: [
    { slug: '여주동', name: '여주동' },
  ]},
  { slug: '동두천시', name: '동두천시', nameEn: 'Dongducheon', dongs: [
    { slug: '생연동', name: '생연동' },
  ]},
  { slug: '과천시', name: '과천시', nameEn: 'Gwacheon', dongs: [
    { slug: '원문동', name: '원문동' },
  ]},
  { slug: '가평군', name: '가평군', nameEn: 'Gapyeong', dongs: [
    { slug: '가평읍', name: '가평읍' },
  ]},
  { slug: '연천군', name: '연천군', nameEn: 'Yeoncheon', dongs: [
    { slug: '연천읍', name: '연천읍' },
  ]},
  { slug: '파주시', name: '파주시', nameEn: 'Paju', dongs: [
    { slug: '운정동', name: '운정동' }, { slug: '금촌동', name: '금촌동' },
  ]},
  { slug: '의정부시', name: '의정부시', nameEn: 'Uijeongbu', dongs: [
    { slug: '민락동', name: '민락동' }, { slug: '호원동', name: '호원동' },
  ]},
]

// ========================================
// 인천광역시 (10개 군/구)
// ========================================
const incheonDistricts: District[] = [
  { slug: '연수구', name: '연수구', nameEn: 'Yeonsu', dongs: [
    { slug: '송도동', name: '송도동' }, { slug: '연수동', name: '연수동' },
  ]},
  { slug: '남동구', name: '남동구', nameEn: 'Namdong', dongs: [
    { slug: '구월동', name: '구월동' }, { slug: '논현동', name: '논현동' },
  ]},
  { slug: '부평구', name: '부평구', nameEn: 'Bupyeong', dongs: [
    { slug: '부평동', name: '부평동' }, { slug: '삼산동', name: '삼산동' },
  ]},
  { slug: '중구', name: '중구', nameEn: 'Jung', dongs: [
    { slug: '운서동', name: '운서동' }, { slug: '신포동', name: '신포동' },
  ]},
  { slug: '서구', name: '서구', nameEn: 'Seo', dongs: [
    { slug: '청라동', name: '청라동' }, { slug: '검단동', name: '검단동' },
  ]},
  { slug: '동구', name: '동구', nameEn: 'Dong', dongs: [
    { slug: '송현동', name: '송현동' },
  ]},
  { slug: '미추홀구', name: '미추홀구', nameEn: 'Michuhol', dongs: [
    { slug: '주안동', name: '주안동' }, { slug: '용현동', name: '용현동' },
  ]},
  { slug: '계양구', name: '계양구', nameEn: 'Gyeyang', dongs: [
    { slug: '작전동', name: '작전동' }, { slug: '계산동', name: '계산동' },
  ]},
  { slug: '강화군', name: '강화군', nameEn: 'Ganghwa', dongs: [
    { slug: '강화읍', name: '강화읍' },
  ]},
  { slug: '옹진군', name: '옹진군', nameEn: 'Ongjin', dongs: [
    { slug: '북도면', name: '북도면' },
  ]},
]

// ========================================
// 통합 Region 데이터
// ========================================
export const regions: Region[] = [
  {
    code: 'seoul',
    nameKo: '서울특별시',
    nameKoShort: '서울',
    nameEn: 'Seoul',
    districts: seoulDistricts,
    districtCount: 25,
    dongCount: 467, // 실제 행정동 수
  },
  {
    code: 'gyeonggi',
    nameKo: '경기도',
    nameKoShort: '경기',
    nameEn: 'Gyeonggi',
    districts: gyeonggiDistricts,
    districtCount: 31,
    dongCount: 568,
  },
  {
    code: 'incheon',
    nameKo: '인천광역시',
    nameKoShort: '인천',
    nameEn: 'Incheon',
    districts: incheonDistricts,
    districtCount: 10,
    dongCount: 155,
  },
]

// ========================================
// 조회 헬퍼
// ========================================
export function findRegion(regionSlug: string): Region | undefined {
  return regions.find(
    (r) => r.nameKoShort === regionSlug || r.nameKo === regionSlug || r.code === regionSlug,
  )
}

export function findDistrict(
  region: Region,
  districtSlug: string,
): District | undefined {
  return region.districts.find(
    (d) => d.slug === districtSlug || d.name === districtSlug,
  )
}

export function findDong(district: District, dongSlug: string): Dong | undefined {
  return district.dongs.find((d) => d.slug === dongSlug || d.name === dongSlug)
}

/**
 * 지역 해석: "서울"/"강남구"/"역삼동" 같은 경로 파라미터를
 * 실제 객체로 변환. 존재하지 않으면 undefined.
 */
export function resolveRegionPath(
  regionSlug?: string,
  districtSlug?: string,
  dongSlug?: string,
): { region?: Region; district?: District; dong?: Dong } {
  if (!regionSlug) return {}
  const region = findRegion(regionSlug)
  if (!region) return {}
  if (!districtSlug) return { region }
  const district = findDistrict(region, districtSlug)
  if (!district) return { region }
  if (!dongSlug) return { region, district }
  const dong = findDong(district, dongSlug)
  return { region, district, dong }
}

export function getTotalDongCount(): number {
  return regions.reduce((sum, r) => sum + r.dongCount, 0)
}
