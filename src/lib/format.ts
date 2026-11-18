/** 표시용 포맷 도우미 */

export function formatNumber(value: number): string {
  return value.toLocaleString('ko-KR')
}

export function formatRelative(iso: string, now = Date.now()): string {
  const diff = now - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}일 전`
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export interface Remaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  totalMs: number
  closed: boolean
}

export function remainingUntil(iso: string | null, now = Date.now()): Remaining {
  if (!iso) return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, closed: false }
  const totalMs = new Date(iso).getTime() - now
  const clamped = Math.max(totalMs, 0)
  return {
    days: Math.floor(clamped / 86400000),
    hours: Math.floor((clamped % 86400000) / 3600000),
    minutes: Math.floor((clamped % 3600000) / 60000),
    seconds: Math.floor((clamped % 60000) / 1000),
    totalMs,
    closed: totalMs <= 0,
  }
}

export function formatRemaining(remaining: Remaining): string {
  if (remaining.closed) return '마감됨'
  const pad = (value: number) => String(value).padStart(2, '0')
  if (remaining.days > 0) {
    return `${remaining.days}일 ${pad(remaining.hours)}:${pad(remaining.minutes)}:${pad(remaining.seconds)}`
  }
  return `${pad(remaining.hours)}:${pad(remaining.minutes)}:${pad(remaining.seconds)}`
}

/** 남은 시간을 D-day 표기로 바꿉니다. (예: D-2, D-DAY, 마감) */
export function formatDday(iso: string | null, now = Date.now()): string {
  if (!iso) return '-'
  const remaining = remainingUntil(iso, now)
  if (remaining.closed) return '마감'
  if (remaining.totalMs < 24 * 3600 * 1000) {
    return remaining.days === 0 && remaining.hours < 12 ? 'D-DAY' : 'D-1'
  }
  return `D-${Math.ceil(remaining.totalMs / 86400000)}`
}

/** 예상 읽기 시간(분). 한국어 기준 분당 약 500자 */
export function readingMinutes(text: string): number {
  const chars = text.replace(/\s/g, '').length
  return Math.max(1, Math.round(chars / 500))
}

/**
 * 이름 뒤에 붙는 조사를 받침 유무로 고릅니다.
 * 한글 음절은 (코드 - 0xAC00) % 28 이 0이면 받침이 없습니다.
 * 예) 하윤은 / 서준은 · 유나는 / 정한결은
 */
function hasBatchim(word: string): boolean {
  const trimmed = word.trim()
  if (!trimmed) return false
  const code = trimmed.charCodeAt(trimmed.length - 1)
  if (code < 0xac00 || code > 0xd7a3) return false
  return (code - 0xac00) % 28 > 0
}

/** 받침에 따라 조사 한 쌍 중 하나를 고릅니다. 한글이 아니면 둘 다 팔호로 병기합니다. */
function pickParticle(word: string, withBatchim: string, withoutBatchim: string): string {
  const trimmed = word.trim()
  if (!trimmed) return trimmed
  const code = trimmed.charCodeAt(trimmed.length - 1)
  if (code < 0xac00 || code > 0xd7a3) return `${trimmed}${withBatchim}(${withoutBatchim})`
  return `${trimmed}${hasBatchim(trimmed) ? withBatchim : withoutBatchim}`
}

/** '은/는' — 예) 하윤은 / 유나는 */
export function withTopicParticle(name: string): string {
  return pickParticle(name, '은', '는')
}

/** '이/가' — 예) 서준이 / 유나가 */
export function withSubjectParticle(name: string): string {
  return pickParticle(name, '이', '가')
}

/** '을/를' — 예) 정한결을 / 유나를 */
export function withObjectParticle(name: string): string {
  return pickParticle(name, '을', '를')
}

/**
 * 이름 뒤에 붙는 '와/과' 조사 — 받침 유무로 고릅니다.
 * 예) 유나와 대화 / 정한결과 대화
 */
export function withAndParticle(name: string): string {
  return pickParticle(name, '과', '와')
}
