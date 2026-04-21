import type { FC } from 'hono/jsx'
import { products } from '../../data/products'

interface CoreProductsProps {
  /** 지역 컨텍스트 (예: "역삼동") - 링크에 반영 */
  locationPath?: string
}

export const CoreProducts: FC<CoreProductsProps> = ({ locationPath }) => {
  // 지역 컨텍스트가 있으면 제품 링크를 /{locationPath}/{product} 형태로
  const getProductHref = (slug: string) =>
    locationPath ? `/${locationPath}/${slug}` : `/제품/${slug}`

  return (
    <section class="core-products" id="products">
      <div class="container">
        <div class="sec-label">CORE PRODUCTS</div>
        <h2 class="sec-title">
          결제부터 주문까지
          <br />
          <span class="emph">세 가지 핵심 장비.</span>
        </h2>
        <p class="sec-sub">
          수많은 옵션 대신, 매출에 바로 영향을 주는 세 가지에 집중합니다.
          <br />
          필요한 장비를 선택하고, 나머지는 매니저가 맡습니다.
        </p>

        <div class="product-grid">
          {products.map((p, idx) => (
            <a
              href={getProductHref(p.slug)}
              class={`product-card${p.featured ? ' reversed' : ''}`}
            >
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
  )
}
