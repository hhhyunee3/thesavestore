import type { FC } from 'hono/jsx'
import { industries } from '../../data/industries'

export const Industries: FC = () => (
  <section class="industries" id="industries">
    <div class="container">
      <div class="sec-label">BY INDUSTRY</div>
      <h2 class="sec-title">
        업종별 <span class="emph">맞춤 구성.</span>
      </h2>
      <p class="sec-sub">
        업종에 따라 필요한 장비 조합이 다릅니다. 우리 매장에 맞는 패키지를 확인하세요.
      </p>

      <div class="industry-grid">
        {industries.map((i) => (
          <a href={`/업종/${i.slug}`} class="industry-card">
            <div class="ind-icon">{i.icon}</div>
            <div>
              <div class="ind-name">{i.name}</div>
              <div class="ind-meta">{i.meta}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  </section>
)
