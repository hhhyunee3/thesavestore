import type { FC } from 'hono/jsx'
import { Layout } from '../components/Layout'
import { Navigation, FloatingPhone } from '../components/Navigation'
import { Footer } from '../components/Footer'
import { Industries } from '../components/sections/Industries'
import { Regions } from '../components/sections/Regions'
import { Process, CTA } from '../components/sections/MainSections'
import type { Product } from '../types'

interface ProductPageProps {
  product: Product
}

export const ProductPage: FC<ProductPageProps> = ({ product }) => {
  const title = `${product.name} 설치 · 더세이브 스토어`
  const description = `${product.name} · ${product.tagline}. 수도권 전문 매니저 출장 설치. ${product.description}`

  return (
    <Layout
      meta={{
        title,
        description,
        canonical: `https://thesavestore.com/제품/${product.slug}`,
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
              <a href="/#products">제품</a>
            </li>
            <li>{product.name}</li>
          </ol>
        </div>
      </nav>

      <section class="page-header">
        <div class="container">
          <div style="display: grid; grid-template-columns: 1fr auto; gap: 40px; align-items: center;">
            <div>
              <div class="sec-label">PRODUCT · {String(product.slug)}</div>
              <h1
                style="font-size: clamp(40px, 5vw, 68px); font-weight: 900; letter-spacing: -0.05em; line-height: 1.05; margin-bottom: 20px; color: var(--black);"
              >
                {product.name}
                <br />
                <span style="color: var(--orange);">{product.tagline}.</span>
              </h1>
              <p
                style="font-size: 17px; color: var(--muted); line-height: 1.7; max-width: 560px; font-weight: 300; margin-bottom: 32px;"
              >
                {product.description}
              </p>
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
              style="width: 180px; height: 180px; background: var(--brown); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 80px; flex-shrink: 0;"
            >
              {product.icon}
            </div>
          </div>
        </div>
      </section>

      {/* 제품 주요 기능 */}
      {product.features && product.features.length > 0 && (
        <section style="padding: 100px 0; background: var(--white);">
          <div class="container">
            <div class="sec-label">KEY FEATURES</div>
            <h2 class="sec-title">
              선택할 수 있는 <span class="emph">{product.metaCount}.</span>
            </h2>
            <p class="sec-sub">
              매장 규모와 운영 방식에 따라 최적의 옵션을 제안합니다.
            </p>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px;">
              {product.features.map((feature, idx) => (
                <div
                  style="background: var(--white); border: 0.5px solid var(--line); border-radius: 4px; padding: 28px 24px;"
                >
                  <div
                    style="font-family: 'Bricolage Grotesque', sans-serif; font-size: 12px; color: var(--orange); letter-spacing: 0.22em; font-weight: 700; margin-bottom: 16px;"
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </div>
                  <div
                    style="font-size: 16px; font-weight: 800; letter-spacing: -0.03em; color: var(--black);"
                  >
                    {feature}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 활용 사례 */}
      {product.useCases && product.useCases.length > 0 && (
        <section style="padding: 100px 0; background: var(--ivory);">
          <div class="container">
            <div class="sec-label">USE CASES</div>
            <h2 class="sec-title">
              실제로 <span class="emph">이렇게 쓰입니다.</span>
            </h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; margin-top: 40px;">
              {product.useCases.map((uc) => (
                <div
                  style="background: var(--white); border-radius: 4px; padding: 32px 28px; display: flex; gap: 16px; align-items: start;"
                >
                  <div
                    style="width: 28px; height: 28px; background: var(--orange); color: var(--white); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-weight: 800; font-size: 14px;"
                  >
                    ✓
                  </div>
                  <div
                    style="font-size: 15px; line-height: 1.6; color: var(--black); font-weight: 500; letter-spacing: -0.02em;"
                  >
                    {uc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <Process />
      <Industries />
      <Regions />
      <CTA />
      <Footer />
      <FloatingPhone />
    </Layout>
  )
}
