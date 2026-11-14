import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Episode, Novel, VoteRecord } from '../types'
import { layoutTree } from '../lib/tree'
import { tallyVotes } from '../lib/vote'
import { useStore } from '../store/StoreProvider'

interface Props {
  novel: Novel
  episodes: Episode[]
  votes: VoteRecord[]
  currentEpisodeId?: string
  compact?: boolean
}

function clip(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

/** 1화 → 2화(채택/미채택 루트) → 3화 흐름을 보여주는 인터랙티브 분기 트리 */
export function BranchTree({ novel, episodes, votes, currentEpisodeId, compact = false }: Props) {
  const navigate = useNavigate()
  const { notify } = useStore()
  const layout = useMemo(() => layoutTree(episodes, votes), [episodes, votes])

  return (
    <div className="overflow-x-auto -mx-1 px-1 pb-1">
      <svg
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        style={{ minWidth: compact ? 600 : 660, width: '100%', height: 'auto' }}
        role="img"
        aria-label={`${novel.title} 분기 트리`}
      >
        <defs>
          <marker id="np-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--line)" />
          </marker>
          <marker id="np-arrow-accent" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent)" />
          </marker>
        </defs>

        {layout.edges.map((edge, index) => {
          const startX = edge.from.x
          const startY = edge.from.y + layout.nodeHeight
          const endX = edge.to.x
          const endY = edge.to.y - 6
          const midY = (startY + endY) / 2
          return (
            <g key={`${edge.from.episode.id}-${edge.to.episode.id}-${index}`}>
              <title>{edge.label ? `선택: ${edge.label}` : '이어지는 회차'}</title>
              <path
                d={`M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`}
                fill="none"
                stroke={edge.adopted ? 'var(--accent)' : 'var(--line)'}
                strokeWidth={edge.adopted ? 2.4 : 1.5}
                strokeDasharray={edge.pending ? '5 5' : undefined}
                opacity={edge.adopted ? 0.85 : 0.8}
                markerEnd={edge.pending ? undefined : edge.adopted ? 'url(#np-arrow-accent)' : 'url(#np-arrow)'}
              />
            </g>
          )
        })}

        {layout.nodes.map((node) => {
          const episode = node.episode
          const pending = episode.status === 'pending'
          const active = episode.id === currentEpisodeId
          const tally = episode.choices.length > 0 ? tallyVotes(episode, votes) : null
          const adoptedPercent = tally?.leaderId ? tally.percents[tally.leaderId] : null
          const x = node.x - layout.nodeWidth / 2
          const y = node.y
          const footer = pending
            ? '다음 화를 기다리는 중'
            : episode.branchLabel
              ? `“${clip(episode.branchLabel, 15)}”`
              : '시작 회차'

          return (
            <g
              key={episode.id}
              className="tree-node"
              role="button"
              tabIndex={0}
              aria-label={`${episode.no}화 ${episode.title}${pending ? ' (집필 중)' : ''}`}
              onClick={() => {
                if (pending) {
                  notify('아직 집필 중인 회차입니다. 작가 스튜디오에서 이어 쓸 수 있어요')
                  return
                }
                navigate(`/novel/${novel.id}/ep/${episode.id}`)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  if (!pending) navigate(`/novel/${novel.id}/ep/${episode.id}`)
                }
              }}
            >
              <rect
                x={x}
                y={y}
                width={layout.nodeWidth}
                height={layout.nodeHeight}
                rx={14}
                fill={pending ? 'var(--surface-2)' : 'var(--surface)'}
                stroke={active ? 'var(--accent)' : 'var(--line)'}
                strokeWidth={active ? 2.4 : 1.2}
                strokeDasharray={pending ? '6 5' : undefined}
              />
              <text
                x={x + 15}
                y={y + 22}
                fontSize="10.5"
                fontWeight="700"
                letterSpacing="0.04em"
                fill={pending ? 'var(--ink-mute)' : 'var(--accent)'}
              >
                {episode.no}화
                {pending
                  ? ' · 집필 중'
                  : episode.choices.length === 0
                    ? ''
                    : (tally?.total ?? 0) > 0 && adoptedPercent !== null
                      ? ` · 채택 ${adoptedPercent}%`
                      : ' · 투표 시작'}
              </text>
              <text
                x={x + 15}
                y={y + 45}
                fontSize="12.5"
                fontWeight="700"
                fill={pending ? 'var(--ink-mute)' : 'var(--ink)'}
              >
                {clip(episode.title, 17)}
              </text>
              <text x={x + 15} y={y + 68} fontSize="10.5" fill="var(--ink-mute)">
                {footer}
              </text>
              {active && (
                <circle cx={x + layout.nodeWidth - 16} cy={y + 18} r={4} fill="var(--accent)" />
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
