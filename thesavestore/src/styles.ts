// SSR 환경에서는 <style> 태그에 인라인으로 삽입.
// 추후 Cloudflare R2 또는 /public CSS 서빙으로 분리 가능.

export const globalStyles = `
:root {
  --white: #FFFFFF;
  --ivory: #FAF8F3;
  --black: #000000;
  --brown: #3D2817;
  --brown-deep: #2A1B0F;
  --orange: #FF7900;
  --orange-deep: #D96400;
  --orange-tint: #FFF4EB;
  --muted: #666666;
  --muted-light: #999999;
  --line: #EEEEEE;
  --radius-sm: 2px;
  --radius-md: 4px;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }

body {
  font-family: 'Pretendard Variable', Pretendard, -apple-system, sans-serif;
  background: var(--white);
  color: var(--black);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}

img { max-width: 100%; display: block; }
.mono { font-family: 'Bricolage Grotesque', sans-serif; }

.container { max-width: 1280px; margin: 0 auto; padding: 0 32px; }

/* TOP BAR */
.topbar { background: var(--black); color: var(--white); font-size: 12px; padding: 9px 0; letter-spacing: -0.01em; }
.topbar-inner { display: flex; justify-content: space-between; align-items: center; }
.topbar-left { opacity: 0.72; }
.topbar-right { display: flex; gap: 20px; align-items: center; }
.topbar-right a { color: var(--white); text-decoration: none; opacity: 0.72; transition: opacity .2s; }
.topbar-right a:hover { opacity: 1; }
.topbar-phone { color: var(--orange) !important; opacity: 1 !important; font-weight: 600; }

/* NAV */
.nav {
  background: rgba(255, 255, 255, 0.95);
  border-bottom: 0.5px solid var(--line);
  padding: 18px 0;
  position: sticky; top: 0; z-index: 100;
  backdrop-filter: blur(16px);
}
.nav-inner { display: flex; justify-content: space-between; align-items: center; }
.logo { display: flex; align-items: center; gap: 10px; text-decoration: none; color: var(--black); }
.logo-mark {
  width: 32px; height: 32px;
  background: var(--brown); color: var(--orange);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Bricolage Grotesque', sans-serif;
  font-weight: 800; font-size: 17px;
  border-radius: var(--radius-sm);
}
.logo-text { font-weight: 900; font-size: 18px; letter-spacing: -0.04em; }
.nav-menu { display: flex; gap: 32px; list-style: none; align-items: center; }
.nav-menu a {
  color: var(--black); text-decoration: none;
  font-weight: 500; font-size: 14px; transition: color .2s;
}
.nav-menu a:hover { color: var(--orange); }
.nav-cta {
  background: var(--orange); color: var(--white) !important;
  padding: 10px 18px; border-radius: var(--radius-sm);
  font-weight: 700 !important; transition: background .2s;
}
.nav-cta:hover { background: var(--orange-deep); }

/* HERO */
.hero { padding: 80px 0 100px; background: var(--white); }
.hero-grid { display: grid; grid-template-columns: 1.15fr 1fr; gap: 60px; align-items: center; }
.hero-chip {
  display: inline-flex; align-items: center; gap: 8px;
  background: var(--brown); color: var(--white);
  padding: 7px 14px; border-radius: 100px;
  font-size: 12px; margin-bottom: 32px; font-weight: 500;
}
.hero-chip-dot { width: 6px; height: 6px; background: var(--orange); border-radius: 50%; animation: pulse 2s infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

.hero h1 {
  font-size: clamp(44px, 5.6vw, 76px);
  font-weight: 900; line-height: 1.02;
  letter-spacing: -0.055em; margin-bottom: 28px;
  color: var(--black);
}
.hero h1 .accent { color: var(--orange); }
.hero-sub {
  font-size: 17px; color: var(--muted);
  line-height: 1.7; max-width: 480px;
  margin-bottom: 40px; font-weight: 300; letter-spacing: -0.01em;
}
.hero-ctas { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 56px; }
.btn {
  padding: 15px 26px; border-radius: var(--radius-sm);
  font-weight: 700; font-size: 14px;
  text-decoration: none; display: inline-flex; align-items: center;
  gap: 8px; transition: all .2s; border: none; cursor: pointer;
  letter-spacing: -0.015em;
}
.btn-primary { background: var(--orange); color: var(--white); }
.btn-primary:hover { background: var(--orange-deep); transform: translateY(-1px); }
.btn-outline { background: var(--white); color: var(--black); border: 0.5px solid var(--black); }
.btn-outline:hover { background: var(--black); color: var(--white); }

.hero-stats { display: flex; gap: 48px; padding-top: 32px; border-top: 0.5px solid var(--line); }
.stat-num {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 38px; font-weight: 700; line-height: 1;
  letter-spacing: -0.03em; color: var(--black);
}
.stat-num .unit { color: var(--orange); }
.stat-label {
  font-size: 11px; color: var(--muted);
  margin-top: 8px; letter-spacing: 0.08em; font-weight: 500;
}

/* Hero visual */
.hero-visual { position: relative; height: 560px; }
.device { position: absolute; border-radius: var(--radius-md); padding: 22px; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
.device-pos { width: 280px; top: 40px; right: 60px; background: var(--white); border: 0.5px solid var(--line); color: var(--black); z-index: 2; transform: rotate(-4deg); }
.device-kiosk { width: 220px; top: 240px; right: 0; background: var(--brown); color: var(--white); z-index: 3; transform: rotate(6deg); }
.device-card { width: 200px; top: 140px; right: 280px; background: var(--orange); color: var(--white); z-index: 1; transform: rotate(-2deg); }
.device-header {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase;
  margin-bottom: 14px; font-weight: 600; opacity: 0.6;
}
.device-title { font-weight: 800; font-size: 14px; margin-bottom: 4px; letter-spacing: -0.025em; }
.device-amount { font-family: 'Bricolage Grotesque', sans-serif; font-size: 30px; font-weight: 700; letter-spacing: -0.03em; margin: 12px 0 10px; line-height: 1; }
.device-row { display: flex; justify-content: space-between; padding: 7px 0; font-size: 11px; border-top: 0.5px dashed rgba(0,0,0,0.1); font-weight: 500; }
.device-kiosk .device-row, .device-card .device-row { border-color: rgba(255,255,255,0.2); }
.device-tag {
  display: inline-block; font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 10px; padding: 3px 8px; background: var(--black); color: var(--white);
  border-radius: 100px; font-weight: 700; margin-bottom: 10px; letter-spacing: 0.1em;
}
.float-badge {
  position: absolute; background: var(--white); border: 0.5px solid var(--black);
  color: var(--black); padding: 10px 16px; border-radius: 100px;
  font-size: 12px; font-weight: 700; letter-spacing: -0.02em;
  animation: float 3s ease-in-out infinite;
}
.badge-1 { top: 0; left: 20px; }
.badge-2 { bottom: 20px; left: 0; animation-delay: 1.2s; background: var(--orange); color: var(--white); border: none; }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }

/* SECTION COMMON */
.sec-label {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 12px; font-weight: 600; letter-spacing: 0.2em;
  color: var(--orange); margin-bottom: 14px;
  display: flex; align-items: center; gap: 12px;
}
.sec-label::before { content: ''; width: 24px; height: 1px; background: var(--orange); }
.sec-title {
  font-size: clamp(32px, 4.2vw, 52px);
  font-weight: 900; letter-spacing: -0.045em; line-height: 1.1;
  margin-bottom: 20px; color: var(--black); max-width: 780px;
}
.sec-title .emph { color: var(--orange); }
.sec-sub {
  font-size: 16px; color: var(--muted); line-height: 1.7;
  max-width: 620px; margin-bottom: 56px;
  font-weight: 300; letter-spacing: -0.01em;
}

/* CORE PRODUCTS */
.core-products { padding: 100px 0; background: var(--white); border-top: 0.5px solid var(--line); }
.product-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.product-card {
  background: var(--white); border: 0.5px solid var(--line);
  border-radius: var(--radius-md); padding: 36px 30px;
  text-decoration: none; color: inherit;
  transition: all .3s cubic-bezier(.4, 0, .2, 1);
  position: relative; display: flex; flex-direction: column;
  min-height: 340px;
}
.product-card:hover { border-color: var(--black); transform: translateY(-4px); }
.product-num { font-family: 'Bricolage Grotesque', sans-serif; font-size: 12px; color: var(--orange); letter-spacing: 0.22em; font-weight: 700; margin-bottom: 20px; }
.product-icon {
  width: 64px; height: 64px; background: var(--brown);
  border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center;
  font-size: 30px; margin-bottom: 26px;
}
.product-name { font-size: 22px; font-weight: 900; letter-spacing: -0.04em; margin-bottom: 8px; color: var(--black); }
.product-desc { font-size: 13px; color: var(--muted); line-height: 1.6; font-weight: 400; margin-bottom: auto; min-height: 44px; }
.product-foot { padding-top: 18px; margin-top: 24px; border-top: 0.5px dashed var(--line); display: flex; justify-content: space-between; align-items: center; }
.product-meta { font-family: 'Bricolage Grotesque', sans-serif; font-size: 12px; color: var(--muted); font-weight: 600; letter-spacing: -0.01em; }
.product-arrow { color: var(--orange); font-weight: 800; font-size: 18px; transition: transform .2s; }
.product-card:hover .product-arrow { transform: translateX(4px); }
.product-card.reversed { background: var(--brown); color: var(--white); border-color: var(--brown); overflow: hidden; }
.product-card.reversed::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--orange); }
.product-card.reversed .product-icon { background: rgba(255, 121, 0, 0.18); }
.product-card.reversed .product-name { color: var(--white); }
.product-card.reversed .product-desc { color: rgba(255, 255, 255, 0.72); }
.product-card.reversed .product-foot { border-color: rgba(255, 255, 255, 0.2); }
.product-card.reversed .product-meta { color: rgba(255, 255, 255, 0.65); }
.product-card.reversed:hover { background: var(--brown-deep); border-color: var(--brown-deep); }

/* INDUSTRIES */
.industries { padding: 100px 0; background: var(--ivory); }
.industry-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.industry-card {
  background: var(--white); border: 0.5px solid var(--line);
  border-radius: var(--radius-md); padding: 26px 22px;
  text-decoration: none; color: var(--black);
  transition: all .25s; display: flex; align-items: center; gap: 16px;
}
.industry-card:hover { background: var(--brown); color: var(--white); border-color: var(--brown); transform: translateY(-3px); }
.industry-card:hover .ind-meta { color: var(--orange); }
.ind-icon {
  width: 44px; height: 44px; background: var(--orange-tint);
  border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; flex-shrink: 0; transition: background .25s;
}
.industry-card:hover .ind-icon { background: rgba(255, 121, 0, 0.25); }
.ind-name { font-size: 15px; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 2px; }
.ind-meta { font-family: 'Bricolage Grotesque', sans-serif; font-size: 10px; color: var(--muted); letter-spacing: 0.05em; font-weight: 500; }

/* REGIONS */
.regions { padding: 100px 0; background: var(--white); }
.region-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.region-card {
  background: var(--white); border: 0.5px solid var(--line);
  border-radius: var(--radius-md); padding: 40px 32px;
  text-decoration: none; color: var(--black); transition: all .3s;
}
.region-card:hover { border-color: var(--black); transform: translateY(-4px); }
.region-en { font-family: 'Bricolage Grotesque', sans-serif; font-size: 52px; font-weight: 700; letter-spacing: -0.04em; line-height: 1; margin-bottom: 6px; color: var(--black); }
.region-ko { font-size: 18px; font-weight: 800; color: var(--muted); letter-spacing: -0.03em; margin-bottom: 28px; }
.region-stats { display: flex; gap: 24px; padding-top: 20px; border-top: 0.5px dashed var(--line); }
.region-stat-num { font-family: 'Bricolage Grotesque', sans-serif; font-size: 22px; font-weight: 700; letter-spacing: -0.025em; }
.region-stat-label { font-size: 11px; color: var(--muted); letter-spacing: 0.05em; margin-top: 4px; font-weight: 500; }
.region-chips { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 22px; }
.region-chip { font-size: 12px; padding: 4px 10px; background: var(--orange-tint); color: var(--brown); border-radius: 100px; font-weight: 500; }
.region-note {
  background: var(--brown); color: var(--white);
  border-radius: var(--radius-md); padding: 28px 32px;
  margin-top: 20px; display: flex; gap: 20px; align-items: center;
  font-size: 14px; line-height: 1.6; font-weight: 300;
}
.region-note strong { color: var(--orange); font-weight: 700; letter-spacing: -0.015em; }

/* PROCESS */
.process { padding: 100px 0; background: var(--brown); color: var(--white); }
.process .sec-label { color: var(--orange); }
.process .sec-label::before { background: var(--orange); }
.process .sec-title { color: var(--white); }
.process .sec-sub { color: rgba(255, 255, 255, 0.65); }
.process-steps {
  display: grid; grid-template-columns: repeat(4, 1fr);
  border-top: 0.5px solid rgba(255, 255, 255, 0.15);
  border-bottom: 0.5px solid rgba(255, 255, 255, 0.15);
  margin-top: 40px;
}
.process-step { padding: 40px 28px; border-right: 0.5px solid rgba(255, 255, 255, 0.15); }
.process-step:last-child { border-right: none; }
.step-num { font-family: 'Bricolage Grotesque', sans-serif; font-size: 12px; color: var(--orange); margin-bottom: 32px; letter-spacing: 0.2em; font-weight: 700; }
.step-title { font-size: 22px; font-weight: 900; margin-bottom: 10px; letter-spacing: -0.035em; }
.step-desc { font-size: 13px; color: rgba(255, 255, 255, 0.65); line-height: 1.6; margin-bottom: 20px; font-weight: 300; }
.step-time { display: inline-block; padding: 4px 12px; background: rgba(255, 121, 0, 0.2); color: var(--orange); border-radius: 100px; font-size: 11px; font-weight: 700; font-family: 'Bricolage Grotesque', sans-serif; }

/* TESTIMONIALS */
.testimonials { padding: 100px 0; background: var(--white); }
.testi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.testi-card { background: var(--white); border: 0.5px solid var(--line); border-radius: var(--radius-md); padding: 32px 28px; transition: all .25s; }
.testi-card:hover { border-color: var(--black); transform: translateY(-3px); }
.testi-card.reversed { background: var(--brown); color: var(--white); border-color: var(--brown); transform: translateY(-12px); }
.testi-card.reversed:hover { background: var(--brown-deep); border-color: var(--brown-deep); transform: translateY(-16px); }
.testi-tag { display: inline-block; font-family: 'Bricolage Grotesque', sans-serif; font-size: 12px; font-weight: 700; color: var(--orange); padding: 4px 10px; background: var(--orange-tint); border-radius: var(--radius-sm); margin-bottom: 22px; }
.testi-card.reversed .testi-tag { background: rgba(255, 121, 0, 0.18); }
.testi-stars { color: var(--orange); margin-bottom: 16px; letter-spacing: 2px; font-size: 13px; }
.testi-text { font-size: 18px; font-weight: 900; line-height: 1.35; margin-bottom: 14px; letter-spacing: -0.035em; white-space: pre-line; }
.testi-body { font-size: 14px; color: var(--muted); line-height: 1.65; margin-bottom: 24px; font-weight: 300; }
.testi-card.reversed .testi-body { color: rgba(255, 255, 255, 0.7); }
.testi-author { display: flex; justify-content: space-between; align-items: center; padding-top: 18px; border-top: 0.5px dashed var(--line); font-size: 12px; }
.testi-card.reversed .testi-author { border-color: rgba(255, 255, 255, 0.2); }
.testi-author-name { font-weight: 700; letter-spacing: -0.02em; }
.testi-author-region { font-family: 'Bricolage Grotesque', sans-serif; color: var(--muted); font-weight: 600; letter-spacing: 0.05em; }
.testi-card.reversed .testi-author-region { color: rgba(255, 255, 255, 0.5); }

/* CTA */
.cta-section { background: var(--orange); color: var(--white); padding: 80px 0; position: relative; overflow: hidden; }
.cta-section::before { content: ''; position: absolute; top: -120px; right: -120px; width: 420px; height: 420px; background: var(--orange-deep); border-radius: 50%; opacity: 0.35; }
.cta-inner { display: grid; grid-template-columns: 1.1fr 1fr; gap: 60px; align-items: center; position: relative; z-index: 2; }
.cta-inner h2 { font-size: clamp(32px, 4vw, 52px); font-weight: 900; line-height: 1.1; letter-spacing: -0.045em; margin-bottom: 18px; }
.cta-inner p { font-size: 16px; opacity: 0.92; line-height: 1.65; max-width: 520px; }
.cta-phone { background: var(--white); color: var(--black); border-radius: var(--radius-md); padding: 36px 32px; text-decoration: none; display: block; transition: transform .25s; }
.cta-phone:hover { transform: translateY(-4px); }
.cta-phone-label { font-family: 'Bricolage Grotesque', sans-serif; font-size: 12px; color: var(--muted); margin-bottom: 10px; letter-spacing: 0.18em; font-weight: 600; }
.cta-phone-num { font-family: 'Bricolage Grotesque', sans-serif; font-size: 42px; font-weight: 700; line-height: 1; letter-spacing: -0.035em; margin-bottom: 18px; color: var(--black); }
.cta-phone-hours { font-size: 12px; color: var(--muted); border-top: 0.5px dashed var(--line); padding-top: 16px; line-height: 1.5; font-weight: 500; }

/* FOOTER */
footer { background: var(--brown); color: var(--white); padding: 60px 0 28px; }
.footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; margin-bottom: 48px; }
.footer-col h4 { font-family: 'Bricolage Grotesque', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.2em; color: var(--orange); margin-bottom: 22px; }
.footer-col ul { list-style: none; }
.footer-col li { margin-bottom: 10px; }
.footer-col a { color: rgba(255, 255, 255, 0.7); text-decoration: none; font-size: 13px; transition: color .2s; letter-spacing: -0.01em; }
.footer-col a:hover { color: var(--orange); }
.footer-about .logo-text { color: var(--white); }
.footer-about .logo-mark { background: var(--white); color: var(--brown); }
.footer-about p { color: rgba(255, 255, 255, 0.65); font-size: 13px; line-height: 1.7; margin-top: 20px; font-weight: 300; }
.footer-bottom { border-top: 0.5px solid rgba(255, 255, 255, 0.15); padding-top: 24px; display: flex; justify-content: space-between; font-size: 11px; color: rgba(255, 255, 255, 0.45); font-family: 'Bricolage Grotesque', sans-serif; letter-spacing: 0.05em; }

/* FLOATING PHONE */
.floating-phone {
  position: fixed; bottom: 24px; right: 24px;
  background: var(--orange); color: var(--white);
  padding: 16px 24px; border-radius: 100px;
  font-weight: 800; font-size: 14px;
  text-decoration: none; display: flex; align-items: center; gap: 10px;
  box-shadow: 0 12px 32px rgba(255, 121, 0, 0.38);
  z-index: 99; transition: transform .2s; letter-spacing: -0.02em;
}
.floating-phone:hover { transform: scale(1.04); }

/* BREADCRUMB (for interior pages) */
.breadcrumb { padding: 28px 0 16px; background: var(--white); font-size: 12px; color: var(--muted); }
.breadcrumb ol { list-style: none; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.breadcrumb a { color: var(--muted); text-decoration: none; }
.breadcrumb a:hover { color: var(--orange); }
.breadcrumb li + li::before { content: '/'; margin-right: 6px; color: var(--muted-light); }
.breadcrumb li:last-child { color: var(--black); font-weight: 600; }

/* PAGE HEADER (interior) */
.page-header { padding: 60px 0 80px; background: var(--white); border-bottom: 0.5px solid var(--line); }

/* RESPONSIVE */
@media (max-width: 968px) {
  .container { padding: 0 20px; }
  .hero { padding: 60px 0 80px; }
  .hero-grid { grid-template-columns: 1fr; gap: 40px; }
  .hero-visual { height: 420px; }
  .hero-stats { gap: 28px; flex-wrap: wrap; }
  .product-grid { grid-template-columns: 1fr; }
  .industry-grid { grid-template-columns: repeat(2, 1fr); }
  .region-grid { grid-template-columns: 1fr; }
  .process-steps { grid-template-columns: 1fr 1fr; }
  .process-step { border-right: none; border-bottom: 0.5px solid rgba(255, 255, 255, 0.15); }
  .process-step:nth-child(2n-1) { border-right: 0.5px solid rgba(255, 255, 255, 0.15); }
  .testi-grid { grid-template-columns: 1fr; }
  .testi-card.reversed { transform: none; }
  .cta-inner { grid-template-columns: 1fr; gap: 36px; }
  .footer-grid { grid-template-columns: 1fr 1fr; gap: 32px; }
  .nav-menu { display: none; }
}
`
