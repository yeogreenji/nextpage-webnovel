import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Episode, Novel } from '../types'
import { useStore } from '../store/StoreProvider'
import { tallyVotes, myChoiceId } from '../lib/vote'
import { formatNumber } from '../lib/format'
import { Countdown } from './Countdown'
import { ShareCardModal } from './ShareCardModal'

interface Props {
  novel: Novel
  episode: Episode
}

/** 회차 끝 A/B 실시간 투표 카드 */
export function VotePanel({ novel, episode }: Props) {
  const { votes, episodes, castVote, notify } = useStore()
  const [shareOpen, setShareOpen] = useState(false)

  const tally = useMemo(() => tallyVotes(episode, votes), [episode, votes])
  const mine = myChoiceId(episode.id, votes)
  const closed = episode.voteClosesAt ? new Date(episode.voteClosesAt).getTime() <= Date.now() : false
  const canVote = !mine && !closed
  const myChoice = episode.choices.find((choice) => choice.id === mine) ?? null
  const myPercent = mine ? tally.percents[mine] : 0
  const isMajority = mine !== null && tally.leaderId === mine

  const shareInput = useMemo(() => {
    const target = myChoice ?? episode.choices.find((choice) => choice.id === tally.leaderId) ?? episode.choices[0]
    const percent = target ? tally.percents[target.id] ?? 0 : 0
    return {
      novelTitle: novel.title,
      episodeTitle: `${episode.no}화`,
      penName: novel.penName,
      choiceLabel: target?.label ?? '',
      percent,
      isMajority: myChoice ? isMajority : true,
      totalVoters: tally.total,
    }
  }, [episode, isMajority, myChoice, novel.penName, novel.title, tally])

  if (episode.choices.length === 0) return null

  return (
    <section className="card p-5 sm:p-6 mt-6" id="vote">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">당신의 선택</p>
          <h2 className="text-[17px] font-extrabold mt-1">
            {canVote ? '이야기를 어디로 보낼까요?' : '독자들이 고른 방향'}
          </h2>
          <p className="mt-1 text-[12px]" style={{ color: 'var(--ink-mute)' }}>
            총 {formatNumber(tally.total)}명 참여 · {episode.choices.length}개 선택지
          </p>
        </div>
        <div className="text-right shrink-0">
          <Countdown closesAt={episode.voteClosesAt} className="text-[12px]" />
        </div>
      </div>

      {canVote ? (
        <div className="mt-4 grid gap-2.5">
          {episode.choices.map((choice, index) => (
            <button
              key={choice.id}
              type="button"
              onClick={async () => {
                await castVote(episode.id, choice.id)
                notify('선택을 남겼어요. 결과를 확인해 보세요')
              }}
              className="group text-left rounded-2xl border p-4 transition-all hover:-translate-y-0.5"
              style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}
            >
              <div className="flex items-start gap-3">
                <span
                  className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-extrabold"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent-strong)' }}
                >
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="min-w-0">
                  <span className="block text-[14.5px] font-bold leading-snug">{choice.label}</span>
                  {choice.hint && (
                    <span className="block mt-1 text-[12px]" style={{ color: 'var(--ink-mute)' }}>
                      {choice.hint}
                    </span>
                  )}
                </span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-4">
          {mine && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className={`badge ${isMajority ? 'badge-majority' : 'badge-minority'}`}>
                {isMajority ? '👑' : '🌱'} 당신은 {myPercent}% {isMajority ? '다수파!' : '소수파!'}
              </span>
              <span className="text-[12px]" style={{ color: 'var(--ink-mute)' }}>
                {isMajority
                  ? '같은 선택을 한 독자가 더 많습니다'
                  : '당신의 선택이 이야기를 다른 쪽으로 밀었습니다'}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3">
            {episode.choices.map((choice, index) => {
              const percent = tally.percents[choice.id] ?? 0
              const isMine = choice.id === mine
              const adopted = choice.id === tally.leaderId
              return (
                <div key={choice.id}>
                  <div className="flex items-baseline justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[12px] font-extrabold" style={{ color: 'var(--ink-mute)' }}>
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="text-[13px] font-semibold truncate">{choice.label}</span>
                      {isMine && (
                        <span className="chip chip-accent shrink-0 text-[10px]">내 선택</span>
                      )}
                      {adopted && !isMine && (
                        <span className="chip shrink-0 text-[10px]">채택 루트</span>
                      )}
                    </div>
                    <span className="text-[15px] font-extrabold tabular-nums shrink-0">{percent}%</span>
                  </div>
                  <div className="meter">
                    <div
                      className={`meter-fill ${isMine || adopted ? '' : 'meter-fill-muted'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px]" style={{ color: 'var(--ink-mute)' }}>
                    {formatNumber(tally.counts[choice.id] ?? 0)}명
                  </p>
                </div>
              )
            })}
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setShareOpen(true)}
            >
              결과 카드 공유
            </button>
          </div>

          <div className="mt-4 grid gap-2">
            {episode.choices.map((choice) => {
              const target = choice.targetEpisodeId
                ? episodes.find((item) => item.id === choice.targetEpisodeId)
                : undefined
              const next = target && target.status === 'published' ? target.id : null
              const isAdopted = choice.id === tally.leaderId
              if (!next) {
                return (
                  <p key={choice.id} className="text-[12px]" style={{ color: 'var(--ink-mute)' }}>
                    {String.fromCharCode(65 + episode.choices.indexOf(choice))} · “{choice.label}” 루트는
                    집필 중입니다.
                  </p>
                )
              }
              return (
                <Link
                  key={choice.id}
                  to={`/novel/${novel.id}/ep/${next}`}
                  className="flex items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-[12.5px] font-semibold transition-colors"
                  style={{
                    borderColor: isAdopted ? 'var(--accent)' : 'var(--line)',
                    color: isAdopted ? 'var(--accent-strong)' : 'var(--ink-soft)',
                    background: isAdopted ? 'var(--accent-soft)' : 'var(--surface)',
                  }}
                >
                  <span className="truncate">
                    {isAdopted ? '👑 다수파가 고른 다음 화' : '🌱 이 루트의 다음 화'} · “{choice.label}”
                  </span>
                  <span className="shrink-0">→</span>
                </Link>
              )
            })}
          </div>

          {mine && !isMajority && (
            <p className="mt-3 text-[11.5px] leading-relaxed" style={{ color: 'var(--ink-mute)' }}>
              두 루트 모두 읽을 수 있습니다. 다만 다음 화의 정식 연재는 다수파 루트를 따라갑니다.
            </p>
          )}
        </div>
      )}

      <ShareCardModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        input={shareInput}
        shareUrl={typeof window !== 'undefined' ? window.location.href : ''}
        onNotice={notify}
      />
    </section>
  )
}
