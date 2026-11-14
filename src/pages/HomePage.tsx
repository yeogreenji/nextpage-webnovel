import { Link } from 'react-router-dom'
import { useStore } from '../store/StoreProvider'
import { NovelCard } from '../components/NovelCard'
import { Countdown } from '../components/Countdown'
import { formatNumber } from '../lib/format'
import { novelParticipants, tallyVotes } from '../lib/vote'
import type { Episode, Novel } from '../types'

interface OpenVote {
  novel: Novel
  episode: Episode
}

export function HomePage() {
  const { ready, novels, episodes, votes } = useStore()

  if (!ready) {
    return (
      <div className="page-shell py-20 text-center text-[13px]" style={{ color: 'var(--ink-mute)' }}>
        이야기를 불러오는 중…
      </div>
    )
  }

  const published = episodes.filter((episode) => episode.status === 'published')
  const totalParticipants = novels.reduce(
    (sum, novel) =>
      sum + novelParticipants(episodes.filter((episode) => episode.novelId === novel.id)),
    0,
  )

  const now = Date.now()
  const openVotes: OpenVote[] = episodes
    .filter(
      (episode) =>
        episode.status === 'published' &&
        episode.choices.length > 0 &&
        episode.voteClosesAt !== null &&
        new Date(episode.voteClosesAt).getTime() > now,
    )
    .sort(
      (a, b) =>
        new Date(a.voteClosesAt as string).getTime() - new Date(b.voteClosesAt as string).getTime(),
    )
    .slice(0, 3)
    .flatMap((episode) => {
      const novel = novels.find((item) => item.id === episode.novelId)
      return novel ? [{ novel, episode }] : []
    })

  const myVoteCount = votes.length

  return (
    <div className="page-shell pt-8 pb-4">
      {/* 히어로 */}
      <section className="rise">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="chip chip-accent">독자 투표 연재</span>
          <span className="chip">오피스 로코 · 로맨스 판타지 · 미스터리</span>
        </div>
        <h1 className="text-[30px] sm:text-[44px] font-extrabold leading-[1.12] tracking-[-0.03em]">
          다음 화는,
          <br className="sm:hidden" /> 당신이 고른다
        </h1>
        <p
          className="mt-4 max-w-[560px] text-[14px] sm:text-[15px] leading-relaxed"
          style={{ color: 'var(--ink-soft)', wordBreak: 'keep-all' }}
        >
          회차 끝에서 A와 B 중 하나를 고르면, 독자 다수가 고른 루트로 다음 화가 이어집니다.
          내 선택이 몇 퍼센트였는지, 다른 루트는 어땠는지 — 읽고, 고르고, 결과를 공유하세요.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {openVotes[0] ? (
            <Link
              className="btn btn-primary"
              to={`/novel/${openVotes[0].novel.id}/ep/${openVotes[0].episode.id}#vote`}
            >
              지금 투표하러 가기
            </Link>
          ) : (
            <Link className="btn btn-primary" to="/library">
              작품 보러 가기
            </Link>
          )}
          <Link className="btn btn-secondary" to="/studio">
            작가 스튜디오
          </Link>
        </div>

        <dl className="mt-8 grid grid-cols-3 gap-3 max-w-[520px]">
          {[
            { label: '연재 작품', value: `${novels.length}편` },
            { label: '공개 회차', value: `${published.length}화` },
            { label: '누적 참여', value: `${formatNumber(totalParticipants)}명` },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl px-3 py-3"
              style={{ background: 'var(--surface-2)' }}
            >
              <dt className="text-[10.5px] font-bold tracking-wide" style={{ color: 'var(--ink-mute)' }}>
                {stat.label}
              </dt>
              <dd className="mt-1 text-[16px] sm:text-[18px] font-extrabold tracking-tight">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
        {myVoteCount > 0 && (
          <p className="mt-3 text-[12px]" style={{ color: 'var(--accent-strong)' }}>
            이 기기에서 {myVoteCount}번 선택했습니다. 남은 루트도 읽어 보세요.
          </p>
        )}
      </section>

      {/* 마감 임박 투표 */}
      {openVotes.length > 0 && (
        <section className="mt-12">
          <div className="flex items-end justify-between gap-3 mb-3">
            <div>
              <p className="eyebrow">Live</p>
              <h2 className="text-[19px] font-extrabold mt-1">지금 투표 중</h2>
            </div>
            <span className="text-[11.5px]" style={{ color: 'var(--ink-mute)' }}>
              마감 순
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2.5">
            {openVotes.map(({ novel, episode }) => {
              const tally = tallyVotes(episode, votes)
              const leader = episode.choices.find((choice) => choice.id === tally.leaderId)
              const myVote = votes.find((vote) => vote.episodeId === episode.id)
              return (
                <Link
                  key={episode.id}
                  to={`/novel/${novel.id}/ep/${episode.id}#vote`}
                  className="card card-tap flex items-center gap-3 px-4 py-3"
                >
                  <span
                    className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-[18px]"
                    style={{
                      backgroundImage: `linear-gradient(150deg, ${novel.cover.from}, ${novel.cover.to})`,
                    }}
                    aria-hidden
                  >
                    {novel.cover.glyph}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-semibold truncate" style={{ color: 'var(--ink-mute)' }}>
                      {novel.title}
                    </span>
                    <span className="block text-[13.5px] font-bold truncate">
                      {episode.no}화 · {episode.title}
                    </span>
                    <span className="block mt-0.5 text-[11.5px] truncate" style={{ color: 'var(--ink-mute)' }}>
                      1위 “{leader?.label ?? '집계 중'}” {leader ? tally.percents[leader.id] : 0}%
                      {myVote ? ' · 참여 완료' : ''}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <Countdown closesAt={episode.voteClosesAt} className="text-[12px]" />
                    <span className="block mt-1 text-[11px]" style={{ color: 'var(--ink-mute)' }}>
                      {formatNumber(tally.total)}명
                    </span>
                  </span>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* 작품 피드 */}
      <section className="mt-12">
        <div className="flex items-end justify-between gap-3 mb-3">
          <div>
            <p className="eyebrow">Feed</p>
            <h2 className="text-[19px] font-extrabold mt-1">연재 중인 작품</h2>
          </div>
          <Link to="/library" className="text-[12px] font-bold" style={{ color: 'var(--accent)' }}>
            전체 보기 →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {novels.map((novel) => (
            <NovelCard
              key={novel.id}
              novel={novel}
              episodes={episodes.filter((episode) => episode.novelId === novel.id)}
            />
          ))}
        </div>
      </section>

      {/* 진행 방식 */}
      <section className="mt-12">
        <p className="eyebrow">How it works</p>
        <h2 className="text-[19px] font-extrabold mt-1">세 단계면 충분합니다</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            {
              step: '01',
              title: '회차를 읽는다',
              body: '작품을 골라 1화부터 읽습니다. 글자 크기와 배경은 취향대로 바꿀 수 있습니다.',
            },
            {
              step: '02',
              title: 'A/B를 고른다',
              body: '회차 끝에서 두 갈래 중 하나를 선택합니다. 마감 전까지 한 번만 참여할 수 있습니다.',
            },
            {
              step: '03',
              title: '결과를 본다',
              body: '즉시 비율이 공개됩니다. 다수파가 고른 루트로 다음 화가 이어지고, 결과 카드는 스토리로 공유할 수 있습니다.',
            },
          ].map((item) => (
            <div key={item.step} className="card p-4">
              <span className="text-[11px] font-extrabold" style={{ color: 'var(--accent)' }}>
                {item.step}
              </span>
              <h3 className="mt-1.5 text-[14.5px] font-extrabold">{item.title}</h3>
              <p
                className="mt-1.5 text-[12.5px] leading-relaxed"
                style={{ color: 'var(--ink-soft)', wordBreak: 'keep-all' }}
              >
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
