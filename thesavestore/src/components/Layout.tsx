import type { FC, PropsWithChildren } from 'hono/jsx'
import { globalStyles } from '../styles'
import type { PageMeta } from '../types'

interface LayoutProps extends PropsWithChildren {
  meta: PageMeta
}

export const Layout: FC<LayoutProps> = ({ meta, children }) => {
  return (
    <html lang="ko">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="naver-site-verification" content="4bff453e20c339b2aeaaa47c842b7e1a4c579ec9" />
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        {meta.canonical && <link rel="canonical" href={meta.canonical} />}

        {/* Open Graph */}
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:type" content="website" />
        {meta.canonical && <meta property="og:url" content={meta.canonical} />}
        {meta.ogImage && <meta property="og:image" content={meta.ogImage} />}

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={meta.title} />
        <meta name="twitter:description" content={meta.description} />

        {/* 폰트 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />

        {/* 전역 스타일 */}
        <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
