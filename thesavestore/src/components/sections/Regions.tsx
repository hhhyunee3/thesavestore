import type { FC } from 'hono/jsx'
import { regions } from '../../data/regions'

export const Regions: FC = () => (
  <section class="regions" id="regions">
    <div class="container">
      <div class="sec-label">SERVICE AREA</div>
      <h2 class="sec-title">
        수도권 <span class="emph">전지역 출장.</span>
      </h2>
      <p class="sec-sub">
        서울 · 경기 · 인천 읍면동 단위까지 당일 또는 익일 현장 방문이 가능합니다.
      </p>

      <div class="region-grid">
        {regions.map((r) => {
          // 대표 시군구 4개 추출 + 남은 개수 표시
          const previewDistricts = r.districts.slice(0, 4)
          const remaining = r.districts.length - previewDistricts.length

          return (
            <a href={`/${r.nameKoShort}`} class="region-card">
              <div class="region-en">{r.nameEn}</div>
              <div class="region-ko">{r.nameKo}</div>
              <div class="region-stats">
                <div>
                  <div class="region-stat-num">{r.districtCount}</div>
                  <div class="region-stat-label">
                    {r.code === 'gyeonggi' ? '시군' : r.code === 'incheon' ? '군구' : '자치구'}
                  </div>
                </div>
                <div>
                  <div class="region-stat-num">{r.dongCount}</div>
                  <div class="region-stat-label">
                    {r.code === 'seoul' ? '행정동' : '읍면동'}
                  </div>
                </div>
              </div>
              <div class="region-chips">
                {previewDistricts.map((d) => (
                  <span class="region-chip">{d.name}</span>
                ))}
                {remaining > 0 && <span class="region-chip">+{remaining}</span>}
              </div>
            </a>
          )
        })}
      </div>

      <div class="region-note">
        <span style="font-size: 22px;">📍</span>
        <div>
          <strong>수도권 집중 출장 체제</strong>로 운영됩니다. 서울·경기·인천 지역 읍면동
          단위까지 당일 또는 익일 현장 방문이 가능합니다. 그 외 지역은 별도 상담을 통해
          지원합니다.
        </div>
      </div>
    </div>
  </section>
)
