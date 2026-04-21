import type { FC } from 'hono/jsx'
import { faqPool, installRecordTemplates, seasonalTips } from '../../utils/copyBank'
import { pickMany, pickOne, fillTemplate, seededInt } from '../../utils/variance'
import type { DistrictMeta } from '../../data/districtMeta'

interface SeededSectionProps {
  seed: string
  locationLabel: string
}

// ========================================
// FAQ 섹션 (지역별 질문 4개 랜덤 선택)
// ========================================
export const FAQ: FC<SeededSectionProps> = ({ seed, locationLabel }) => {
  const items = pickMany(faqPool, 4, seed)
  const installCount = seededInt(seed, 0, 8, 35)

  return (
    <section style="padding: 100px 0; background: var(--white); border-top: 0.5px solid var(--line);">
      <div class="container">
        <div class="sec-label">FAQ</div>
        <h2 class="sec-title">
          {locationLabel} <span class="emph">자주 묻는 질문.</span>
        </h2>
        <p class="sec-sub">
          이 지역 사장님들이 많이 궁금해하셨던 내용들을 정리했습니다.
        </p>

        <div style="display: flex; flex-direction: column; gap: 2px; margin-top: 40px;">
          {items.map((item) => (
            <div
              style="background: var(--white); border: 0.5px solid var(--line); padding: 24px 28px; border-radius: 4px;"
            >
              <div
                style="display: flex; gap: 16px; align-items: flex-start; margin-bottom: 10px;"
              >
                <span
                  style="font-family: 'Bricolage Grotesque', sans-serif; color: var(--orange); font-weight: 700; font-size: 14px; flex-shrink: 0;"
                >
                  Q.
                </span>
                <div
                  style="font-size: 16px; font-weight: 800; letter-spacing: -0.03em; color: var(--black);"
                >
                  {fillTemplate(item.q, { location: locationLabel })}
                </div>
              </div>
              <div style="display: flex; gap: 16px; align-items: flex-start;">
                <span
                  style="font-family: 'Bricolage Grotesque', sans-serif; color: var(--muted); font-weight: 700; font-size: 14px; flex-shrink: 0;"
                >
                  A.
                </span>
                <div
                  style="font-size: 14px; color: var(--muted); line-height: 1.7; font-weight: 300;"
                >
                  {fillTemplate(item.a, {
                    location: locationLabel,
                    installCount: installCount,
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ========================================
// 지역 인사이트 섹션 (시군구 메타데이터 기반)
// ========================================
interface LocalInsightProps {
  locationLabel: string
  meta: DistrictMeta
  seed: string
}

export const LocalInsight: FC<LocalInsightProps> = ({ locationLabel, meta, seed }) => {
  const densityLabel = meta.density === 'high' ? '고밀도 상권' : meta.density === 'medium' ? '중밀도 상권' : '저밀도 상권'
  const densityColor = meta.density === 'high' ? 'var(--orange)' : meta.density === 'medium' ? 'var(--brown)' : 'var(--muted)'

  return (
    <section style="padding: 100px 0; background: var(--ivory);">
      <div class="container">
        <div class="sec-label">LOCAL INSIGHT</div>
        <h2 class="sec-title">
          {locationLabel}에 대해<br />
          <span class="emph">알고 있는 것들.</span>
        </h2>
        <p class="sec-sub">지역 상권 특성을 바탕으로 최적 구성을 제안합니다.</p>

        <div style="display: grid; grid-template-columns: 1.3fr 1fr 1fr; gap: 14px; margin-top: 40px;">
          {/* 인사이트 본문 (크게) */}
          <div
            style="background: var(--brown); color: var(--white); padding: 36px 32px; border-radius: 4px; position: relative; overflow: hidden;"
          >
            <div
              style="position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--orange);"
            ></div>
            <div
              style="font-family: 'Bricolage Grotesque', sans-serif; font-size: 11px; letter-spacing: 0.2em; color: var(--orange); font-weight: 700; margin-bottom: 20px;"
            >
              AREA BRIEF
            </div>
            <div
              style="font-size: 20px; font-weight: 800; line-height: 1.45; letter-spacing: -0.03em;"
            >
              {meta.insight}
            </div>
          </div>

          {/* 인기 업종 */}
          <div
            style="background: var(--white); border: 0.5px solid var(--line); padding: 32px 28px; border-radius: 4px;"
          >
            <div
              style="font-family: 'Bricolage Grotesque', sans-serif; font-size: 11px; letter-spacing: 0.2em; color: var(--orange); font-weight: 700; margin-bottom: 20px;"
            >
              TOP INDUSTRIES
            </div>
            <div
              style="font-size: 13px; color: var(--muted); font-weight: 300; margin-bottom: 16px;"
            >
              이 지역의 주요 업종
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              {meta.topIndustries.map((ind, idx) => (
                <div
                  style="display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 0.5px dashed var(--line);"
                >
                  <span
                    style="font-family: 'Bricolage Grotesque', sans-serif; font-size: 11px; color: var(--muted); font-weight: 600;"
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span
                    style="font-size: 15px; font-weight: 700; letter-spacing: -0.03em;"
                  >
                    {ind}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 통계 박스 */}
          <div
            style="background: var(--white); border: 0.5px solid var(--line); padding: 32px 28px; border-radius: 4px; display: flex; flex-direction: column; gap: 20px;"
          >
            <div
              style="font-family: 'Bricolage Grotesque', sans-serif; font-size: 11px; letter-spacing: 0.2em; color: var(--orange); font-weight: 700;"
            >
              STATS
            </div>
            <div>
              <div
                style="font-family: 'Bricolage Grotesque', sans-serif; font-size: 36px; font-weight: 700; letter-spacing: -0.03em; color: var(--black); line-height: 1;"
              >
                {meta.installCount}
                <span style="color: var(--orange); font-size: 20px;">+</span>
              </div>
              <div
                style="font-size: 11px; color: var(--muted); letter-spacing: 0.05em; margin-top: 6px; font-weight: 500;"
              >
                최근 3개월 설치
              </div>
            </div>
            <div>
              <div
                style="font-size: 11px; color: var(--muted); letter-spacing: 0.08em; margin-bottom: 4px; font-weight: 500;"
              >
                PRIMARY PRODUCT
              </div>
              <div style="font-size: 16px; font-weight: 900; letter-spacing: -0.03em;">
                {meta.primaryProduct}
              </div>
            </div>
            <div>
              <div
                style="display: inline-block; padding: 4px 10px; background: var(--orange-tint); color: var(--brown); font-size: 11px; font-weight: 700; border-radius: 100px;"
              >
                {densityLabel}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ========================================
// 최근 설치 기록 (시드 기반 지역 내 가상 이력)
// ========================================
interface InstallRecordProps {
  seed: string
  locationLabel: string
}

export const InstallRecord: FC<InstallRecordProps> = ({ seed, locationLabel }) => {
  const records = pickMany(installRecordTemplates, 5, seed)
  const tip = pickOne(seasonalTips, seed, 1)

  return (
    <section style="padding: 100px 0; background: var(--white);">
      <div class="container">
        <div class="sec-label">INSTALL LOG</div>
        <h2 class="sec-title">
          {locationLabel}에서<br />
          <span class="emph">최근 설치된 기록.</span>
        </h2>
        <p class="sec-sub">이 지역 매장들이 어떤 구성을 선택했는지 확인해보세요.</p>

        <div
          style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; margin-top: 40px;"
        >
          {records.map((r) => (
            <div
              style="background: var(--white); border: 0.5px solid var(--line); padding: 22px 20px; border-radius: 4px;"
            >
              <div
                style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;"
              >
                <span
                  style="font-family: 'Bricolage Grotesque', sans-serif; font-size: 11px; color: var(--muted); letter-spacing: 0.05em; font-weight: 500;"
                >
                  {r.days}일 전
                </span>
                <span
                  style="font-size: 10px; padding: 3px 8px; background: var(--orange-tint); color: var(--brown); border-radius: 100px; font-weight: 700;"
                >
                  {r.industry}
                </span>
              </div>
              <div
                style="font-size: 15px; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 8px;"
              >
                {r.product}
              </div>
              <div
                style="font-size: 12px; color: var(--muted); line-height: 1.5; font-weight: 300;"
              >
                {r.outcome}
              </div>
            </div>
          ))}
        </div>

        {/* 팁 박스 */}
        <div
          style="margin-top: 32px; background: var(--ivory); padding: 28px 32px; border-radius: 4px; display: flex; gap: 20px; align-items: flex-start;"
        >
          <span style="font-size: 22px;">💡</span>
          <div>
            <div
              style="font-family: 'Bricolage Grotesque', sans-serif; font-size: 11px; color: var(--orange); letter-spacing: 0.2em; font-weight: 700; margin-bottom: 8px;"
            >
              PRO TIP
            </div>
            <div
              style="font-size: 14px; color: var(--black); line-height: 1.65; font-weight: 400;"
            >
              {tip}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
