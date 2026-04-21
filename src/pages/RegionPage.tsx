import type { FC } from 'hono/jsx'
import { Layout } from '../components/Layout'
import { Navigation, FloatingPhone } from '../components/Navigation'
import { Footer } from '../components/Footer'
import { CoreProducts } from '../components/sections/CoreProducts'
import { Industries } from '../components/sections/Industries'
import { Process, CTA } from '../components/sections/MainSections'
import { FAQ, LocalInsight, InstallRecord } from '../components/sections/Variants'
import { selectTestimonials } from '../data/testimonials'
import { getDistrictMeta, defaultDistrictMeta } from '../data/districtMeta'
import type { Region, District, Dong, Product, Testimonial } from '../types'
import {
  heroHeadlines_dong,
  heroHeadlines_district,
  heroSubcopy_dong,
  heroSubcopy_district,
} from '../utils/copyBank'
import { pickOne, fillTemplate, seededInt } from '../utils/variance'

interface RegionPageProps {
  region: Region
  district?: District
  dong?: Dong
  product?: Product
}

// 후기 3개를 별도로 렌더링 (Testimonials 컴포넌트를 대체)
const SeededTestimonials: FC<{ testimonials: Testimonial[]; locationLabel: string }> = ({
  testimonials,
  locationLabel,
}) => {
  const renderStars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n)
  return (
    <section class="testimonials">
      <div class="container">
        <div class="sec-label">LOCAL VOICES</div>
        <h2 class="sec-title">
          {locationLabel} 근처 사장님들의 <span class="emph">실제 후기.</span>
        </h2>
        <p class="sec-sub">숫자보다 실제 경험이 더 중요하니까요.</p>

        <div class="testi-grid">
          {testimonials.map((t) => (
            <div class={`testi-card${t.featured ? ' reversed' : ''}`}>
              <span class="testi-tag">{t.tag}</span>
              <div class="testi-stars">{renderStars(t.stars)}</div>
              <div class="testi-text">{t.text}</div>
              <div class="testi-body">{t.body}</div>
              <div class="testi-author">
                <span class="testi-author-name">{t.authorName}</span>
                <span class="testi-author-region">{t.regionEn}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export const RegionPage: FC<RegionPageProps> = ({ region, district, dong, product }) => {
  const level = product
    ? 'dong-product'
    : dong
    ? 'dong'
    : district
    ? 'district'
    : 'region'

  const locationLabel = [region.nameKoShort, district?.name, dong?.name]
    .filter(Boolean)
    .join(' ')

  // 시드 (URL 조합) - 동일 URL은 항상 동일한 콘텐츠
  const seed = [region.code, district?.slug, dong?.slug, product?.slug]
    .filter(Boolean)
    .join(':')

  // 시드 기반 히어로 카피 선택
  const heroHeadlineTemplate = pickOne(
    level === 'district' || level === 'region' ? heroHeadlines_district : heroHeadlines_dong,
    seed,
  )
  const heroSubcopyTemplate = pickOne(
    level === 'district' || level === 'region' ? heroSubcopy_district : heroSubcopy_dong,
    seed,
    1,
  )

  const heroHeadline = fillTemplate(heroHeadlineTemplate, { location: locationLabel })
  const heroSubcopy = fillTemplate(heroSubcopyTemplate, { location: locationLabel })

  // 시군구 메타 (district 이상 레벨에서만)
  const districtKey = district?.slug || district?.name
  const meta = districtKey
    ? getDistrictMeta(region.code, districtKey) ?? defaultDistrictMeta
    : null

  // 리뷰 로테이션
  const selectedTestimonials = selectTestimonials(seed, 3)

  // 섹션 순서/종류 시드 기반 로테이션 (4가지 패턴)
  const patternIdx = seededInt(seed, 99, 0, 4)

  // SEO 메타
  const title = product
    ? `${locationLabel} ${product.name} 출장 설치 · 더세이브 스토어`
    : `${locationLabel} 매장 설비 설치 · 더세이브 스토어`
  const description = product
    ? `${locationLabel} ${product.name} 전문 매니저가 방문 설치합니다. ${meta?.insight ?? ''}`
    : `${locationLabel} 지역 매장 설비 출장 설치. ${meta?.insight ?? ''} 카드단말기 · 포스기 · 키오스크 원스톱.`
  const canonicalPath = [region.nameKoShort, district?.slug, dong?.slug, product?.slug]
    .filter(Boolean)
    .join('/')
  const currentPath = [region.nameKoShort, district?.slug, dong?.slug]
    .filter(Boolean)
    .join('/')

  // 렌더링 결정
  const shouldShowInsight = meta !== null && (level === 'district' || level === 'dong' || level === 'dong-product')
  const shouldShowInstallRecord = level === 'dong' || level === 'dong-product'
  const shouldShowFAQ = level === 'district' || level === 'dong' || level === 'dong-product'

  return (
    <Layout
      meta={{
        title,
        description,
        canonical: `https://thesavestore.com/${canonicalPath}`,
      }}
    >
      <Navigation />

      <nav class="breadcrumb">
        <div class="container">
          <ol>
            <li>
              <a href="/">홈</a>
            </li>
            <li>
              {(district || dong || product) ? (
                <a href={`/${region.nameKoShort}`}>{region.nameKo}</a>
              ) : (
                region.nameKo
              )}
            </li>
            {district && (
              <li>
                {dong || product ? (
                  <a href={`/${region.nameKoShort}/${district.slug}`}>{district.name}</a>
                ) : (
                  district.name
                )}
              </li>
            )}
            {dong && (
              <li>
                {product ? (
                  <a href={`/${region.nameKoShort}/${district!.slug}/${dong.slug}`}>
                    {dong.name}
                  </a>
                ) : (
                  dong.name
                )}
              </li>
            )}
            {product && <li>{product.name}</li>}
          </ol>
        </div>
      </nav>

      <section class="page-header">
        <div class="container">
          <div class="sec-label">
            {level === 'dong-product'
              ? `${dong!.name} · ${product!.name}`
              : level === 'dong'
              ? `${district!.name} ${dong!.name}`
              : level === 'district'
              ? region.nameKo
              : 'REGION'}
          </div>
          <h1
            style="font-size: clamp(40px, 5.2vw, 72px); font-weight: 900; letter-spacing: -0.05em; line-height: 1.05; margin-bottom: 20px; color: var(--black); white-space: pre-line;"
          >
            {product ? (
              <>
                {locationLabel}
                {'\n'}
                <span style="color: var(--orange);">{product.name} 설치.</span>
              </>
            ) : (
              heroHeadline.split('\n').map((line, i) =>
                i === heroHeadline.split('\n').length - 1 ? (
                  <span style="color: var(--orange);">{line}</span>
                ) : (
                  <>
                    {line}
                    {'\n'}
                  </>
                ),
              )
            )}
          </h1>
          <p
            style="font-size: 17px; color: var(--muted); line-height: 1.7; max-width: 560px; font-weight: 300; margin-bottom: 32px;"
          >
            {product
              ? `${locationLabel} 지역 ${product.name} 전문 매니저가 직접 방문 설치합니다. ${
                  meta?.insight ?? ''
                }`
              : heroSubcopy}
          </p>
          <div class="hero-ctas">
            <a href="/#contact" class="btn btn-primary">
              무료 견적 받기 →
            </a>
            <a href="tel:010-9677-2356" class="btn btn-outline">
              📞 010-9677-2356
            </a>
          </div>

          {level === 'region' && (
            <div class="hero-stats" style="margin-top: 40px;">
              <div>
                <div class="stat-num">
                  {region.districtCount}
                  <span class="unit">.</span>
                </div>
                <div class="stat-label">
                  {region.code === 'gyeonggi'
                    ? '시군'
                    : region.code === 'incheon'
                    ? '군구'
                    : '자치구'}
                </div>
              </div>
              <div>
                <div class="stat-num">
                  {region.dongCount}
                  <span class="unit">.</span>
                </div>
                <div class="stat-label">
                  {region.code === 'seoul' ? '행정동' : '읍면동'}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 광역 레벨: 시군구 목록 */}
      {level === 'region' && (
        <section style="padding: 80px 0; background: var(--white); border-top: 0.5px solid var(--line);">
          <div class="container">
            <div class="sec-label">DISTRICTS</div>
            <h2 class="sec-title">
              {region.nameKo} <span class="emph">시군구별 상세.</span>
            </h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px;">
              {region.districts.map((d) => (
                <a
                  href={`/${region.nameKoShort}/${d.slug}`}
                  style="background: var(--white); border: 0.5px solid var(--line); border-radius: 4px; padding: 22px 20px; text-decoration: none; color: var(--black); display: flex; flex-direction: column; gap: 4px;"
                >
                  <div
                    style="font-size: 16px; font-weight: 800; letter-spacing: -0.03em;"
                  >
                    {d.name}
                  </div>
                  <div
                    style="font-family: 'Bricolage Grotesque', sans-serif; font-size: 11px; color: var(--muted); font-weight: 500; letter-spacing: 0.05em;"
                  >
                    {d.dongs.length}개 지역
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 시군구 레벨: 읍면동 목록 */}
      {level === 'district' && district && (
        <section style="padding: 80px 0; background: var(--white); border-top: 0.5px solid var(--line);">
          <div class="container">
            <div class="sec-label">DONG</div>
            <h2 class="sec-title">
              {district.name} <span class="emph">읍면동별 상세.</span>
            </h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px;">
              {district.dongs.map((dng) => (
                <a
                  href={`/${region.nameKoShort}/${district.slug}/${dng.slug}`}
                  style="background: var(--white); border: 0.5px solid var(--line); border-radius: 4px; padding: 20px 18px; text-decoration: none; color: var(--black); font-size: 15px; font-weight: 700; letter-spacing: -0.03em;"
                >
                  {dng.name}
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 지역 인사이트 (district 이상) */}
      {shouldShowInsight && meta && (
        <LocalInsight locationLabel={locationLabel} meta={meta} seed={seed} />
      )}

      {/* 읍면동/제품 페이지: 제품 3종 */}
      {(level === 'dong' || level === 'dong-product') && (
        <CoreProducts locationPath={currentPath} />
      )}

      {/* 설치 기록 (dong 이상) */}
      {shouldShowInstallRecord && (
        <InstallRecord seed={seed} locationLabel={locationLabel} />
      )}

      {/* 시드 기반 섹션 순서 로테이션: FAQ / Industries / Process */}
      {patternIdx === 0 && (
        <>
          {shouldShowFAQ && <FAQ seed={seed} locationLabel={locationLabel} />}
          <Industries />
          <Process />
        </>
      )}
      {patternIdx === 1 && (
        <>
          <Industries />
          {shouldShowFAQ && <FAQ seed={seed} locationLabel={locationLabel} />}
          <Process />
        </>
      )}
      {patternIdx === 2 && (
        <>
          <Process />
          <Industries />
          {shouldShowFAQ && <FAQ seed={seed} locationLabel={locationLabel} />}
        </>
      )}
      {patternIdx === 3 && (
        <>
          {shouldShowFAQ && <FAQ seed={seed} locationLabel={locationLabel} />}
          <Process />
          <Industries />
        </>
      )}

      {/* 리뷰 (시드 기반 3개 선택) */}
      <SeededTestimonials
        testimonials={selectedTestimonials}
        locationLabel={locationLabel}
      />

      <CTA />
      <Footer />
      <FloatingPhone />
    </Layout>
  )
}
