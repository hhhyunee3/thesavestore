/*
 * 자판기 모델 페이지 — /products/vending-machine/models/<모델>/
 *
 * 근거 자료: docs/vending/ 의 PDF 6개 (공개 저장소라 git 에는 올리지 않는다).
 * 수치는 자료에 있는 것만 쓴다. 자료끼리 어긋나면 가장 최근에 만든 자료를 따른다
 * (2026-08-18 기준 최근 순: 업종별추천리스트 > 밴딩머신종류 > 냉동쇼케이스 브로슈어
 *  > 냉동 제안서·홈타운 브로슈어 > 스마트 제안서).
 * 제조사 연락처, 금액, 타사 비교, 설치 기관명은 쓰지 않는다.
 * 사이트에서는 "밴딩머신" 대신 "자판기"라고 쓴다.
 * 스마트 멀티 = 광고형 홈타운 (같은 모델 HT-MTS-v01: 스마트 제안서 4쪽, 홈타운 브로슈어 1쪽).
 *  한 모델로 쓰고, 수치는 홈타운 브로슈어 사양표(2쪽)를 따른다.
 */

const BASE = '/products/vending-machine';
export const VEND_MODEL_ORDER = ['smart-multi', 'extension', 'frozen-showcase', 'goods'];

/* ---------- 도식 (제품 사진 대신 쓰는 SVG) ---------- */
const svgWrap = (inner, label) =>
  `<svg viewBox="0 0 240 300" role="img" aria-label="${label}" style="width:100%;max-width:240px;height:auto;display:block">${inner}</svg>`;
const dimH = (x1, x2, y, t) =>
  `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="#999" stroke-width="1"/><line x1="${x1}" y1="${y-4}" x2="${x1}" y2="${y+4}" stroke="#999"/><line x1="${x2}" y1="${y-4}" x2="${x2}" y2="${y+4}" stroke="#999"/><text x="${(x1+x2)/2}" y="${y+14}" font-size="11" text-anchor="middle" fill="#666">${t}</text>`;
const dimV = (x, y1, y2, t) =>
  `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="#999" stroke-width="1"/><line x1="${x-4}" y1="${y1}" x2="${x+4}" y2="${y1}" stroke="#999"/><line x1="${x-4}" y1="${y2}" x2="${x+4}" y2="${y2}" stroke="#999"/><text x="${x+6}" y="${(y1+y2)/2}" font-size="11" fill="#666" transform="rotate(90 ${x+6} ${(y1+y2)/2})" text-anchor="middle">${t}</text>`;
const shelves = (x, y, w, n, gap) =>
  Array.from({ length: n }, (_, i) => `<line x1="${x}" y1="${y + i * gap}" x2="${x + w}" y2="${y + i * gap}" stroke="#CFCFCF" stroke-width="2"/>`).join('');

const SVG = {
  'smart-multi': svgWrap(
    `<rect x="30" y="20" width="160" height="240" rx="10" fill="#fff" stroke="#222" stroke-width="2"/>` +
    `<rect x="42" y="34" width="86" height="168" rx="4" fill="#F4F7FA" stroke="#999"/>` + shelves(46, 58, 78, 6, 24) +
    `<rect x="138" y="60" width="42" height="70" rx="3" fill="#FF5500" opacity=".85"/><text x="159" y="99" font-size="10" fill="#fff" text-anchor="middle">23.8″</text>` +
    `<rect x="60" y="216" width="50" height="24" rx="3" fill="none" stroke="#999"/><text x="85" y="232" font-size="9" fill="#999" text-anchor="middle">배출구</text>` +
    `<circle cx="48" cy="266" r="5" fill="#222"/><circle cx="172" cy="266" r="5" fill="#222"/>` +
    dimH(30, 190, 284, '955mm') + dimV(212, 20, 260, '1970mm'), '스마트 멀티 자판기 정면 도식'),
  'extension': svgWrap(
    `<rect x="14" y="40" width="100" height="220" rx="8" fill="#fff" stroke="#BBB" stroke-width="2" stroke-dasharray="5 4"/><text x="64" y="150" font-size="11" fill="#999" text-anchor="middle">메인 자판기</text>` +
    `<rect x="122" y="40" width="104" height="220" rx="8" fill="#fff" stroke="#222" stroke-width="2"/>` +
    `<rect x="132" y="52" width="84" height="170" rx="4" fill="#F4F7FA" stroke="#999"/>` + shelves(136, 74, 76, 6, 24) +
    `<path d="M114 150 h8" stroke="#FF5500" stroke-width="3"/><text x="174" y="246" font-size="10" fill="#666" text-anchor="middle">확장형</text>` +
    `<text x="120" y="284" font-size="11" fill="#FF5500" text-anchor="middle">메인 1대에 연결해서 사용</text>`, '멀티 자판기 확장형 연결 도식'),
  'frozen-showcase': svgWrap(
    `<rect x="40" y="16" width="130" height="250" rx="6" fill="#1A1A1A" stroke="#1A1A1A" stroke-width="2"/>` +
    `<rect x="50" y="28" width="86" height="194" fill="#EEF4FA"/>` +
    Array.from({ length: 9 }, (_, r) => Array.from({ length: 5 }, (_, c) => `<rect x="${53 + c * 16.4}" y="${32 + r * 20.8}" width="14" height="18" fill="#fff" stroke="#9AB"/>`).join('')).join('') +
    `<rect x="140" y="40" width="26" height="40" rx="2" fill="#FF5500" opacity=".9"/><text x="153" y="64" font-size="8" fill="#fff" text-anchor="middle">15.6″</text>` +
    `<rect x="50" y="230" width="110" height="28" fill="#333"/>` +
    dimV(196, 16, 266, '2050mm'), '블록형 냉동 쇼케이스 자판기 정면 도식 (5×9 블록)'),
  'goods': svgWrap(
    `<rect x="60" y="70" width="120" height="150" rx="6" fill="#fff" stroke="#222" stroke-width="2"/>` +
    `<rect x="72" y="84" width="96" height="70" rx="3" fill="#F4F7FA" stroke="#999"/>` + shelves(76, 104, 88, 3, 18) +
    `<rect x="98" y="172" width="44" height="22" rx="3" fill="none" stroke="#999"/>` +
    `<rect x="60" y="220" width="120" height="50" fill="#fff" stroke="#BBB" stroke-dasharray="5 4"/><text x="120" y="250" font-size="10" fill="#999" text-anchor="middle">하단 장 (선택)</text>` +
    `<text x="120" y="56" font-size="11" fill="#666" text-anchor="middle">냉장·냉동 없음</text>`, '굿즈·담배 자판기 도식'),
};

/* ---------- 사진 (제조사 PDF에서 뽑은 이미지, images/vending/) ----------
 * 설치 장소 이름·간판·브랜드명이 보이는 사진은 쓰지 않는다. */
export const VEND_IMG_BASE = 'https://cdn.jsdelivr.net/gh/hhhyunee3/thesavestore@main/images/vending/';
const IMG_DIM = {'model-frozen':[700,898],'model-smart-multi':[461,900],'model-extension':[895,900],'smart-pair-room':[1200,802],'smart-lobby':[900,900],'rail-push':[645,390],'rail-spring':[645,484],'extension-photo':[439,391],'model-goods':[439,391],'school-1':[660,790],'school-2':[663,790],'school-3':[660,790],'sports-1':[646,772],'sports-2':[646,772],'sports-3':[505,604],'hotel-1':[646,772],'hospital-1':[646,772],'hospital-2':[646,772],'hospital-3':[646,772],'cafe-1':[487,583],'cafe-2':[646,772],'cafe-3':[413,493],'frz-store':[661,503],'frz-camping':[661,503],'frz-park':[661,503],'frz-specialty':[661,503],'frz-gas':[661,503],'frz-cake':[661,503],'frz-pet':[661,503],'frz-icecream':[661,503],'frz-mealkit':[718,704],'frz-meat':[632,619],'tray-school':[1200,675],'tray-sports':[1200,675]};
const imgUrl = (n) => VEND_IMG_BASE + n + '.jpg';
const imgTag = (n, alt, cls = '', eager = false) => {
  const [w, h] = IMG_DIM[n] || [800, 600];
  return `<img src="${imgUrl(n)}" alt="${alt}" width="${w}" height="${h}"${cls ? ` class="${cls}"` : ''}${eager ? ' fetchpriority="high"' : ' loading="lazy" decoding="async"'}>`;
};
const fig = ([n, alt, cap]) => `<figure>${imgTag(n, alt)}<figcaption>${cap}</figcaption></figure>`;
const gallery = (list) => list && list.length ? `<div class="vm-gallery">${list.map(fig).join('')}</div>` : '';
const CAP_DOC = '제품 자료 이미지';
const CAP_PROP = '제조사 설치 제안 이미지';

/* ---------- 모델 데이터 ---------- */
export const VEND_MODELS = {
  'smart-multi': {
    name: '스마트 멀티 자판기',
    short: '키오스크 화면, 냉장·온장 전환',
    tag: '키오스크 결합형 · 냉장/온장',
    photo: ['model-smart-multi', '스마트 멀티 자판기 정면, 왼쪽에 진열창과 오른쪽에 터치 화면'],
    gallery: [
      ['smart-pair-room', '스마트 멀티 자판기 옆에 확장형을 붙여 둔 모습', CAP_DOC + ' · 오른쪽이 확장형'],
      ['smart-lobby', '로비에 스마트 멀티 자판기 두 대를 둔 모습', CAP_DOC],
      ['rail-push', '소형 푸시 방식 레일', '소형 푸시 방식 레일'],
      ['rail-spring', '스프링 방식 레일', '스프링 방식 레일'],
      ['cafe-2', '무인카페에 스마트 멀티 자판기 두 대를 나란히 둔 모습', '자료에 실린 무인카페 설치 사진'],
    ],
    card: '23.8인치 화면에서 고르고 결제합니다. 냉장과 온장을 바꿔 쓰고, 화면에 매장 광고를 띄웁니다.',
    lead: '23.8인치 터치 화면에서 상품을 고르고 카드나 모바일 결제로 사는 자판기입니다. 냉장(2~7℃)과 온장(0~30℃)을 바꿔 쓰고, 손님이 없을 때는 화면에 매장 광고나 공지를 띄웁니다.',
    desc: '스마트 멀티 자판기(광고형 홈타운) 크기 955×1970×920mm, 23.8인치 화면, 소비전력 434W, 냉장·온장 온도, 넣을 수 있는 상품 규격과 맞는 업종을 정리했습니다.',
    sections: [
      ['스마트 멀티 자판기는 어떤 기계인가요?',
        '<p>버튼 대신 23.8인치 터치 화면이 붙어 있는 자판기입니다. 손님은 화면에서 상품 사진과 설명을 보고 장바구니에 담아 한 번에 결제합니다. 화면은 한국어·영어·중국어·일본어 4개 언어로 바뀝니다.</p>' +
        '<p>자료에 따라 \'광고형 홈타운 자판기\'라는 이름으로도 소개됩니다. 두 이름은 모델 번호가 같은 한 기기입니다.</p>' +
        '<p>안쪽 트레이는 상품 크기에 맞춰 칸을 바꿀 수 있습니다. 그래서 캔음료만 파는 기계가 아니라 과자, 컵라면, 칫솔·면도기 같은 어메니티, 잡화까지 한 대에 섞어 넣을 수 있습니다. 냉장이 필요한 상품과 특산물, 굿즈에 맞는 모델로 소개되어 있습니다.</p>' +
        '<p>외관은 곡선형 흰색입니다. 바디 색상은 랩핑으로 바꿀 수 있고, 상단에 매장 로고를 넣거나 로고 스티커를 붙일 수 있습니다. 로비, PC방, 무인카페, 북카페, 스터디카페처럼 인테리어가 보이는 공간에 놓는 것을 전제로 소개되어 있습니다. 바퀴가 달려 있어 설치 후에도 자리를 옮기기 쉽습니다.</p>' +
        '<p>손님이 없을 때는 화면에 매장에서 만든 홍보 영상이나 공지사항을 띄워 둡니다. 결제는 카드와 모바일 결제이고, 성인인증·실명인증 기능을 추가할 수 있습니다. 재고가 떨어지면 알림이 오고, 시간대별·상품별 판매 데이터를 관리 프로그램과 앱에서 봅니다.</p>'],
      ['크기와 사양은 어떻게 되나요?', 'SPEC'],
      ['냉장과 온장은 어떻게 바꾸나요?',
        '<p>아래 레버로 냉장과 온장을 고른 뒤 온도를 맞추면 그 온도로 동작합니다. 냉장은 2~7℃로 여름용, 온장은 0~30℃로 겨울용입니다.</p>' +
        '<p>쓰는 중에 냉장과 온장을 바꿀 때는 레버를 끄고 <strong>1시간이 지난 뒤</strong> 바꿔야 합니다. 계절이 바뀌는 날에는 판매를 잠시 멈추는 시간을 잡아 두셔야 합니다.</p>'],
      ['어떤 상품을 얼마나 넣을 수 있나요?',
        '<p>기본 6층이고 상품 높이에 따라 8층까지 늘릴 수 있습니다. 한 층에 10개 상품을 진열하며 상품 크기에 맞춰 칸을 조절합니다.</p>' +
        '<p>상품을 꺼내는 방식은 세 가지입니다. 스프링에 상품을 끼워 하나씩 내보내는 스프링 방식, 상품을 밀어 내보내는 소형 푸시 방식, 2L 이상 음료나 큰 상자를 위한 대형 푸시 방식입니다. 소형 푸시는 스프링보다 많은 수를 진열하기에 좋습니다. 코스메틱, 전자기기, 음료, 스낵을 함께 넣을 수 있습니다.</p>' +
        '<p>상품 크기 기준은 세워서 진열하는 스프링 레일이 6.5 × 5 × 12cm, 눕혀서 진열하는 푸시 레일이 20 × 13 × 13cm입니다. 표준 규격 음료는 모두 넣을 수 있지만 <strong>유리병 제품은 넣을 수 없습니다.</strong></p>' +
        '<p>새 상품을 추가할 때는 상품 사진, 바코드(없으면 품번), 한글·영문 상품명, 설명이 필요하고 식품이면 영양성분과 원산지가 더 필요합니다. 운영 중에 상품을 바꿔 트레이를 고치면 상품을 정한 뒤 5영업일 정도 걸립니다.</p>'],
      ['어떤 매장에 맞나요?',
        '<p>업종별 운영 자료가 나와 있는 모델입니다. 업종마다 잘 나가는 상품이 다릅니다.</p>' +
        '<ul class="vm-list">' +
        '<li><a href="' + BASE + '/academy/">학원</a> — 쉬는 시간과 점심시간에 판매가 몰립니다. 적은 용량 과자와 캔음료가 잘 나가고, 방학과 주말에는 판매가 발생하지 않습니다.</li>' +
        '<li><a href="' + BASE + '/retail/">헬스장·골프연습장</a> — 주말 판매 비중이 높고 요일 편차가 큽니다. 프로틴·이온음료·생수가 많이 팔리고, 생수는 가격대를 2~3종으로 나눠 넣어도 각각 팔립니다.</li>' +
        '<li><a href="' + BASE + '/medical/">병원</a> — 안내데스크 일을 덜고 진료 안내 화면으로도 씁니다. 입원실이 있으면 어메니티와 숟가락 같은 생활용품이 잘 나갑니다.</li>' +
        '<li>호텔·리조트 — 수영장이 있는 곳은 튜브·물안경·방수팩, 어린이 칫솔·치약 같은 상품이 잘 나갑니다. 어메니티는 두 가지 수준으로 준비하는 편이 좋습니다.</li>' +
        '</ul>'],
      ['어떤 경우에 다른 모델이 더 맞나요?', 'ALT'],
    ],
    spec: [
      ['본체 크기', '955(W) × 1970(H) × 920(D) mm'],
      ['화면', '23.8인치 터치 화면 (1920×1080)'],
      ['언어', '한국어·영어·중국어·일본어'],
      ['전원 / 소비전력', 'AC 220V 50/60Hz / 434W'],
      ['온도', '냉장 2~7℃ · 온장 0~30℃'],
      ['수납', '기본 6층 (최대 8층) · 층당 10개'],
      ['배출 방식', '스프링 / 소형 푸시 / 대형 푸시'],
      ['배출구', '35 × 18 cm'],
      ['상품 규격', '스프링 레일 6.5×5×12cm (세워서) · 푸시 레일 20×13×13cm (눕혀서)'],
      ['넣을 수 없는 상품', '유리병 제품'],
      ['연결', '확장형 자판기 2대까지 연결'],
      ['관리', '재고 알림·판매 데이터, 관리 프로그램과 앱'],
      ['이동', '바퀴형'],
      ['외관', '흰색 기본, 랩핑으로 색상 변경 · 로고 스티커 가능'],
      ['기타', '모니터 고장 시 문을 여는 수동 도어 장치'],
    ],
    specNote: '자료에 따라 화면을 24인치로 적은 곳도 있습니다. 여기서는 제품 사양표의 23.8인치를 따랐습니다.',
    alt: [
      ['아이스크림·케이크·육류처럼 얼려야 하는 상품', 'frozen-showcase', '이 모델의 온도는 냉장 2~7℃까지라 냉동 상품용이 아닙니다.'],
      ['상품 가짓수가 한 대에 다 들어가지 않는 경우', 'extension', '옆에 확장형을 2대까지 붙여 진열 칸을 늘립니다.'],
      ['냉장이 필요 없는 굿즈·담배·소모품만 파는 좁은 자리', 'goods', '더 작고 냉장·냉동이 없는 가벼운 모델입니다.'],
      ['와인·막걸리 같은 유리병 상품', null, '유리병은 이 모델에 넣을 수 없습니다. 상담 때 다른 방법을 함께 찾아 드립니다.'],
    ],
  },

  'extension': {
    name: '멀티 자판기 확장형',
    short: '메인 자판기 옆에 붙이는 보조기',
    tag: '단독 사용 불가',
    photo: ['model-extension', '왼쪽 스마트 멀티 자판기와 오른쪽 확장형을 붙여 둔 모습'],
    gallery: [
      ['extension-photo', '화면이 있는 메인 자판기 옆에 확장형을 붙여 쓰는 모습', '자료에 실린 설치 사진 · 오른쪽이 확장형'],
    ],
    card: '스마트 멀티 자판기 옆에 붙여 진열량을 늘립니다. 혼자서는 쓸 수 없습니다.',
    lead: '스마트 멀티 자판기 옆에 붙여 진열 칸을 늘리는 보조 자판기입니다. 메인 자판기 없이 혼자서는 쓸 수 없습니다.',
    desc: '멀티 자판기 확장형은 스마트 멀티 자판기에 연결해 쓰는 보조기입니다. 단독으로 쓸 수 없다는 점과 확장형보다 메인 자판기를 늘리는 편이 나은 경우를 정리했습니다.',
    sections: [
      ['멀티 자판기 확장형은 어떤 기계인가요?',
        '<p>스마트 멀티 자판기의 확장 모델로, 진열 칸을 늘려 줍니다. 메인 자판기 한 대에 확장형을 2대까지 연결할 수 있습니다.</p>' +
        '<p>앞면 유리가 넓어서 진열한 상품이 잘 보이고, 같은 상품을 여러 줄 넣어 다량으로 진열하기 좋습니다. 메인 자판기처럼 바퀴가 달려 있고 트레이 칸을 상품에 맞게 바꿀 수 있습니다.</p>'],
      ['확장형만 따로 쓸 수 있나요?',
        '<p>쓸 수 없습니다. 자료에 단독 사용이 안 되는 모델로 나와 있습니다.</p>' +
        '<p>처음 들이실 때는 메인 자판기부터 놓고, 상품 가짓수가 모자랄 때 확장형을 붙이는 순서로 생각하시면 됩니다.</p>'],
      ['크기와 사양은 어떻게 되나요?', 'SPEC'],
      ['어떤 경우에 다른 모델이 더 맞나요?', 'ALT'],
    ],
    spec: [
      ['연결', '스마트 멀티 자판기 1대에 2대까지'],
      ['이동', '바퀴형'],
      ['트레이', '상품 크기에 맞춰 칸 조절'],
    ],
    specNote: '확장형의 본체 크기와 소비전력은 상담 때 실측 자료로 안내해 드립니다.',
    alt: [
      ['자판기를 처음 들이는 경우', 'smart-multi', '확장형은 혼자 쓸 수 없으니 메인 자판기가 먼저 있어야 합니다.'],
      ['학원처럼 쉬는 시간에 손님이 한꺼번에 몰리는 곳', 'smart-multi', '업종별 운영 자료에서 확장형보다 메인 자판기를 여러 대 두는 편이 유리하다고 봅니다.'],
      ['얼려서 파는 상품', 'frozen-showcase', '냉동 상품은 블록형 냉동 쇼케이스가 맞습니다.'],
    ],
  },

  'frozen-showcase': {
    name: '블록형 냉동 쇼케이스 자판기',
    photo: ['model-frozen', '블록형 냉동 쇼케이스 자판기, 칸마다 상품이 든 진열창과 옆에 붙은 화면'],
    gallery: [
      ['frz-mealkit', '가로 3 × 세로 8 배열 칸에 밀키트를 넣은 모습', CAP_PROP],
      ['frz-meat', '큰 칸에 육류를 넣은 모습', CAP_PROP],
      ['frz-store', '무인매장에 냉동 쇼케이스와 스마트 멀티 자판기를 나란히 둔 모습', CAP_PROP],
    ],
    short: '칸마다 잠기는 냉동 자판기',
    tag: '냉동 · 칸별 잠금',
    card: '결제한 칸만 열리는 냉동 쇼케이스입니다. 밀키트·디저트·아이스크림·육류에 맞습니다.',
    lead: '냉동 쇼케이스 안을 작은 블록 칸으로 나누고, 결제한 칸의 문만 열리게 만든 자판기입니다. 손님이 다른 칸 상품은 만질 수 없어서 냉동 식품이나 단가가 높은 상품을 무인으로 팔 때 씁니다.',
    desc: '블록형 냉동 쇼케이스 자판기 높이 2050mm·깊이 750mm, 15.6인치 화면, 온도, 블록 배열별로 맞는 상품과 다른 모델이 나은 경우를 정리했습니다.',
    sections: [
      ['블록형 냉동 쇼케이스 자판기는 어떤 기계인가요?',
        '<p>일반 쇼케이스는 문 하나를 열면 안의 상품을 모두 꺼낼 수 있습니다. 이 모델은 안쪽을 블록 칸으로 나누고 칸마다 잠금장치를 달아서, 결제가 끝난 칸만 자동으로 열립니다. 다른 손님이 만진 상품을 사게 될 걱정이 줄고, 계산하지 않은 상품을 꺼내 갈 수도 없습니다.</p>' +
        '<p>옆에 붙은 15.6인치 화면에서 장바구니에 담아 카드나 모바일로 결제합니다. 한국어·영어·중국어·일본어를 지원하고, 성인인증·실명인증 기능을 추가할 수 있습니다.</p>' +
        '<p>재고와 판매 수량, 온도 변화, 문 열림을 앱에서 확인합니다. 온도와 도어락 원격 조절은 별도 옵션으로 추가할 수 있고, 여러 대의 쇼케이스를 한 화면에서 관리할 수 있습니다. 쇼케이스 상단에 매장 로고를 넣을 수 있습니다.</p>'],
      ['크기와 사양은 어떻게 되나요?', 'SPEC'],
      ['블록 배열별로 어떤 상품이 맞나요?', 'BLOCKS'],
      ['어떤 매장에 맞나요?',
        '<p>칸별 잠금이 필요한 냉동 상품을 무인으로 파는 곳에 맞습니다.</p>' +
        '<ul class="vm-list">' +
        '<li><a href="' + BASE + '/convenience/">무인매장</a> — 스마트 멀티 자판기와 나란히 두고 음료·간식은 멀티 자판기에, 냉동 식품은 쇼케이스에 나눠 넣습니다.</li>' +
        '<li><a href="' + BASE + '/cafe/">케이크·디저트 매장, 아이스크림 판매점</a> — 수제 케이크처럼 픽업이 필요한 상품이나 고급 아이스크림을 칸에 담아 영업시간 밖에도 팝니다.</li>' +
        '<li><a href="' + BASE + '/convenience/">지역 특산물 매장</a> — 곶감 같은 선물용 디저트와 과일 선물세트를 가로 2 × 세로 8 배열(16칸)에 넣습니다.</li>' +
        '<li><a href="' + BASE + '/medical/">애견 시설</a> — 애견유치원에서 수제 간식을 파는 용도로 제안되어 있습니다.</li>' +
        '<li>캠핑장·공원 — 육류나 도시락·피크닉 세트를 파는 용도로 제안되어 있습니다. 실외 설치는 상담 때 전원과 설치 환경을 먼저 확인합니다.</li>' +
        '</ul>'],
      ['어떤 경우에 다른 모델이 더 맞나요?', 'ALT'],
    ],
    spec: [
      ['본체 크기', '높이 2050mm · 깊이 750mm (폭은 상담 때 실측으로 안내)'],
      ['화면', '15.6인치 터치 화면 (1920×1080)'],
      ['전원 / 소비전력', 'AC 220V 50/60Hz / 850W'],
      ['온도', '-22℃ ~ 5℃'],
      ['블록 줄 너비', '503mm (줄 높이 138 / 155 / 155 / 250mm)'],
      ['잠금', '칸별 잠금, 결제한 칸만 열림'],
      ['관리', '재고·판매·온도·문 열림 앱 확인, 온도·도어락 원격 조절(별도 옵션)'],
      ['이동', '바퀴형'],
    ],
    alt: [
      ['음료·과자처럼 얼릴 필요 없는 상품이 대부분인 경우', 'smart-multi', '칸 수가 많고 상품을 섞어 넣기 쉽습니다.'],
      ['겨울에 따뜻한 음료를 팔려는 경우', 'smart-multi', '이 모델은 냉동 전용이고 온장이 없습니다. 스마트 멀티 자판기는 냉장과 온장을 바꿔 씁니다.'],
    ],
  },

  'goods': {
    name: '굿즈·담배 자판기',
    photo: ['model-goods', '노란색 굿즈 자판기 정면'],
    short: '냉장·냉동이 없는 작은 자판기',
    tag: '상온 · 소형',
    card: '냉장·냉동이 없는 작은 모델입니다. 굿즈, 세차수건 같은 상온 상품을 좁은 자리에서 팝니다.',
    lead: '냉장·냉동 기능을 뺀 작은 자판기입니다. 굿즈, 담배, 세차수건처럼 차갑게 둘 필요가 없는 상품을 좁은 자리에서 팔 때 씁니다.',
    desc: '굿즈·담배 자판기는 냉장·냉동이 없는 소형 모델입니다. 맞는 상품, 높이를 올리는 하단 장과 다른 모델이 나은 경우를 정리했습니다.',
    sections: [
      ['굿즈·담배 자판기는 어떤 기계인가요?',
        '<p>냉장·냉동 기능이 없는 가벼운 모델입니다. 굿즈, 담배, 세차수건처럼 상온에 두는 상품에 맞습니다.</p>' +
        '<p>크기가 작아서 좁은 공간에 놓기 쉽습니다. 높이가 더 필요하면 하단에 장을 제작해 받쳐 올릴 수 있습니다.</p>'],
      ['크기와 사양은 어떻게 되나요?', 'SPEC'],
      ['어떤 경우에 다른 모델이 더 맞나요?', 'ALT'],
    ],
    spec: [
      ['냉장·냉동', '없음 (상온)'],
      ['크기', '소형 (좁은 공간용)'],
      ['높이 조절', '하단 장을 제작해 높일 수 있음'],
      ['맞는 상품', '굿즈, 담배, 세차수건'],
    ],
    specNote: '정확한 본체 치수와 소비전력은 상담 때 실측 자료로 안내해 드립니다.',
    alt: [
      ['음료를 차갑게 팔아야 하는 경우', 'smart-multi', '이 모델에는 냉장 기능이 없습니다.'],
      ['아이스크림·냉동 식품', 'frozen-showcase', '냉동이 필요한 상품은 블록형 냉동 쇼케이스가 맞습니다.'],
      ['화면으로 광고나 공지를 내보내고 싶은 경우', 'smart-multi', '23.8인치 화면에 매장 광고와 공지를 띄웁니다.'],
    ],
  },
};

/* 블록 배열 (냉동 쇼케이스). 칸 크기(mm)는 브로슈어와 제안서가 서로 달라 쓰지 않는다. */
const BLOCKS = [
  ['가로 5 × 세로 9', 45, '마카롱, 아이스크림', '작고 고급스러운 디저트'],
  ['가로 3 × 세로 8', 24, '밀키트, 반찬·도시락, 쿠키·샌드', '선물용 제과, 한 끼용 음식'],
  ['가로 2 × 세로 8', 16, '육류, 곶감 같은 과일 선물세트, 롤케이크, 찹쌀떡 아이스크림', '캠핑장, 특산물 매장'],
  ['가로 2 × 세로 5', 10, '요소수, 수제 케이크, 꽃다발, 도시락·피크닉 세트', '주유소, 고급 선물매장'],
];

/* ---------- 렌더링 ---------- */
export const VEND_CSS = `<style>
.vm-subnav{background:#FAFAFA;border-bottom:1px solid #EEE}
.vm-subnav .p-wrap{display:flex;gap:6px;overflow-x:auto;padding-top:10px;padding-bottom:10px;-webkit-overflow-scrolling:touch}
.vm-subnav a{flex-shrink:0;font-size:13px;font-weight:700;color:#555;text-decoration:none;padding:6px 12px;border-radius:999px;border:1px solid #E5E5E5;background:#fff;white-space:nowrap}
.vm-subnav a.on,.vm-subnav a:hover{border-color:#FF5500;color:#FF5500}
.vm-hero{display:grid;grid-template-columns:1fr 240px;gap:32px;align-items:center}
.vm-figure{background:#fff;border:1px solid #EEE;border-radius:14px;padding:16px}
.vm-table{width:100%;border-collapse:collapse;font-size:14.5px;margin:0 0 12px}
.vm-table th,.vm-table td{border-bottom:1px solid #EEE;padding:11px 12px;text-align:left;vertical-align:top;line-height:1.6}
.vm-table th{width:34%;color:#666;font-weight:700;background:#FAFAFA}
.vm-table thead th{background:#1A1A1A;color:#fff;width:auto}
.vm-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
.vm-note{font-size:13px;color:#888;margin:0 0 18px}
.vm-list{margin:0 0 18px;padding-left:20px}.vm-list li{font-size:15px;color:#333;line-height:1.8;margin-bottom:8px}
.vm-list a{color:#FF5500;font-weight:700;text-decoration:none}
.vm-alt{border:2px solid #FF5500;border-radius:14px;padding:20px 22px;background:#FFF8F4}
.vm-alt-title{font-weight:900;font-size:17px;color:#000;margin:0 0 12px;letter-spacing:-0.03em}
.vm-alt-row{padding:12px 0;border-top:1px solid #FFE0D0}
.vm-alt-row:first-of-type{border-top:0}
.vm-alt-case{font-weight:800;color:#000;font-size:15px;margin-bottom:4px}
.vm-alt-why{font-size:14px;color:#555;line-height:1.7}
.vm-alt-why a{color:#FF5500;font-weight:800;text-decoration:none}
.vm-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:12px}
.vm-card{display:flex;flex-direction:column;gap:8px;border:1px solid #EEE;border-radius:14px;padding:16px;text-decoration:none;color:inherit;background:#fff;transition:border-color .15s}
.vm-card:hover{border-color:#FF5500}
.vm-card-fig{background:#FAFAFA;border-radius:10px;padding:10px;display:flex;justify-content:center}
.vm-card-fig svg{max-width:110px}
.vm-card-tag{font-size:11px;font-weight:800;color:#FF5500;letter-spacing:0.02em}
.vm-card-name{font-size:16px;font-weight:900;color:#000;letter-spacing:-0.03em}
.vm-card-desc{font-size:13px;color:#666;line-height:1.6}
.vm-reco{border:1px solid #EEE;border-radius:14px;padding:4px 20px;margin:0 0 18px}
.vm-reco-row{display:flex;gap:14px;padding:14px 0;border-top:1px solid #F0F0F0}
.vm-reco-row:first-child{border-top:0}
.vm-reco-k{flex-shrink:0;width:180px;word-break:keep-all;font-weight:800;color:#000;font-size:14px}
.vm-reco-v{font-size:14px;color:#444;line-height:1.7}
.vm-reco-v a{color:#FF5500;font-weight:800;text-decoration:none}
.vm-figure img{width:100%;height:auto;display:block;border-radius:10px}
.vm-gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:14px;margin:6px 0 18px}
.vm-gallery figure,.vm-wide{margin:0}.vm-gallery img,.vm-wide img{width:100%;height:auto;display:block;border-radius:10px;background:#F5F5F5}
.vm-gallery figcaption,.vm-wide figcaption{font-size:12.5px;color:#888;margin-top:6px;line-height:1.5}
.vm-wide{margin:6px 0 18px}
.vm-card-photo{width:100%;height:auto;aspect-ratio:4/3;object-fit:cover;display:block;border-radius:10px;background:#FAFAFA}
.vm-card-photo.fit{object-fit:contain;background:#fff}
@media(max-width:768px){.vm-hero{grid-template-columns:1fr}.vm-figure{max-width:240px}.vm-reco-row{flex-direction:column;gap:4px}.vm-reco-k{width:auto}.vm-table{font-size:13.5px}}
</style>`;

const modelUrl = (k) => `${BASE}/models/${k}/`;
const link = (k) => `<a href="${modelUrl(k)}">${VEND_MODELS[k].name}</a>`;

/* 자판기 페이지 상단 모델 바로가기 (허브·업종 묶음·모델 페이지 공통) */
export function vendSubnav(active) {
  return `<nav class="vm-subnav" aria-label="자판기 모델"><div class="p-wrap">` +
    `<a href="${BASE}/"${active === 'hub' ? ' class="on"' : ''}>자판기 전체</a>` +
    VEND_MODEL_ORDER.map(k => `<a href="${modelUrl(k)}"${active === k ? ' class="on"' : ''}>${VEND_MODELS[k].name}</a>`).join('') +
    `<a href="${BASE}/#industries"${active === 'industry' ? ' class="on"' : ''}>업종별 자판기</a>` +
    `</div></nav>`;
}

const specTable = (rows) =>
  `<div class="vm-scroll"><table class="vm-table"><tbody>${rows.map(([k, v]) => `<tr><th scope="row">${k}</th><td>${v}</td></tr>`).join('')}</tbody></table></div>`;

const blocksTable = () =>
  `<p>칸 배열은 상품 크기에 맞춰 네 가지 중에서 고르고, 줄마다 다른 배열을 섞을 수도 있습니다. 칸 수는 한 대를 같은 배열로 채웠을 때 기준입니다.</p>` +
  `<div class="vm-scroll"><table class="vm-table"><thead><tr><th>배열</th><th>칸 수</th><th>맞는 상품</th><th>자료의 추천 용도</th></tr></thead><tbody>` +
  BLOCKS.map(b => `<tr><td>${b[0]}</td><td>${b[1]}칸</td><td>${b[2]}</td><td>${b[3]}</td></tr>`).join('') +
  `</tbody></table></div><p class="vm-note">작은 칸과 큰 칸을 섞은 혼합 구성도 됩니다. 칸의 정확한 치수는 자료마다 달라 상담 때 실측으로 안내합니다. 넣으실 상품의 실제 크기를 알려 주시면 배열을 맞춰 드립니다.</p>`;

function altBlock(m) {
  return `<div class="vm-alt"><p class="vm-alt-title">이런 경우엔 다른 모델이 낫습니다</p>` +
    m.alt.map(([when, k, why]) =>
      `<div class="vm-alt-row"><div class="vm-alt-case">${when}</div><div class="vm-alt-why">${k ? `→ ${link(k)}. ` : ''}${why}</div></div>`).join('') +
    `</div>`;
}

export function vendModelCards(exclude) {
  return `<div class="vm-cards">` + VEND_MODEL_ORDER.filter(k => k !== exclude).map(k => {
    const m = VEND_MODELS[k];
    return `<a class="vm-card" href="${modelUrl(k)}">${m.photo ? imgTag(m.photo[0], m.photo[1], 'vm-card-photo fit') : `<div class="vm-card-fig">${SVG[k]}</div>`}<div class="vm-card-tag">${m.tag}</div><div class="vm-card-name">${m.name}</div><div class="vm-card-desc">${m.card}</div></a>`;
  }).join('') + `</div>`;
}

/* 허브(/products/vending-machine/)에 넣는 모델 안내 */
export function vendHubModelsHtml() {
  const pick = [
    ['음료·과자·잡화를 섞어서', `${link('smart-multi')} — 기본형. 냉장 2~7℃와 온장 0~30℃를 바꿔 쓰고, 상품이 늘면 ${link('extension')}을 옆에 붙입니다.`],
    ['얼려서 파는 상품', `${link('frozen-showcase')} — 결제한 칸만 열립니다.`],
    ['차갑게 둘 필요 없는 상품', `${link('goods')} — 작고 냉장·냉동이 없습니다.`],
  ];
  return `<section class="p-section" id="models"><div class="p-wrap">` +
    `<h2>어떤 자판기를 골라야 하나요?</h2>` +
    `<p>가장 먼저 정할 것은 상품을 어떤 온도로 둘지입니다. 그다음이 상품 가짓수와 놓을 자리의 크기입니다.</p>` +
    `<div class="vm-reco">${pick.map(([k, v]) => `<div class="vm-reco-row"><div class="vm-reco-k">${k}</div><div class="vm-reco-v">${v}</div></div>`).join('')}</div>` +
    vendModelCards() +
    `</div></section>` +
    `<section class="p-section" id="industries"><div class="p-wrap"><h2>업종별로는 어떤 자판기를 쓰나요?</h2>` +
    `<p>자료에 운영 특성이나 설치 제안이 있는 업종만 모았습니다. 업종마다 맞는 모델과 잘 나가는 상품이 다릅니다.</p>` +
    vendIndustryCards() +
    `</div></section>`;
}

/* 업종 묶음 페이지(/products/vending-machine/<묶음>/)에 넣는 모델 추천 단락 */
const MACRO_RECO = {
  restaurant: ['음식점에는 어떤 자판기가 맞나요?',
    '<p>밀키트, 반찬, 도시락처럼 포장해 둔 상품은 ' + 'LINK:frozen-showcase' + '의 가로 3 × 세로 8 배열(한 대 24칸)에 넣는 구성이 제안되어 있습니다. 결제한 칸만 열려서 다른 상품에 손이 닿지 않습니다.</p>'],
  cafe: ['카페·베이커리에는 어떤 자판기가 맞나요?',
    '<p>무인카페·북카페·스터디카페처럼 인테리어가 드러나는 공간에는 화면 광고를 겸하는 ' + 'LINK:smart-multi' + '가 제안되어 있습니다.</p>' +
    '<p>케이크·디저트 매장과 아이스크림 판매점에는 ' + 'LINK:frozen-showcase' + '가 제안되어 있습니다. 수제 케이크처럼 픽업이 필요한 상품을 칸에 담아 두고, 아이스크림은 묶음이나 낱개로 팝니다. 마카롱 같은 작은 디저트는 가로 5 × 세로 9 배열(45칸), 수제 케이크는 가로 2 × 세로 5 배열(10칸)에 넣습니다.</p>'],
  convenience: ['편의점·무인매장에는 어떤 자판기가 맞나요?',
    '<p>무인매장은 ' + 'LINK:smart-multi' + '와 ' + 'LINK:frozen-showcase' + '를 나란히 두는 구성이 제안되어 있습니다. 음료·과자·생활용품은 멀티 자판기에, 냉동 식품과 육류는 쇼케이스에 나눠 넣습니다. 상품 가짓수가 많으면 멀티 자판기에 ' + 'LINK:extension' + '을 2대까지 붙입니다.</p>' +
    '<p>지역 특산물 매장은 곶감 같은 선물용 디저트와 과일 선물세트를 쇼케이스의 가로 2 × 세로 8 배열(16칸)에 넣는 구성이 제안되어 있습니다.</p>'],
  medical: ['병원·약국에는 어떤 자판기가 맞나요?',
    '<p>병원과 치과에는 ' + 'LINK:smart-multi' + '가 설치된 사례가 여럿 있습니다. 음료와 간식을 파는 것 말고도, 화면을 진료 안내나 홍보 게시판으로 쓰고 안내데스크 일을 덜어 주는 용도로 씁니다. 입원실이 있는 병원에서는 어메니티와 숟가락 같은 생활용품이 잘 나갑니다.</p>' +
    '<p>병원마다 진료 과목에 맞는 상품을 따로 넣는 경우가 많아서, 트레이 칸을 상품 크기에 맞춰 바꿀 수 있는 점이 중요합니다.</p>'],
  academy: ['학원에는 어떤 자판기가 맞나요?',
    '<p>학교·학원 운영 자료가 정리되어 있는 모델은 ' + 'LINK:smart-multi' + '입니다. 쉬는 시간 10분과 점심시간 50분에 판매가 몰리고, 방학과 토·일요일에는 판매가 발생하지 않습니다. 맛이 자극적이고 용량이 적은 과자와 젤리, 캔음료가 잘 나가고, 유행하는 상품으로 빨리 바꿔 줄수록 판매가 오릅니다.</p>' +
    '<p>' + 'LINK:extension' + '을 붙이기보다 메인 자판기를 여러 대 두는 편이 유리하다고 자료에 나와 있습니다.</p>'],
  retail: ['헬스장·골프장에는 어떤 자판기가 맞나요?',
    '<p>피트니스센터, 골프장, 골프연습장에는 ' + 'LINK:smart-multi' + '가 설치된 사례가 있습니다. 주말 판매 비중이 높고 평일과의 차이가 큽니다. 프로틴 음료와 에너지 음료의 비중이 높고, 생수는 고가와 저가로 2~3종을 넣어도 각각 팔립니다.</p>'],
  service: ['주유소에는 어떤 자판기가 맞나요?',
    '<p>주유소에서는 ' + 'LINK:frozen-showcase' + '를 요소수 전용 자판기로 쓰는 구성이 제안되어 있습니다. 온도에 민감하고 단가가 높은 요소수를 칸별 잠금으로 보관해 팝니다.</p>'],
  etc: ['그 밖의 업종에는 어떤 자판기가 맞나요?',
    '<p>이 묶음의 업종은 자판기 설치 자료가 따로 없어서, 파실 상품의 온도로 모델을 고르시면 됩니다. 음료와 간식을 섞어 넣으면 ' + 'LINK:smart-multi' + ', 상온 소모품만 두면 ' + 'LINK:goods' + ', 얼려서 파는 상품이면 ' + 'LINK:frozen-showcase' + '입니다.</p>'],
};

export function vendMacroRecoHtml(macro) {
  const r = MACRO_RECO[macro];
  if (!r) return '';
  const body = r[1].replace(/LINK:([a-z-]+)/g, (_, k) => link(k));
  return `<section class="p-section"><div class="p-wrap"><h2>${r[0]}</h2>${body}${vendMacroIndustryLinks(macro)}${vendModelCards()}</div></section>`;
}

/* 모델 페이지 전체 */
export function vendModelPage(k, ctx) {
  const m = VEND_MODELS[k];
  if (!m) return null;
  const { css, header, footer, siteHead, host } = ctx;
  const canon = `https://${host}${modelUrl(k)}`;
  const title = `${m.name} — 크기·사양·맞는 매장 | 더세이브스토어`;
  const body = m.sections.map(([h2, html]) => {
    let inner = html;
    if (html === 'SPEC') inner = specTable(m.spec) + (m.specNote ? `<p class="vm-note">${m.specNote}</p>` : '');
    else if (html === 'BLOCKS') inner = blocksTable();
    else if (html === 'ALT') inner = altBlock(m);
    return `<section class="p-section"><div class="p-wrap"><h2>${h2}</h2>${inner}</div></section>`;
  }).join('');
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: '홈', item: `https://${host}/` },
        { '@type': 'ListItem', position: 2, name: '자동판매기', item: `https://${host}${BASE}/` },
        { '@type': 'ListItem', position: 3, name: m.name, item: canon },
      ] },
      { '@type': 'Product', name: m.name, description: m.desc, category: '자동판매기', ...(m.photo ? { image: imgUrl(m.photo[0]) } : {}) },
    ],
  });
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${title}</title>${siteHead}` +
    `<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${m.desc}">` +
    `<link rel="canonical" href="${canon}"><meta property="og:title" content="${title}"><meta property="og:description" content="${m.desc}">` +
    `<meta property="og:type" content="website"><meta property="og:url" content="${canon}">${m.photo ? `<meta property="og:image" content="${imgUrl(m.photo[0])}">` : ''}` +
    `<script type="application/ld+json">${jsonLd}</script>${css}${VEND_CSS}</head><body>${header}${vendSubnav(k)}` +
    `<section class="p-hero"><div class="p-wrap"><div class="p-crumb"><a href="/">홈</a> · <a href="${BASE}/">자동판매기</a> · <span style="color:#000;font-weight:700">${m.name}</span></div>` +
    `<div class="vm-hero"><div><div class="p-tag">${m.tag}</div><h1 class="p-h1">${m.name}</h1><p class="p-lead">${m.lead}</p>` +
    `<a href="tel:010-9677-2356" class="p-cta">설치 상담 010-9677-2356</a></div><div class="vm-figure">${m.photo ? imgTag(m.photo[0], m.photo[1], '', true) : SVG[k]}</div></div></div></section>` +
    body +
    (m.gallery ? `<section class="p-section"><div class="p-wrap"><h2>실제로 놓으면 어떤 모습인가요?</h2>${gallery(m.gallery)}</div></section>` : '') +
    vendModelIndustriesHtml(k) +
    `<section class="p-section"><div class="p-wrap"><h2>다른 자판기 모델도 비교해 볼까요?</h2>${vendModelCards(k)}</div></section>` +
    footer + `</body></html>`;
}

export const VEND_MODEL_URLS = VEND_MODEL_ORDER.map(modelUrl);

/* ======================================================================
 * 업종별 자판기 페이지 — /products/vending-machine/industry/<업종>/
 *
 * 근거가 있는 업종만 만든다.
 *  - 스마트 멀티: 업종별추천리스트 (학교/학원 p6–11, 스포츠/위락시설 p12–17,
 *    호텔/리조트 p18–23, 병원 p24–26, 무인카페·커뮤니티 p27–28) + 홈타운 브로슈어 2쪽(공간 제안)
 *  - 냉동 쇼케이스: 냉동 제안서 설치 제안 p12–14, 기대효과 p15
 * 판매순위의 상품 브랜드명은 일반 품목명으로 바꿔 쓴다. 설치 장소 이름은 쓰지 않는다.
 * 문화시설(p29)은 사진뿐이라, 와인·막걸리 매장(냉동 p14)은 주류라 만들지 않았다.
 * ====================================================================== */
const SRC_NOTE = '<p class="vm-note">이 페이지의 운영 특성과 판매 순위는 제조사의 업종별 운영 자료를 옮긴 것입니다. 매장마다 결과는 다를 수 있습니다.</p>';
const FRZ_NOTE = '<p class="vm-note">이 페이지의 활용 방법은 제조사의 냉동 쇼케이스 설치 제안 자료를 옮긴 것입니다. 실제 설치 사례가 아니라 제안입니다.</p>';
const ol = (items) => `<ol class="vm-list">${items.map(x => `<li>${x}</li>`).join('')}</ol>`;
const ul = (items) => `<ul class="vm-list">${items.map(x => `<li>${x}</li>`).join('')}</ul>`;

export const VEND_INDUSTRY_ORDER = ['school', 'sports', 'hotel', 'hospital', 'cafe-community', 'unmanned-store', 'dessert', 'specialty', 'camping', 'pet', 'gas-station'];

export const VEND_INDUSTRIES = {
  'school': {
    photos: [['school-1','학교 복도에 스마트 멀티 자판기와 다른 자판기를 함께 둔 모습','자료에 실린 학교 설치 사진'],['school-2','스마트 멀티 자판기 두 대를 나란히 둔 모습','자료에 실린 학교 설치 사진'],['school-3','넓은 휴게 공간에 스마트 멀티 자판기 두 대를 둔 모습','자료에 실린 학교 설치 사진']],
    name: '학교·학원 자판기',
    tag: '스마트 멀티 · 운영 자료 있음',
    card: '쉬는 시간 10분과 점심시간에 판매가 몰립니다. 자극적인 맛, 적은 용량이 잘 나갑니다.',
    lead: '학교와 학원은 쉬는 시간과 점심시간에 판매가 짧게 몰리는 곳입니다. 자판기 운영 자료에 정리된 판매 시간대, 잘 나가는 상품, 대수 정하는 법을 옮겼습니다.',
    desc: '학교·학원 자판기 운영 자료: 쉬는 시간 10분·점심시간 50분 판매 집중, 방학·주말 판매 없음, 자극적인 맛·적은 용량 상품, 확장형보다 메인 자판기 여러 대.',
    models: ['smart-multi'],
    sections: [
      ['학교·학원에는 어떤 자판기가 맞나요?',
        '<p>자료의 학교·학원 설치 사진은 모두 LINK:smart-multi입니다. 두 대를 나란히 둔 곳이 여러 곳 있습니다.</p>' +
        '<p>트레이 칸을 상품 크기에 맞춰 바꿀 수 있어서 과자, 젤리, 캔·팩 음료를 한 대에 섞어 넣습니다.</p>'],
      ['언제 많이 팔리나요?',
        '<p>쉬는 시간 10분과 점심시간 50분에 판매가 짧고 굵게 몰립니다.</p>' +
        '<p>반대로 방학과 토요일·일요일에는 판매가 발생하지 않는다고 자료에 나와 있습니다. 운영 계획을 세울 때 이 기간을 빼고 보셔야 합니다.</p>'],
      ['어떤 상품이 잘 나가나요?',
        '<p>자료가 꼽은 기준은 두 가지입니다. <strong>자극적인 맛</strong>과 <strong>적은 용량</strong>입니다.</p>' +
        '<p>판매 순위 위쪽에는 매운맛 과자, 초콜릿 과자, 감자 과자, 팩 초코우유가 올라 있습니다. 막대 과자, 샌드 쿠키, 감자칩이 그 뒤를 잇습니다.</p>' +
        '<p>추천 트레이 구성은 위 칸에 초콜릿·껌·사탕·젤리·소시지 간식·막대 과자를, 아래 칸에 이온음료·탄산음료·과즙 음료·팩 음료를 넣는 방식입니다.</p>' +
        'IMG:tray-school|학교 추천 트레이 구성 그림. 위 칸에 과자와 젤리, 아래 칸에 캔·팩 음료|자료의 학교 추천 트레이 구성|' +
        '<p>유행하는 상품으로 빨리 바꿔 줄수록 판매가 크게 오를 수 있다고 자료에 나와 있습니다. 상품을 바꿀 때 트레이 수정에는 상품을 정한 뒤 5영업일 정도 걸립니다.</p>'],
      ['확장형을 붙이는 게 나을까요, 자판기를 한 대 더 두는 게 나을까요?',
        '<p>자료에는 학교·학원에서 LINK:extension을 붙이는 것보다 메인 자판기를 여러 대 설치하는 편이 유리하다고 나와 있습니다.</p>'],
    ],
    note: SRC_NOTE,
  },

  'sports': {
    photos: [['sports-1','실내 시설에 스마트 멀티 자판기를 둔 모습','자료에 실린 스포츠·위락시설 설치 사진'],['sports-2','나무 바닥 공간에 둔 스마트 멀티 자판기','자료에 실린 스포츠·위락시설 설치 사진'],['sports-3','메인 자판기 옆에 확장형을 붙여 둔 모습','자료에 실린 스포츠·위락시설 설치 사진 · 오른쪽이 확장형']],
    name: '헬스장·골프장 자판기',
    tag: '스마트 멀티 · 운영 자료 있음',
    card: '주말 판매 비중이 높습니다. 프로틴·에너지 음료와 이온음료, 생수가 잘 나갑니다.',
    lead: '피트니스센터, 스포츠센터, 골프장, 골프연습장처럼 운동하는 곳의 자판기 운영 자료를 옮겼습니다. 요일별 판매 차이와 잘 나가는 상품을 정리했습니다.',
    desc: '헬스장·골프장 자판기 운영 자료: 주말 판매 비중이 높고 요일 편차가 큼, 프로틴·에너지 음료 비중, 생수 2~3종, 판매 순위와 추천 트레이.',
    models: ['smart-multi'],
    sections: [
      ['헬스장·골프장에는 어떤 자판기가 맞나요?',
        '<p>자료의 스포츠·위락시설 설치 사진은 스포츠센터, 골프장, 골프리조트, 피트니스, 연습장, 플레이카페이고, 모두 LINK:smart-multi입니다.</p>'],
      ['언제 많이 팔리나요?',
        '<p>주말 판매 비율이 매우 높습니다. 평일 판매는 적은 편이라 요일에 따른 차이가 큽니다.</p>'],
      ['어떤 상품이 잘 나가나요?',
        '<p>프로틴 음료와 에너지 음료의 비중이 높습니다. 자료의 한 줄 요약은 "탄산보다는 이온"입니다.</p>' +
        '<p>생수는 고가와 저가로 2~3종을 함께 넣어도 각각 판매가 일어납니다.</p>' +
        '<p>판매 순위는 이렇습니다.</p>' +
        ol(['캔맥주', '초코맛 단백질 음료', '저렴한 생수', '이온음료', '옥수수수염차', '컵라면', '에너지 음료', '땅콩 과자', '프로틴 음료', '보리 탄산음료']) +
        '<p>추천 트레이에는 컵라면과 땅콩·오징어 과자, 단백질 음료, 이온음료, 캔커피와 병커피, 아이스티, 에너지 음료, 생수가 들어갑니다.</p>' +
        'IMG:tray-sports|스포츠시설 추천 트레이 구성 그림. 컵라면과 과자, 단백질 음료, 커피, 이온음료, 생수|자료의 스포츠·위락시설 추천 트레이 구성|'],
      ['맥주도 넣을 수 있나요?',
        '<p>자료에는 성인인증 기능을 추가하고 캔맥주를 팔 경우 판매 상승폭이 크다고 나와 있습니다. 판매 순위 1위도 캔맥주입니다.</p>' +
        '<p>성인인증은 기본 기능이 아니라 추가하는 기능입니다. 넣으실 수 있는지는 설치 장소 조건과 함께 상담 때 확인합니다.</p>'],
    ],
    note: SRC_NOTE,
  },

  'hotel': {
    photos: [['hotel-1','창가에 둔 스마트 멀티 자판기','자료에 실린 호텔·리조트 설치 사진']],
    name: '호텔·리조트 자판기',
    tag: '스마트 멀티 · 운영 자료 있음',
    card: '수영장이 있으면 판매가 크게 늘어납니다. 튜브·물안경, 방수용품, 어린이 칫솔이 잘 나갑니다.',
    lead: '호텔과 리조트의 자판기 운영 자료를 옮겼습니다. 수영장 유무에 따른 판매 차이, 판매 순위, 어메니티 준비 방법을 정리했습니다.',
    desc: '호텔·리조트 자판기 운영 자료: 수영장이 있으면 판매 급상승, 튜브·물안경·머리끈·방수기저귀 판매 순위, 어메니티 2가지 수준, 어린이 칫솔·치약.',
    models: ['smart-multi'],
    sections: [
      ['호텔·리조트에는 어떤 자판기가 맞나요?',
        '<p>자료의 호텔·리조트 설치 사진은 모두 LINK:smart-multi입니다. 호텔·리조트 로고를 상단에 넣거나 바디 색을 바꾼 사례 사진도 있습니다.</p>' +
        '<p>트레이 칸을 바꿀 수 있어서 음료·간식과 어메니티, 수영용품을 한 대에 섞어 넣습니다.</p>'],
      ['수영장이 있으면 무엇이 달라지나요?',
        '<p>수영장이 포함된 객실이면 판매가 훨씬 높다고 자료에 나와 있습니다. 판매 순위 1위도 튜브·물안경입니다.</p>'],
      ['어떤 상품이 잘 나가나요?',
        '<p>판매 순위는 이렇습니다.</p>' +
        ol(['튜브, 물안경', '머리끈', '방수기저귀', '방수파우치', '컵라면', '간단 간식류', '썬크림', '막대 과자', '아동용 치약', '보리차']) +
        '<p>어린이 칫솔과 치약은 꾸준히 팔리는 상품으로 꼽혀 있습니다.</p>'],
      ['어메니티는 어떻게 준비하나요?',
        '<p>어메니티는 2가지 수준으로 준비하는 게 좋다고 자료에 나와 있습니다.</p>' +
        '<p>성인인증 기능을 추가하고 캔맥주를 팔면 판매에 도움이 된다는 내용도 있습니다. 성인용품은 호텔이 있는 상권에 따라 판매 성과가 다르다고 적혀 있습니다.</p>'],
    ],
    note: SRC_NOTE,
  },

  'hospital': {
    photos: [['hospital-1','병원 대기 공간에 둔 스마트 멀티 자판기','자료에 실린 병원 설치 사진'],['hospital-2','벽면 공간에 맞춰 둔 스마트 멀티 자판기','자료에 실린 병원 설치 사진'],['hospital-3','복도에 둔 스마트 멀티 자판기','자료에 실린 병원 설치 사진']],
    name: '병원·치과 자판기',
    tag: '스마트 멀티 · 운영 자료 있음',
    card: '안내데스크 일을 덜고 화면을 진료 안내로 씁니다. 입원실이 있으면 어메니티가 잘 나갑니다.',
    lead: '병원에서는 자판기를 음료·간식 판매 말고도 안내데스크 일을 덜고 진료 안내 화면으로 쓰는 용도로 둡니다. 자판기 운영 자료에 정리된 병원 활용 방법을 옮겼습니다.',
    desc: '병원·치과 자판기 운영 자료: 병원별 특화 상품, 안내데스크 인력 절감, 홍보게시판·진료안내 화면, 인건비 없는 부가수익, 입원실 어메니티·숟가락.',
    models: ['smart-multi'],
    sections: [
      ['병원·치과에는 어떤 자판기가 맞나요?',
        '<p>자료의 병원 설치 사진은 여러 병원과 치과 한 곳이고, 모두 LINK:smart-multi입니다.</p>'],
      ['판매 말고 어떤 용도로 쓰나요?',
        '<p>자료에 나온 병원 활용 방법은 세 가지입니다.</p>' +
        ul(['안내데스크 인력을 줄이는 방향으로 활용합니다.', '화면을 홍보 게시판이나 진료 안내에 씁니다.', '인건비가 들지 않는 부가 수익으로 운영합니다.'])],
      ['어떤 상품을 넣나요?',
        '<p>병원마다 그 병원에서 특징적으로 팔리는 물품을 넣는 경우가 많습니다. 트레이 칸을 상품 크기에 맞춰 바꿀 수 있어서 이런 구성이 가능합니다.</p>' +
        '<p>입원실이 있는 병원은 어메니티나 숟가락 같은 생활용품이 잘 나간다고 자료에 나와 있습니다.</p>'],
    ],
    note: SRC_NOTE,
  },

  'cafe-community': {
    photos: [['cafe-1','무인카페에 둔 베이지색 스마트 멀티 자판기','자료에 실린 무인카페 설치 사진'],['cafe-2','무인카페에 스마트 멀티 자판기 두 대를 나란히 둔 모습','자료에 실린 무인카페 설치 사진'],['cafe-3','커뮤니티카페에 둔 스마트 멀티 자판기','자료에 실린 커뮤니티카페 설치 사진']],
    name: '무인카페·커뮤니티카페 자판기',
    tag: '스마트 멀티 · 설치 사진 있음',
    card: '인테리어가 보이는 공간용 곡선형 흰색 자판기입니다. 무인카페와 커뮤니티카페 설치 사진이 있습니다.',
    lead: '무인카페와 커뮤니티카페, 북카페, 스터디카페처럼 인테리어가 보이는 공간에 두는 자판기입니다. 자료에는 이 업종의 설치 사진과 공간 제안이 있습니다.',
    desc: '무인카페·커뮤니티카페 자판기: 곡선형 흰색 디자인, 로비·PC방·북카페·스터디카페 공간 제안, 무인카페 2대 설치 사진, 화면 광고.',
    models: ['smart-multi'],
    sections: [
      ['무인카페·커뮤니티카페에는 어떤 자판기가 맞나요?',
        '<p>자료의 무인카페·커뮤니티카페 설치 사진은 모두 LINK:smart-multi입니다. 한 무인카페에는 두 대를 나란히 두었고, 다른 무인기 옆에 함께 둔 사진도 있습니다.</p>' +
        '<p>제품 브로슈어에는 곡선형 흰색 디자인이 로비, PC방, 무인카페, 북카페, 스터디카페 같은 공간에 어울리도록 만들어졌다고 소개되어 있습니다.</p>'],
      ['화면은 어떻게 쓰나요?',
        '<p>23.8인치 화면에서 상품을 고르고 결제하고, 손님이 없을 때는 매장 공지사항이나 광고를 띄워 둡니다. 바디 색상은 랩핑으로 바꾸고 로고 스티커를 붙일 수 있습니다.</p>'],
      ['어떤 상품이 잘 나가는지 자료가 있나요?',
        '<p>무인카페·커뮤니티 업종은 자료에 설치 사진만 있고, 판매 순위나 운영 특성은 따로 정리되어 있지 않습니다.</p>' +
        '<p>상품 구성은 넣으실 상품의 크기와 온도를 보고 상담 때 함께 정합니다. 유리병 제품은 넣을 수 없습니다.</p>'],
    ],
    note: '',
  },

  'unmanned-store': {
    photos: [['frz-store','무인매장에 냉동 쇼케이스와 스마트 멀티 자판기를 나란히 둔 모습',CAP_PROP]],
    name: '무인매장 자판기',
    tag: '스마트 멀티 + 냉동 쇼케이스',
    card: '스마트 멀티 자판기와 냉동 쇼케이스를 나란히 두는 구성입니다. 결제한 칸만 열립니다.',
    lead: '무인매장에는 음료·과자를 파는 스마트 멀티 자판기와 냉동 식품을 파는 블록형 냉동 쇼케이스를 나란히 두는 구성이 제안되어 있습니다.',
    desc: '무인매장 자판기 구성: 스마트 멀티 자판기와 블록형 냉동 쇼케이스를 함께 두는 제안, 24시간 운영, 실시간 재고 확인, 칸별 잠금.',
    models: ['smart-multi', 'frozen-showcase', 'extension'],
    sections: [
      ['무인매장에는 어떤 자판기가 맞나요?',
        '<p>냉동 쇼케이스 설치 제안 자료에는 무인매장을 LINK:smart-multi와 LINK:frozen-showcase로 함께 구성하는 그림이 있습니다.</p>' +
        '<p>음료·과자·생활용품은 멀티 자판기에, 냉동 식품과 육류는 쇼케이스에 나눠 넣습니다. 상품 가짓수가 많으면 멀티 자판기에 LINK:extension을 2대까지 붙입니다.</p>'],
      ['냉동 쇼케이스를 두면 무엇이 좋은가요?',
        '<p>자료에 나온 기대 효과는 네 가지입니다.</p>' +
        ul(['칸별 잠금이라 위생과 도난 걱정 없이 팝니다.', '24시간 운영할 수 있어 공동구매가 마감된 뒤에도 매장을 운영합니다.', '재고를 실시간으로 파악합니다.', '결제 시스템으로 야간 인력을 줄입니다.']) +
        '<p>재고와 판매 수량, 온도 변화, 문 열림은 앱에서 확인합니다.</p>'],
    ],
    note: FRZ_NOTE,
  },

  'dessert': {
    photos: [['frz-cake','칸마다 케이크를 넣은 냉동 쇼케이스',CAP_PROP],['frz-icecream','칸마다 아이스크림을 넣은 냉동 쇼케이스',CAP_PROP]],
    name: '케이크·디저트·아이스크림 매장 자판기',
    tag: '냉동 쇼케이스 · 픽업박스',
    card: '수제 케이크 픽업과 고급 아이스크림 판매에 칸별 잠금 냉동 쇼케이스를 씁니다.',
    lead: '케이크·디저트 매장과 아이스크림 판매점에는 결제한 칸만 열리는 블록형 냉동 쇼케이스를 픽업박스나 판매대로 쓰는 방법이 제안되어 있습니다.',
    desc: '케이크·디저트·아이스크림 매장 자판기: 수제 케이크 픽업박스, 아이스크림 묶음·낱개 판매, 블록 배열별 맞는 디저트, 냉동 -22~5℃.',
    models: ['frozen-showcase'],
    sections: [
      ['케이크·디저트 매장에는 어떤 자판기가 맞나요?',
        '<p>수제 케이크나 디저트처럼 픽업 서비스가 필요한 매장에 LINK:frozen-showcase를 안전한 픽업박스로 쓰는 방법이 제안되어 있습니다. 결제한 칸만 열립니다.</p>'],
      ['아이스크림 판매점에서는 어떻게 쓰나요?',
        '<p>아이스크림을 묶음이나 낱개로 팝니다. 이미 운영 중인 무인 아이스크림 매장에 고급 아이스크림 자판기로 추가하는 방법도 제안되어 있습니다.</p>' +
        '<p>온도는 -22℃부터 5℃까지 맞춥니다.</p>'],
      ['디저트마다 어떤 칸 배열이 맞나요?',
        ul(['가로 5 × 세로 9 배열(45칸): 마카롱, 아이스크림처럼 작고 고급스러운 디저트', '가로 3 × 세로 8 배열(24칸): 쿠키·샌드, 선물용 제과', '가로 2 × 세로 8 배열(16칸): 롤케이크, 찹쌀떡 아이스크림', '가로 2 × 세로 5 배열(10칸): 수제 케이크']) +
        '<p>한 대 안에서 배열을 섞을 수 있습니다. 칸의 정확한 치수는 상담 때 실측으로 안내합니다.</p>'],
    ],
    note: FRZ_NOTE,
  },

  'specialty': {
    photos: [['frz-specialty','칸마다 선물용 특산물을 넣은 냉동 쇼케이스',CAP_PROP]],
    name: '지역 특산물 매장 자판기',
    tag: '냉동 쇼케이스 · 선물용',
    card: '곶감 같은 특산물과 선물용 디저트를 칸별 잠금 쇼케이스에 넣어 팝니다.',
    lead: '지자체가 운영하는 특산물 매장에서 선물용 디저트와 곶감 같은 특산물을 블록형 냉동 쇼케이스로 파는 방법이 제안되어 있습니다.',
    desc: '지역 특산물 매장 자판기: 곶감 등 특산물과 선물용 디저트, 과일 선물세트를 가로 2 × 세로 8 배열에 넣는 블록형 냉동 쇼케이스 제안.',
    models: ['frozen-showcase'],
    sections: [
      ['특산물 매장에는 어떤 자판기가 맞나요?',
        '<p>지자체에서 운영하는 선물용 디저트, 곶감 같은 특산물 자판기로 LINK:frozen-showcase를 쓰는 방법이 제안되어 있습니다.</p>'],
      ['어떤 칸 배열에 넣나요?',
        '<p>곶감 같은 과일 선물세트는 가로 2 × 세로 8 배열(16칸)에 넣는 것으로 제안되어 있습니다. 이 배열은 자료에서 특산물 매장에 추천하는 배열입니다.</p>' +
        '<p>선물용 제과는 가로 3 × 세로 8 배열(24칸)에 맞습니다. 상단에 매장 로고를 넣을 수 있습니다.</p>'],
    ],
    note: FRZ_NOTE,
  },

  'camping': {
    photos: [['frz-camping','캠핑장에 둔 고기 자판기',CAP_PROP],['frz-park','공원에 둔 피크닉세트 자판기',CAP_PROP]],
    name: '캠핑장·공원 자판기',
    tag: '냉동 쇼케이스 · 고기·피크닉',
    card: '캠핑장에는 고기 자판기, 공원에는 샌드위치·도시락 피크닉세트 자판기가 제안되어 있습니다.',
    lead: '캠핑장에서는 고기를, 공원에서는 샌드위치와 도시락 같은 피크닉세트를 블록형 냉동 쇼케이스로 파는 방법이 제안되어 있습니다.',
    desc: '캠핑장·공원 자판기: 캠핑장 고기 자판기(온도 관리, 도난·위생 걱정 없음), 공원 피크닉세트 자판기, 블록 배열별 상품.',
    models: ['frozen-showcase'],
    sections: [
      ['캠핑장에는 어떤 자판기가 맞나요?',
        '<p>캠핑장에는 LINK:frozen-showcase를 고기 자판기로 쓰는 방법이 제안되어 있습니다. 온도를 안정적으로 관리할 수 있고 도난이나 위생 걱정이 없다는 점이 이유로 적혀 있습니다.</p>' +
        '<p>육류는 가로 2 × 세로 8 배열(16칸)에 넣습니다. 이 배열은 자료에서 캠핑장에 추천하는 배열입니다.</p>'],
      ['공원에서는 무엇을 파나요?',
        '<p>공원에는 샌드위치, 도시락 같은 피크닉세트 자판기가 제안되어 있습니다. 도시락·피크닉세트는 가로 2 × 세로 5 배열(10칸)에 넣습니다.</p>'],
      ['밖에 둬도 되나요?',
        '<p>자료에는 실외 설치 조건이 나와 있지 않습니다. 전원과 설치 환경은 상담 때 현장을 보고 확인합니다.</p>'],
    ],
    note: FRZ_NOTE,
  },

  'pet': {
    photos: [['frz-pet','애견유치원에 둔 수제간식 냉동 쇼케이스',CAP_PROP]],
    name: '애견유치원·애견호텔 자판기',
    tag: '냉동 쇼케이스 · 수제간식',
    card: '애견유치원과 애견호텔에서 수제간식을 칸별 잠금 냉동 쇼케이스로 팝니다.',
    lead: '애견유치원과 애견호텔에서 수제간식을 블록형 냉동 쇼케이스로 파는 방법이 제안되어 있습니다.',
    desc: '애견유치원·애견호텔 자판기: 수제간식을 칸별 잠금 블록형 냉동 쇼케이스로 판매하는 제안, 냉동 -22~5℃, 앱으로 재고·온도 확인.',
    models: ['frozen-showcase'],
    sections: [
      ['애견유치원·애견호텔에는 어떤 자판기가 맞나요?',
        '<p>애견호텔, 애견유치원 같은 곳에 LINK:frozen-showcase를 수제간식 자판기로 쓰는 방법이 제안되어 있습니다.</p>' +
        '<p>결제한 칸만 열리고, 온도는 -22℃부터 5℃까지 맞춥니다. 재고와 온도 변화는 앱에서 확인합니다.</p>'],
      ['어떤 칸 배열이 맞나요?',
        '<p>자료에는 애견 간식에 맞는 배열이 따로 정해져 있지 않습니다. 간식 포장 크기를 알려 주시면 네 가지 배열 가운데에서 맞춰 드립니다.</p>'],
    ],
    note: FRZ_NOTE,
  },

  'gas-station': {
    photos: [['frz-gas','주유소에 둔 요소수 전용 쇼케이스',CAP_PROP]],
    name: '주유소 요소수 자판기',
    tag: '냉동 쇼케이스 · 요소수 전용',
    card: '온도에 민감하고 단가가 높은 요소수를 전용 쇼케이스로 팝니다.',
    lead: '주유소에서 요소수를 블록형 냉동 쇼케이스로 파는 방법이 제안되어 있습니다. 요소수는 온도에 민감하고 단가가 높은 상품으로 소개되어 있습니다.',
    desc: '주유소 요소수 자판기: 온도에 민감하고 단가가 높은 요소수 전용 블록형 쇼케이스 제안, 가로 2 × 세로 5 배열(10칸).',
    models: ['frozen-showcase'],
    sections: [
      ['주유소에는 어떤 자판기가 맞나요?',
        '<p>주유소에는 LINK:frozen-showcase를 요소수 전용 자판기로 쓰는 방법이 제안되어 있습니다. 요소수가 온도에 민감하고 단가가 높은 상품이라는 점이 이유로 적혀 있습니다. 결제한 칸만 열립니다.</p>'],
      ['요소수는 어느 칸에 넣나요?',
        '<p>요소수는 가장 큰 칸인 가로 2 × 세로 5 배열(한 대 10칸)에 넣습니다. 이 배열은 자료에서 주유소에 추천하는 배열입니다.</p>'],
      ['밖에 둬도 되나요?',
        '<p>자료에는 실외 설치 조건이 나와 있지 않습니다. 전원과 설치 환경은 상담 때 현장을 보고 확인합니다.</p>'],
    ],
    note: FRZ_NOTE,
  },
};

const industryUrl = (k) => `${BASE}/industry/${k}/`;
const indLink = (k) => `<a href="${industryUrl(k)}">${VEND_INDUSTRIES[k].name}</a>`;
const fillLinks = (html) => html.replace(/LINK:([a-z-]+)/g, (_, k) => link(k));

/* 업종 카드 목록 */
export function vendIndustryCards(exclude, only) {
  const keys = (only || VEND_INDUSTRY_ORDER).filter(k => k !== exclude);
  return `<div class="vm-cards">` + keys.map(k => {
    const d = VEND_INDUSTRIES[k];
    return `<a class="vm-card" href="${industryUrl(k)}">${d.photos ? imgTag(d.photos[0][0], d.photos[0][1], 'vm-card-photo') : ''}<div class="vm-card-tag">${d.tag}</div><div class="vm-card-name">${d.name}</div><div class="vm-card-desc">${d.card}</div></a>`;
  }).join('') + `</div>`;
}

/* 업종별 페이지 전체 */
export function vendIndustryPage(k, ctx) {
  const d = VEND_INDUSTRIES[k];
  if (!d) return null;
  const { css, header, footer, siteHead, host } = ctx;
  const canon = `https://${host}${industryUrl(k)}`;
  const title = `${d.name} — 맞는 모델과 운영 자료 | 더세이브스토어`;
  const body = d.sections.map(([h2, html], i) =>
    `<section class="p-section"><div class="p-wrap"><h2>${h2}</h2>${fillLinks(html).replace(/IMG:([a-z0-9-]+)\|([^|]*)\|([^|]*)\|/g, (_, n, alt, cap) => `<figure class="vm-wide">${imgTag(n, alt)}<figcaption>${cap}</figcaption></figure>`)}${i === 0 ? gallery(d.photos) : ''}</div></section>`).join('');
  const modelsSec = `<section class="p-section"><div class="p-wrap"><h2>이 업종에 맞는 자판기 모델은 무엇인가요?</h2><div class="vm-cards">` +
    d.models.map(m => `<a class="vm-card" href="${modelUrl(m)}">${VEND_MODELS[m].photo ? imgTag(VEND_MODELS[m].photo[0], VEND_MODELS[m].photo[1], 'vm-card-photo fit') : `<div class="vm-card-fig">${SVG[m]}</div>`}<div class="vm-card-tag">${VEND_MODELS[m].tag}</div><div class="vm-card-name">${VEND_MODELS[m].name}</div><div class="vm-card-desc">${VEND_MODELS[m].card}</div></a>`).join('') +
    `</div>${d.note || ''}</div></section>`;
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: '홈', item: `https://${host}/` },
        { '@type': 'ListItem', position: 2, name: '자동판매기', item: `https://${host}${BASE}/` },
        { '@type': 'ListItem', position: 3, name: d.name, item: canon },
      ] },
      { '@type': 'WebPage', name: d.name, description: d.desc, url: canon },
    ],
  });
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${title}</title>${siteHead}` +
    `<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${d.desc}">` +
    `<link rel="canonical" href="${canon}"><meta property="og:title" content="${title}"><meta property="og:description" content="${d.desc}">` +
    `<meta property="og:type" content="website"><meta property="og:url" content="${canon}">${d.photos ? `<meta property="og:image" content="${imgUrl(d.photos[0][0])}">` : ''}` +
    `<script type="application/ld+json">${jsonLd}</script>${css}${VEND_CSS}</head><body>${header}${vendSubnav('industry')}` +
    `<section class="p-hero"><div class="p-wrap"><div class="p-crumb"><a href="/">홈</a> · <a href="${BASE}/">자동판매기</a> · <a href="${BASE}/#industries">업종별 자판기</a> · <span style="color:#000;font-weight:700">${d.name}</span></div>` +
    `<div class="p-tag">${d.tag}</div><h1 class="p-h1">${d.name}</h1><p class="p-lead">${d.lead}</p>` +
    `<a href="tel:010-9677-2356" class="p-cta">설치 상담 010-9677-2356</a></div></section>` +
    body + modelsSec +
    `<section class="p-section"><div class="p-wrap"><h2>다른 업종은 어떤 자판기를 쓰나요?</h2>${vendIndustryCards(k)}</div></section>` +
    footer + `</body></html>`;
}

/* 모델 페이지에 붙이는 '쓰이는 업종' 단락 */
export function vendModelIndustriesHtml(m) {
  const keys = VEND_INDUSTRY_ORDER.filter(k => VEND_INDUSTRIES[k].models.includes(m));
  if (!keys.length) return '';
  return `<section class="p-section"><div class="p-wrap"><h2>이 모델은 어떤 업종에서 쓰이나요?</h2>${vendIndustryCards(null, keys)}</div></section>`;
}

/* 업종 묶음 페이지에서 이어 보는 업종별 페이지 */
const MACRO_IND = {
  restaurant: ['unmanned-store'], cafe: ['cafe-community', 'dessert'], convenience: ['unmanned-store', 'specialty'],
  medical: ['hospital', 'pet'], academy: ['school'], retail: ['sports'], service: ['gas-station'], etc: ['hotel', 'camping'],
};
export function vendMacroIndustryLinks(macro) {
  const keys = MACRO_IND[macro];
  if (!keys) return '';
  return `<p class="vm-note">업종별로 자세히 보기: ${keys.map(indLink).join(' · ')}</p>`;
}

export const VEND_INDUSTRY_URLS = VEND_INDUSTRY_ORDER.map(industryUrl);
