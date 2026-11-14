import { Link } from 'react-router-dom'
import { useStore } from '../store/StoreProvider'
import { NovelCard } from '../components/NovelCard'
import { HeroBanner } from '../components/HeroBanner'
import { Countdown } from '../components/Countdown'
import { CharacterSpotlight } from '../components/CharacterSpotlight'
import { SceneGallery } from '../components/SceneGallery'
import { formatNumber } from '../lib/format'
import { novelParticipants, tallyVotes } from '../lib/vote'
import { imageUrl, scenesForEpisodes } from '../data/art'
import type { Episode, Novel } from '../types'

interface OpenVote {
  novel: Novel
  episode: Episode
}

export function HomePage() {
  const { ready, novels, episodes, votes } = useStore()

  if (!ready) {
    return (
      <div className="page-shell py-24 text-center text-[13px]" style={{ color: 'var(--ink-mute)' }}>
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
  const characterCount = novels.reduce((sum, novel) => sum + (novel.characters?.length ?? 0), 0)

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

  const featured = openVotes[0]?.novel ?? novels[0]
  const featuredEpisodes = featured
    ? episodes.filter((episode) => episode.novelId === featured.id)
    : []

  const myVoteCount = votes.length

  // 스포트라이트: 모든 작품의 인물을 한 줄로
  const spotlight = novels.flatMap((novel) =>
    (novel.characters ?? []).map((character) => ({
      character,
      novelId: novel.id,
      novelTitle: novel.title,
      workLabel: novel.genres[0],
    })),
  )

  // 홈 명장면 레일: 공개 회차의 삽화를 최신순으로
  const sceneRail = scenesForEpisodes(
    [...published].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()),
  )
    .slice(0, 8)
    .map(({ episode, scene }) => ({
      image: scene.image,
      caption: scene.caption,
      episodeNo: episode.no,
      episodeTitle: episode.title,
      href: `/novel/${episode.novelId}/ep/${episode.id}`,
    }))

  return (
    <div className="page-shell pt-6 pb-4">
      {featured && (
        <HeroBanner
          novel={featured}
          episodes={featuredEpisodes.length > 0 ? featuredEpisodes : episodes}
        />
      )}

      {/* 요약 지표 */}
      <dl className="stat-bar">
        {[
          { label: '연재 작품', value: `${novels.length}편` },
          { label: '공개 회차', value: `${published.length}화` },
          { label: '등장인물', value: `${characterCount}인` },
          { label: '누적 참여', value: `${formatNumber(totalParticipants)}명` },
        ].map((stat) => (
          <div key={stat.label}>
            <dt>{stat.label}</dt>
            <dd>{stat.value}</dd>
          </div>
        ))}
      </dl>

      {myVoteCount > 0 && (
        <p className="mt-3 text-[12px]" style={{ color: 'var(--accent-strong)' }}>
          이 기기에서 {myVoteCount}번 선택했습니다. 남은 루트도 읽어 보세요.
        </p>
      )}

      {/* ✨ 캐릭터 스포트라이트 */}
      <div className="mt-11">
        <CharacterSpotlight items={spotlight} />
      </div>

      {/* 마감 임박 투표 */}
      {openVotes.length > 0 && (
        <section className="mt-11">
          <div className="section-head">
            <div>
              <p className="eyebrow">Live · 마감 순</p>
              <h2 className="section-title">지금 투표 중</h2>
            </div>
            <span className="text-[11.5px]" style={{ color: 'var(--ink-mute)' }}>
              한 회차에 한 표
            </span>
          </div>

          <div className="live-list">
            {openVotes.map(({ novel, episode }) => {
              const tally = tallyVotes(episode, votes)
              const [a, b] = episode.choices
              const pa = a ? tally.percents[a.id] ?? 0 : 0
              const pb = b ? tally.percents[b.id] ?? 0 : 0
              const myVote = votes.find((vote) => vote.episodeId === episode.id)
              const scene = imageUrl(a?.image ?? episode.choices[0]?.image)
              return (
                <Link
                  key={episode.id}
                  to={`/novel/${novel.id}/ep/${episode.id}#vote`}
                  className="live-row"
                >
                  <span className="live-thumb">
                    {scene ? (
                      <img src={scene} alt="" loading="lazy" decoding="async" />
                    ) : (
                      <span
                        className="absolute inset-0"
                        style={{
                          backgroundImage: `linear-gradient(150deg, ${novel.cover.from}, ${novel.cover.to})`,
                        }}
                      />
                    )}
                    <span className="pill pill-live absolute left-1.5 top-1.5">LIVE</span>
                  </span>

                  <span className="live-body">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="text-[10.5px] font-bold truncate"
                        style={{ color: 'var(--ink-mute)' }}
                      >
                        {novel.title}
                      </span>
                      {myVote && (
                        <span className="pill pill-dday shrink-0" style={{ padding: '1px 6px' }}>
                          참여 완료
                        </span>
                      )}
                    </span>
                    <span className="live-title">
                      {episode.no}화 · {episode.title}
                    </span>

                    <span className="live-split" aria-hidden>
                      <span className="a" style={{ width: `${pa}%` }} />
                      <span className="b" style={{ width: `${pb}%` }} />
                    </span>
                    <span className="flex items-center gap-2 text-[10.5px]" style={{ color: 'var(--ink-mute)' }}>
                      <span className="shrink-0">
                        <b style={{ color: 'var(--vs-a)' }}>A</b> {pa}%
                        <span className="mx-1 opacity-50">·</span>
                        <b style={{ color: 'var(--vs-b)' }}>B</b> {pb}%
                      </span>
                      <span className="inline-flex items-center gap-1 sm:hidden">
                        <span className="opacity-50">·</span>
                        <Countdown closesAt={episode.voteClosesAt} className="text-[10.5px]" />
                      </span>
                    </span>
                  </span>

                  <span className="shrink-0 self-center text-right flex flex-col items-end gap-1.5 live-meta-right">
                    <span className="chip hidden text-[10.5px] sm:inline-flex">
                      <Countdown closesAt={episode.voteClosesAt} className="text-[10.5px]" />
                    </span>
                    <span
                      className="live-count text-[10.5px] tabular-nums"
                      style={{ color: 'var(--ink-mute)' }}
                    >
                      {formatNumber(tally.total)}명 참여
                    </span>
                  </span>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* 🎨 명장면 갤러리 */}
      {sceneRail.length > 0 && (
        <section className="mt-11">
          <div className="section-head">
            <div>
              <p className="eyebrow">Scene Gallery</p>
              <h2 className="section-title">🎨 명장면 일러스트</h2>
              <p className="mt-1.5 text-[12px]" style={{ color: 'var(--ink-mute)' }}>
                회차 본문에 들어간 삽화입니다. 눌러서 크게 보고, 그 장면으로 바로 들어가세요.
              </p>
            </div>
          </div>
          <SceneGallery items={sceneRail} layout="rail" />
        </section>
      )}

      {/* 작품 피드 */}
      <section className="mt-11">
        <div className="section-head">
          <div>
            <p className="eyebrow">Feed · 표지 갤러리</p>
            <h2 className="section-title">연재 중인 작품</h2>
          </div>
          <Link to="/library" className="text-[12px] font-bold" style={{ color: 'var(--accent)' }}>
            전체 보기 →
          </Link>
        </div>

        <div className="book-grid">
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
        <div className="section-head">
          <div>
            <p className="eyebrow">How it works</p>
            <h2 className="section-title">세 단계면 충분합니다</h2>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
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
            <div key={item.step} className="card p-5">
              <span
                className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-[12px] font-extrabold"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent-strong)' }}
              >
                {item.step}
              </span>
              <h3 className="mt-3 text-[15px] font-extrabold">{item.title}</h3>
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

      {/* 마무리 CTA */}
      <section className="mt-12">
        <div className="cta-band flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative z-[2]">
            <p className="text-[10.5px] font-extrabold tracking-[0.2em] uppercase opacity-70">
              Next Page
            </p>
            <h2 className="mt-2 text-[21px] sm:text-[25px] font-extrabold leading-snug tracking-tight">
              다음 화는, 당신이 고른다
            </h2>
            <p className="mt-2 text-[12.5px] opacity-80">
              읽고, 고르고, 결과를 공유하세요. 모든 작품은 회차마다 갈라집니다.
            </p>
          </div>
          <div className="relative z-[2] flex flex-wrap gap-2">
            <Link className="btn btn-light" to="/library">
              작품 둘러보기
            </Link>
            <Link className="btn btn-glass" to="/studio">
              작가 스튜디오
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
