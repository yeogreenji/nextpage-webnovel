import { useEffect, useState } from 'react'
import { formatRemaining, remainingUntil } from '../lib/format'

interface Props {
  closesAt: string | null
  className?: string
  /** 마감 임박(1시간 이내)에 강조 표시 */
  urgentAccent?: boolean
  /** 어두운 배경(히어로 등) 위에서 쓰는 밝은 색상 */
  onDark?: boolean
}

/** 1초마다 갱신되는 투표 마감 카운트다운 */
export function Countdown({ closesAt, className = '', urgentAccent = true, onDark = false }: Props) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  if (!closesAt) return null

  const remaining = remainingUntil(closesAt, now)
  const urgent = urgentAccent && !remaining.closed && remaining.totalMs < 60 * 60 * 1000

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold tabular-nums ${className}`}
      style={{
        color: onDark
          ? remaining.closed
            ? 'rgba(255,250,247,0.5)'
            : '#fffaf7'
          : remaining.closed
            ? 'var(--ink-mute)'
            : urgent
              ? 'var(--accent)'
              : 'var(--ink-soft)',
      }}
      title={new Date(closesAt).toLocaleString('ko-KR')}
    >
      <span aria-hidden className="text-[11px]">
        {remaining.closed ? '■' : '◷'}
      </span>
      {remaining.closed ? '투표 마감' : formatRemaining(remaining)}
    </span>
  )
}
