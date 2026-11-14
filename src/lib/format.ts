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
