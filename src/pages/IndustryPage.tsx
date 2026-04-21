import type { FC } from 'hono/jsx'
import { Layout } from '../components/Layout'
import { Navigation, FloatingPhone } from '../components/Navigation'
import { Footer } from '../components/Footer'
import { Regions } from '../components/sections/Regions'
import { Process, CTA, Testimonials } from '../components/sections/MainSections'
import { products } from '../data/products'
import type { Industry } from '../types'

interface IndustryPageProps {
  industry: Industry
}

export const IndustryPage: FC<IndustryPageProps> = ({ industry }) => {
  const title = `${industry.name} 장비 설치 · 더세이브 스토어`
  const description = `${industry.name} 맞춤 POS · 카드단말기 · 키오스크 구성 추천. 수도권 전문 출장 설치.`

  // 추천 제품 객체로 매핑
  const recommendedProducts = industry.recommendedProducts
    .map((slug) => products.find((p) => p.slug === slug))
    .filter((p): p is NonNullable<typeof p> => p !== undefined)

  return (
    <Layout
      meta={{
        title,
        description,
        canonical: `https://thesavestore.com/업종/${industry.slug}`,
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
              <a href="/#industries">업종</a>
            </li>
            <li>{industry.name}</li>
          </ol>
        </div>
      </nav>

      <section class="page-header">
        <div class="container">
          <div style="display: grid; grid-template-columns: 1fr auto; gap: 40px; align-items: center;">
            <div>
              <div class="sec-label">INDUSTRY</div>
              <h1
                style="font-size: clamp(40px, 5vw, 68px); font-weight: 900; letter-spacing: -0.05em; line-height: 1.05; margin-bottom: 20px; color: var(--black);"
              >
                {industry.name}을 위한
                <br />
                <span style="color: var(--orange);">맞춤 장비 구성.</span>
              </h1>
              {industry.description && (
                <p
                  style="font-size: 17px; color: var(--muted); line-height: 1.7; max-width: 560px; font-weight: 300; margin-bottom: 32px;"
                >
                  {industry.description}
                </p>
              )}
              <div class="hero-ctas">
                <a href="/#contact" class="btn btn-primary">
                  무료 견적 받기 →
                </a>
                <a href="tel:010-9677-2356" class="btn btn-outline">
                  📞 010-9677-2356
                </a>
              </div>
            </div>
            <div
              style="width: 180px; height: 180px; background: var(--orange-tint); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 80px; flex-shrink: 0;"
            >
              {industry.icon}
            </div>
          </div>
        </div>
      </section>

      {/* 업종별 흔한 고민 */}
      {industry.commonIssues && industry.commonIssues.length > 0 && (
        <section style="padding: 80px 0; background: var(--white);">
          <div class="container">
            <div class="sec-label">COMMON ISSUES</div>
            <h2 class="sec-title">
              {industry.name} <span class="emph">사장님들의 고민.</span>
            </h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; margin-top: 40px;">
              {industry.commonIssues.map((issue) => (
                <div
                  style="background: var(--white); border: 0.5px solid var(--line); border-radius: 4px; padding: 28px 24px;"
                >
                  <div
                    style="font-size: 16px; font-weight: 700; color: var(--black); letter-spacing: -0.025em;"
                  >
                    {issue}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 추천 제품 */}
      <section style="padding: 100px 0; background: var(--ivory);">
        <div class="container">
          <div class="sec-label">RECOMMENDED SETUP</div>
          <h2 class="sec-title">
            추천 장비 <span class="emph">{recommendedProducts.length}종.</span>
          </h2>
          <p class="sec-sub">
            {industry.name} 운영에 꼭 필요한 장비를 엄선했습니다.
          </p>

          <div class="product-grid">
            {recommendedProducts.map((p, idx) => (
              <a href={`/제품/${p.slug}`} class="product-card">
                <div class="product-num">{String(idx + 1).padStart(2, '0')}</div>
                <div class="product-icon">{p.icon}</div>
                <div class="product-name">{p.name}</div>
                <div class="product-desc">{p.description}</div>
                <div class="product-foot">
                  <span class="product-meta">{p.metaCount}</span>
                  <span class="product-arrow">→</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <Testimonials />
      <Regions />
      <Process />
      <CTA />
      <Footer />
      <FloatingPhone />
    </Layout>
  )
}
