import type { FC } from 'hono/jsx'
import { products } from '../data/products'
import { industries } from '../data/industries'
import { regions } from '../data/regions'

export const Footer: FC = () => (
  <footer>
    <div class="container">
      <div class="footer-grid">
        <div class="footer-col footer-about">
          <a href="/" class="logo">
            <span class="logo-text">더세이브 스토어</span>
          </a>
          <p>
            1인 매장부터 대형 프랜차이즈까지,
            <br />
            수도권 전 지역 사장님을 위한
            <br />
            매장 설비 원스톱 설치 플랫폼.
          </p>
        </div>

        <div class="footer-col">
          <h4>PRODUCTS</h4>
          <ul>
            {products.map((p) => (
              <li>
                <a href={`/제품/${p.slug}`}>{p.name}</a>
              </li>
            ))}
          </ul>
        </div>

        <div class="footer-col">
          <h4>INDUSTRY</h4>
          <ul>
            {industries.map((i) => (
              <li>
                <a href={`/업종/${i.slug}`}>{i.name}</a>
              </li>
            ))}
          </ul>
        </div>

        <div class="footer-col">
          <h4>REGION</h4>
          <ul>
            {regions.map((r) => (
              <li>
                <a href={`/${r.nameKoShort}`}>{r.nameKo}</a>
              </li>
            ))}
          </ul>
          <h4 style="margin-top: 28px;">COMPANY</h4>
          <ul>
            <li>
              <a href="#">문의하기</a>
            </li>
            <li>
              <a href="#">설치 가이드</a>
            </li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom">
        <div>© 2026 THE SAVE STORE · ALL RIGHTS RESERVED</div>
        <div>대표 010-9677-2356 · 이용약관 · 개인정보처리방침</div>
      </div>
    </div>
  </footer>
)
