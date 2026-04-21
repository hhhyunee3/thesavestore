import type { FC } from 'hono/jsx'

const PHONE = '010-9677-2356'
const PHONE_HREF = 'tel:010-9677-2356'

export const Navigation: FC = () => (
  <>
    <div class="topbar">
      <div class="container topbar-inner">
        <div class="topbar-left">수도권 전 지역 · 당일 현장 방문 · 무료 견적</div>
        <div class="topbar-right">
          <a href="#">카카오 상담</a>
          <a href="/#reviews">설치 후기</a>
          <a href={PHONE_HREF} class="topbar-phone">📞 {PHONE}</a>
        </div>
      </div>
    </div>

    <nav class="nav">
      <div class="container nav-inner">
        <a href="/" class="logo">
          <span class="logo-text">더세이브 스토어</span>
        </a>
        <ul class="nav-menu">
          <li>
            <a href="/#products">제품</a>
          </li>
          <li>
            <a href="/#industries">업종</a>
          </li>
          <li>
            <a href="/#regions">지역</a>
          </li>
          <li>
            <a href="/#process">설치절차</a>
          </li>
          <li>
            <a href="/#reviews">후기</a>
          </li>
          <li>
            <a href="/#contact" class="nav-cta">
              무료 견적
            </a>
          </li>
        </ul>
      </div>
    </nav>
  </>
)

export const FloatingPhone: FC = () => (
  <a href={PHONE_HREF} class="floating-phone">
    📞 <span>무료 상담</span>
  </a>
)
