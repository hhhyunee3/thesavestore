import type { FC } from 'hono/jsx'
import { testimonials } from '../../data/testimonials'

export const Process: FC = () => (
  <section class="process" id="process">
    <div class="container">
      <div class="sec-label">HOW IT WORKS</div>
      <h2 class="sec-title">
        상담부터 설치까지 <span class="emph">4단계.</span>
      </h2>
      <p class="sec-sub">복잡한 절차 없이, 전화 한 통이면 시작됩니다.</p>

      <div class="process-steps">
        <div class="process-step">
          <div class="step-num">STEP 01</div>
          <div class="step-title">무료 상담</div>
          <div class="step-desc">업종·매장 규모·필요 장비를 듣고 최적 구성을 제안합니다.</div>
          <div class="step-time">10분 이내</div>
        </div>
        <div class="process-step">
          <div class="step-num">STEP 02</div>
          <div class="step-title">견적 확정</div>
          <div class="step-desc">VAN사·장비·수수료를 비교한 투명한 견적을 드립니다.</div>
          <div class="step-time">당일 제공</div>
        </div>
        <div class="process-step">
          <div class="step-num">STEP 03</div>
          <div class="step-title">현장 설치</div>
          <div class="step-desc">전문 매니저가 매장을 직접 방문해 세팅까지 완료합니다.</div>
          <div class="step-time">당일·익일</div>
        </div>
        <div class="process-step">
          <div class="step-num">STEP 04</div>
          <div class="step-title">A/S 지원</div>
          <div class="step-desc">장애 발생 시 원격 해결, 필요 시 24시간 내 재방문.</div>
          <div class="step-time">365일</div>
        </div>
      </div>
    </div>
  </section>
)

const renderStars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n)

export const Testimonials: FC = () => (
  <section class="testimonials" id="reviews">
    <div class="container">
      <div class="sec-label">REAL REVIEWS</div>
      <h2 class="sec-title">
        수도권 사장님들의 <span class="emph">생생한 후기.</span>
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

export const CTA: FC = () => (
  <section class="cta-section" id="contact">
    <div class="container">
      <div class="cta-inner">
        <div>
          <h2>
            지금 전화 한 통이면
            <br />
            빠르게 시작됩니다.
          </h2>
          <p>
            어떤 장비가 필요한지 모르셔도 괜찮습니다.
            <br />
            업종과 매장 규모만 말씀해 주시면, 맞춤 구성을 제안해 드립니다.
          </p>
        </div>
        <a href="tel:010-9677-2356" class="cta-phone">
          <div class="cta-phone-label">FREE CONSULTATION</div>
          <div class="cta-phone-num">010-9677-2356</div>
          <div class="cta-phone-hours">평일 09:00 – 20:00 · 주말 10:00 – 18:00</div>
        </a>
      </div>
    </div>
  </section>
)
