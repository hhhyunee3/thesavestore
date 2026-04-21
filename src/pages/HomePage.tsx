import type { FC } from 'hono/jsx'
import { Layout } from '../components/Layout'
import { Navigation, FloatingPhone } from '../components/Navigation'
import { Footer } from '../components/Footer'
import { Hero } from '../components/sections/Hero'
import { CoreProducts } from '../components/sections/CoreProducts'
import { Industries } from '../components/sections/Industries'
import { Regions } from '../components/sections/Regions'
import { Process, Testimonials, CTA } from '../components/sections/MainSections'

export const HomePage: FC = () => (
  <Layout
    meta={{
      title: '더세이브 스토어 · 매장에 필요한 모든 설비를 한번에',
      description:
        '카드단말기 · 포스기 · 키오스크. 수도권 1,190개 읍면동 전문 매니저 출장 설치. 무료 견적 상담.',
      canonical: 'https://thesavestore.com/',
    }}
  >
    <Navigation />
    <main>
      <Hero />
      <CoreProducts />
      <Industries />
      <Regions />
      <Process />
      <Testimonials />
      <CTA />
    </main>
    <Footer />
    <FloatingPhone />
  </Layout>
)
