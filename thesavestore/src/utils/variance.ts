/**
 * 시드 기반 변형 엔진
 *
 * 목적: 같은 URL(slug)은 항상 같은 콘텐츠를 반환하지만,
 * 다른 URL은 서로 다른 콘텐츠를 반환하도록 보장.
 *
 * → 구글 크롤러 입장에서 "페이지마다 다른 콘텐츠"로 보이면서
 *   사용자가 재방문해도 콘텐츠가 달라지지 않음 (UX 일관성).
 */

/** djb2 hash */
export function hashString(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) {
    h = (h * 33) ^ s.charCodeAt(i)
  }
  return Math.abs(h >>> 0)
}

/** 시드를 이용해 배열에서 1개 선택 */
export function pickOne<T>(items: readonly T[], seed: string, salt = 0): T {
  if (items.length === 0) throw new Error('Empty array')
  const idx = (hashString(seed + ':' + salt)) % items.length
  return items[idx]!
}

/** 시드를 이용해 배열에서 count개 선택 (중복 없이) */
export function pickMany<T>(items: readonly T[], count: number, seed: string): T[] {
  const n = Math.min(count, items.length)
  const shuffled = [...items]
  const hash = hashString(seed)

  // 시드 기반 Fisher-Yates
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = (hash + i * 2654435761) % (i + 1)
    ;[shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!]
  }

  return shuffled.slice(0, n)
}

/** 시드 기반 정수 생성 (min <= result < max) */
export function seededInt(seed: string, salt: number, min: number, max: number): number {
  const h = hashString(seed + ':' + salt)
  return min + (h % (max - min))
}

/** 시드에 따라 true/false (확률은 numerator/denominator) */
export function seededBool(seed: string, salt: number, probability = 0.5): boolean {
  return (hashString(seed + ':' + salt) / 0xffffffff) < probability
}

/** 텍스트 템플릿에 변수 삽입: "{location} 매장" -> "강남구 매장" */
export function fillTemplate(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`))
}
