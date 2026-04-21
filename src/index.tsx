import { Hono } from 'hono'
import { HomePage } from './pages/HomePage'
import { ProductPage } from './pages/ProductPage'
import { IndustryPage } from './pages/IndustryPage'
import { RegionPage } from './pages/RegionPage'
import { findProduct, products } from './data/products'
import { findIndustry, industries } from './data/industries'
import { resolveRegionPath, findRegion, regions } from './data/regions'

const app = new Hono()

/**
 * 로봇 & 사이트맵
 */
app.get('/robots.txt', (c) =>
  c.text(
    [
      'User-agent: *',
      'Allow: /',
      '',
      'Sitemap: https://thesavestore.com/sitemap.xml',
    ].join('\n'),
    200,
    { 'Content-Type': 'text/plain; charset=utf-8' },
  ),
)

// sitemap은 라우트 확정 후 별도 구현 권장 (regions/products/industries × 레벨 모두 열거)
// 지금은 스텁으로 루트만.
app.get('/sitemap.xml', (c) => {
  const base = 'https://thesavestore.com'
  const urls: string[] = []

  // 홈
  urls.push(base + '/')

  // 제품 3종
  for (const p of products) {
    urls.push(base + '/제품/' + encodeURIComponent(p.slug))
  }

  // 업종 8종
  for (const i of industries) {
    urls.push(base + '/업종/' + encodeURIComponent(i.slug))
  }

  // 지역 - 4단계
  for (const r of regions) {
    urls.push(base + '/' + encodeURIComponent(r.nameKoShort))
    for (const d of r.districts) {
      urls.push(base + '/' + encodeURIComponent(r.nameKoShort) + '/' + encodeURIComponent(d.slug))
      for (const dong of d.dongs) {
        const dongPath =
          base +
          '/' +
          encodeURIComponent(r.nameKoShort) +
          '/' +
          encodeURIComponent(d.slug) +
          '/' +
          encodeURIComponent(dong.slug)
        urls.push(dongPath)
        // 읍면동 × 제품 롱테일
        for (const p of products) {
          urls.push(dongPath + '/' + encodeURIComponent(p.slug))
        }
      }
    }
  }

  const today = new Date().toISOString().split('T')[0]
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls
      .map(
        (u) =>
          `  <url><loc>${u}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq></url>`,
      )
      .join('\n') +
    '\n</urlset>'

  return c.text(xml, 200, {
    'Content-Type': 'application/xml; charset=utf-8',
    'Cache-Control': 'public, max-age=3600',
  })
})

/**
 * 홈
 */
app.get('/', (c) => c.html(<HomePage />))

/**
 * 제품 상세: /제품/:slug
 */
app.get('/제품/:slug', (c) => {
  const slug = c.req.param('slug')
  const product = findProduct(slug)
  if (!product) {
    return c.notFound()
  }
  return c.html(<ProductPage product={product} />)
})

/**
 * 업종 상세: /업종/:slug
 */
app.get('/업종/:slug', (c) => {
  const slug = c.req.param('slug')
  const industry = findIndustry(slug)
  if (!industry) {
    return c.notFound()
  }
  return c.html(<IndustryPage industry={industry} />)
})

/**
 * 지역 라우트 - 1~4 세그먼트 처리
 * /:광역
 * /:광역/:시군구
 * /:광역/:시군구/:읍면동
 * /:광역/:시군구/:읍면동/:제품
 */
app.get('/:region', (c) => {
  const regionSlug = c.req.param('region')
  const { region } = resolveRegionPath(regionSlug)
  if (!region) return c.notFound()
  return c.html(<RegionPage region={region} />)
})

app.get('/:region/:district', (c) => {
  const { region, district } = resolveRegionPath(
    c.req.param('region'),
    c.req.param('district'),
  )
  if (!region || !district) return c.notFound()
  return c.html(<RegionPage region={region} district={district} />)
})

app.get('/:region/:district/:dong', (c) => {
  const { region, district, dong } = resolveRegionPath(
    c.req.param('region'),
    c.req.param('district'),
    c.req.param('dong'),
  )
  if (!region || !district || !dong) return c.notFound()
  return c.html(<RegionPage region={region} district={district} dong={dong} />)
})

app.get('/:region/:district/:dong/:product', (c) => {
  const { region, district, dong } = resolveRegionPath(
    c.req.param('region'),
    c.req.param('district'),
    c.req.param('dong'),
  )
  if (!region || !district || !dong) return c.notFound()

  const product = findProduct(c.req.param('product'))
  if (!product) return c.notFound()

  return c.html(
    <RegionPage region={region} district={district} dong={dong} product={product} />,
  )
})

/**
 * 404 핸들러
 */
app.notFound((c) => {
  return c.html(
    <html lang="ko">
      <head>
        <meta charset="UTF-8" />
        <title>페이지를 찾을 수 없습니다 · 더세이브 스토어</title>
        <style
          dangerouslySetInnerHTML={{
            __html: `
            body { font-family: -apple-system, sans-serif; padding: 80px 20px; text-align: center; background: #fff; color: #000; }
            h1 { font-size: 72px; font-weight: 900; color: #FF7900; margin-bottom: 16px; letter-spacing: -0.05em; }
            p { color: #666; margin-bottom: 32px; }
            a { display: inline-block; background: #FF7900; color: #fff; padding: 14px 24px; text-decoration: none; border-radius: 2px; font-weight: 700; }
          `,
          }}
        />
      </head>
      <body>
        <h1>404</h1>
        <p>요청하신 페이지를 찾을 수 없습니다.</p>
        <a href="/">홈으로 돌아가기</a>
      </body>
    </html>,
    404,
  )
})

export default app
