import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Episode, Novel } from '../types'
import { useStore } from '../store/StoreProvider'
import { tallyVotes, myChoiceId } from '../lib/vote'
import { formatNumber } from '../lib/format'
import { Countdown } from './Countdown'
import { ShareCardModal } from './ShareCardModal'
import { ChoiceBattleCard } from './ChoiceBattleCard'
import { imageUrl } from '../data/art'

interface Props {
  novel: Novel
  episode: Episode
}

/** 회차 끝 A/B 실시간 투표 — VS 배틀 카드 */
export function VotePanel({ novel, episode }: Props) {
  const { votes, episodes, castVote, notify } = useStore()
  const [shareOpen, setShareOpen] = useState(false)
  const [justVoted, setJustVoted] = useState(false)
  const routesRef = useRef<HTMLDivElement>(null)

  // 선택을 남기면 바로 아래에 열리는 '다음 화'로 시선을 옮겨 줍니다.
  useEffect(() => {
    if (!justVoted) return
    const timer = window.setTimeout(() => {
      routesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 260)
    return () => window.clearTimeout(timer)
  }, [justVoted])

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
      coverImage: imageUrl(novel.coverImage),
      sceneImage: imageUrl(target?.image),
    }
  }, [episode, isMajority, myChoice, novel.penName, novel.title, novel.coverImage, tally])

  if (episode.choices.length === 0) return null

  return (
    <section className="mt-9 scroll-mt-24" id="vote">
      <div className="section-head">
        <div>
          <p className="eyebrow">A / B Vote</p>
          <h2 className="section-title">{canVote ? '이야기를 어디로 보낼까요?' : '독자들이 고른 방향'}</h2>
          <p className="mt-1.5 text-[12px]" style={{ color: 'var(--ink-mute)' }}>
            총 {formatNumber(tally.total)}명 참여 · {episode.choices.length}개 선택지
            {mine ? ' · 투표 완료' : ''}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <span className="chip chip-accent">
            <Countdown closesAt={episode.voteClosesAt} className="text-[11.5px]" />
          </span>
        </div>
      </div>

      {mine && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
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

      <div className="vs-grid">
        {episode.choices.map((choice, index) => (
          <ChoiceBattleCard
            key={choice.id}
            choice={choice}
            index={index}
            interactive={canVote}
            percent={tally.percents[choice.id] ?? 0}
            count={tally.counts[choice.id] ?? 0}
            mine={choice.id === mine}
            adopted={choice.id === tally.leaderId}
            onPick={
              canVote
                ? async () => {
                    await castVote(episode.id, choice.id)
                    setJustVoted(true)
                    notify('선택을 남겼어요. 결과를 확인해 보세요')
                  }
                : undefined
            }
          />
        ))}
        <span className="vs-badge" data-mode={canVote ? 'vs' : 'result'} aria-hidden>
          {canVote ? 'VS' : '결과'}
        </span>
      </div>

      {!canVote && (
        <div className="mt-5 grid gap-2" ref={routesRef}>
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
                className="flex min-w-0 items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-[12.5px] font-semibold transition-colors"
                style={{
                  borderColor: isAdopted ? 'var(--accent)' : 'var(--line)',
                  color: isAdopted ? 'var(--accent-strong)' : 'var(--ink-soft)',
                  background: isAdopted ? 'var(--accent-soft)' : 'var(--surface)',
                }}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate">
                    {isAdopted ? '👑 ' : '🌱 '}
                    {target?.no}화 · {target?.title}
                  </span>
                  <span className="block truncate text-[10.5px] font-medium" style={{ color: 'var(--ink-mute)' }}>
                    “{choice.label}”
                  </span>
                </span>
                <span className="shrink-0">→</span>
              </Link>
            )
          })}
        </div>
      )}

      {!canVote && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setShareOpen(true)}>
            결과 카드 공유
          </button>
          {!mine && closed && (
            <span className="text-[11.5px]" style={{ color: 'var(--ink-mute)' }}>
              투표가 마감되어 결과만 볼 수 있습니다.
            </span>
          )}
        </div>
      )}

      {mine && !isMajority && (
        <p className="mt-3 text-[11.5px] leading-relaxed" style={{ color: 'var(--ink-mute)' }}>
          두 루트 모두 읽을 수 있습니다. 다만 다음 화의 정식 연재는 다수파 루트를 따라갑니다.
        </p>
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
