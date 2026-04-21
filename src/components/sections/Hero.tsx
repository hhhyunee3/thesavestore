import type { FC } from 'hono/jsx'

interface HeroProps {
  /** 지역 컨텍스트가 있으면 헤드라인 변형 (예: "강남구 매장에...") */
  locationContext?: string
}

export const Hero: FC<HeroProps> = ({ locationContext }) => {
  const chipText = locationContext
    ? `${locationContext} 출장 설치 가능`
    : '수도권 1,190개 읍면동 출장 설치'

  return (
    <section class="hero">
      <div class="container">
        <div class="hero-grid">
          <div class="hero-text">
            <div class="hero-chip">
              <span class="hero-chip-dot"></span>
              <span>{chipText}</span>
            </div>
            <h1>
              매장에 필요한
              <br />
              모든 설비를
              <br />
              <span class="accent">한번에.</span>
            </h1>
            <p class="hero-sub">
              카드단말기 · 포스기 · 키오스크. 세 가지 핵심 장비를
              <br />
              전문 매니저가 직접 방문해 설치합니다.
            </p>
            <div class="hero-ctas">
              <a href="#contact" class="btn btn-primary">
                무료 견적 받기 →
              </a>
              <a href="tel:010-9677-2356" class="btn btn-outline">
                📞 010-9677-2356
              </a>
            </div>
            <div class="hero-stats">
              <div>
                <div class="stat-num">
                  350<span class="unit">+</span>
                </div>
                <div class="stat-label">누적 설치</div>
              </div>
              <div>
                <div class="stat-num">
                  98<span class="unit">%</span>
                </div>
                <div class="stat-label">만족도</div>
              </div>
              <div>
                <div class="stat-num">
                  87<span class="unit">%</span>
                </div>
                <div class="stat-label">재계약률</div>
              </div>
              <div>
                <div class="stat-num">
                  24<span class="unit">h</span>
                </div>
                <div class="stat-label">A/S 응대</div>
              </div>
            </div>
          </div>

          <div class="hero-visual">
            <div class="device device-pos">
              <div class="device-header">오늘 매출 현황</div>
              <div class="device-title">매장 POS</div>
              <div class="device-amount">₩ 1,240,800</div>
              <div class="device-row">
                <span>결제 건수</span>
                <span>87건</span>
              </div>
              <div class="device-row">
                <span>평균 단가</span>
                <span>14,259원</span>
              </div>
              <div class="device-row">
                <span>VAN 수수료</span>
                <span>0.8%</span>
              </div>
            </div>
            <div class="device device-card">
              <span class="device-tag">APPROVED</span>
              <div class="device-header" style="opacity:0.85;">CARD PAYMENT</div>
              <div class="device-amount">₩ 34,500</div>
              <div class="device-row">
                <span>국민카드</span>
                <span>일시불</span>
              </div>
            </div>
            <div class="device device-kiosk">
              <div class="device-header" style="color:#FF7900; opacity:1;">주문 현황</div>
              <div class="device-title">키오스크</div>
              <div class="device-row" style="font-size: 12px;">
                <span>#241</span>
                <span style="color:#FF7900;">조리중</span>
              </div>
              <div class="device-row" style="font-size: 12px;">
                <span>#242</span>
                <span>대기</span>
              </div>
              <div class="device-row" style="font-size: 12px;">
                <span>#243</span>
                <span>접수</span>
              </div>
            </div>
            <div class="float-badge badge-1">⚡ 당일 설치</div>
            <div class="float-badge badge-2">🎯 수도권 전지역</div>
          </div>
        </div>
      </div>
    </section>
  )
}
