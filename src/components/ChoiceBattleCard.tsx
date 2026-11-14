import { imageUrl } from '../data/art'
import type { Choice } from '../types'
import { formatNumber } from '../lib/format'

interface Props {
  choice: Choice
  index: number
  /** 투표 전에는 클릭, 결과 화면에서는 표시 전용 */
  interactive: boolean
  percent: number
  count: number
  mine: boolean
  adopted: boolean
  onPick?: () => void
}

/**
 * A/B 선택지 카드.
 * 선택지마다 장면 일러스트를 깔고, A는 로즈·B는 인디고로 대비시켜 한눈에 갈라 보이게 합니다.
 */
export function ChoiceBattleCard({
  choice,
  index,
  interactive,
  percent,
  count,
  mine,
  adopted,
  onPick,
}: Props) {
  const image = imageUrl(choice.image)
  const side = index === 0 ? 'a' : 'b'
  const state = interactive ? 'idle' : adopted ? 'won' : mine ? 'mine' : 'lost'

  const inner = (
    <>
      <div className="vs-media">
        {image ? (
          <img src={image} alt={`${choice.label} 장면`} loading="lazy" decoding="async" />
        ) : (
          <div
            className="w-full h-full"
            style={{
              backgroundImage:
                side === 'a'
                  ? 'linear-gradient(150deg, #3a201d, #160f12)'
                  : 'linear-gradient(150deg, #201f38, #100f1a)',
            }}
          />
        )}
        <span className="vs-letter">{String.fromCharCode(65 + index)}</span>
        {!interactive && adopted && <span className="vs-crown">채택 루트</span>}
        {!interactive && mine && !adopted && <span className="vs-crown">내 선택</span>}
        {!interactive && <span className="vs-percent">{percent}%</span>}
      </div>

      <div className="vs-body">
        <p className="vs-label">{choice.label}</p>
        {choice.hint && <p className="vs-hint">{choice.hint}</p>}

        {interactive ? (
          <span className="vs-cta">
            이 루트로 투표하기 <span aria-hidden>→</span>
          </span>
        ) : (
          <>
            <div className="vs-bar">
              <div className="vs-bar-fill" style={{ width: `${percent}%` }} />
            </div>
            <p className="vs-count">
              {formatNumber(count)}명 · {percent}%
              {mine ? ' · 내가 고른 루트' : ''}
            </p>
          </>
        )}
      </div>
    </>
  )

  if (!interactive) {
    return (
      <div className="vs-panel" data-side={side} data-state={state}>
        {inner}
      </div>
    )
  }

  return (
    <button
      type="button"
      className="vs-panel"
      data-side={side}
      data-state="idle"
      onClick={onPick}
      aria-label={`${String.fromCharCode(65 + index)} 선택지: ${choice.label}`}
    >
      {inner}
    </button>
  )
}
