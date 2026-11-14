import { useEffect } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useStore } from '../store/StoreProvider'
import { BranchTree } from '../components/BranchTree'
import { CharacterStrip } from '../components/CharacterStrip'
import { SceneGallery } from '../components/SceneGallery'
import { Countdown } from '../components/Countdown'
import { formatNumber, formatRelative } from '../lib/format'
import { novelParticipants, tallyVotes } from '../lib/vote'
import { imageUrl, scenesForEpisodes } from '../data/art'
import type { Episode } from '../types'

export function NovelPage() {
  const { novelId = '' } = useParams()
  const location = useLocation()
  const { ready, novels, episodes, votes } = useStore()
  const novel = novels.find((item) => item.id === novelId)
  const episodesOfNovel = episodes.filter((item) => item.novelId === novelId)
  const published = episodesOfNovel
    .filter((item) => item.status === 'published')
    .sort((a, b) => a.no - b.no)
  const pending = episodesOfNovel
    .filter((item) => item.status === 'pending')
    .sort((a, b) => a.no - b.no)

  useEffect(() => {
    if (novel) document.title = `${novel.title} — 넥스트페이지`
    return () => {
      document.title = '넥스트페이지 · 선택형 웹소설'
    }
  }, [novel])

  // 캐릭터 스포트라이트에서 넘어온 경우 등장인물 섹션으로
  useEffect(() => {
    if (!ready || location.hash !== '#characters') return undefined
    const timer = window.setTimeout(() => {
      document.getElementById('characters')?.scrollIntoView({ behavior: 'auto', block: 'start' })
    }, 160)
    return () => window.clearTimeout(timer)
  }, [ready, location.hash, novelId])

  if (!ready) {
    return (
      <div className="page-shell py-24 text-center text-[13px]" style={{ color: 'var(--ink-mute)' }}>
        불러오는 중…
      </div>
    )
  }

  if (!novel) {
    return (
      <div className="page-shell py-20 text-center">
        <p className="text-[15px] font-bold">작품을 찾을 수 없습니다.</p>
        <Link to="/library" className="btn btn-secondary btn-sm mt-4">
          작품 목록으로
        </Link>
      </div>
    )
  }

  const participants = novelParticipants(episodesOfNovel)
  const first = published.find((item) => item.id === novel.startEpisodeId) ?? published[0]
  const cover = imageUrl(novel.coverImage)
  const characters = novel.characters ?? []
  const sceneItems = scenesForEpisodes(episodesOfNovel).map(({ episode, scene }) => ({
    image: scene.image,
    caption: scene.caption,
    episodeNo: episode.no,
    episodeTitle: episode.title,
    href: `/novel/${novel.id}/ep/${episode.id}`,
  }))

  return (
    <div className="page-shell pt-6">
      {/* 작품 히어로 */}
      <section className="hero-band">
        <div className="hero-band-bg">
          {cover && <img src={cover} alt="" aria-hidden />}
        </div>
        <div className="hero-band-scrim" />
        <div className="hero-band-art">
          <img src={imageUrl(novel.heroImage ?? novel.coverImage)} alt="" aria-hidden />
        </div>

        <div className="relative z-[2] flex flex-col sm:flex-row gap-5 sm:gap-8 p-5 sm:p-8">
          <div
            className="w-[136px] sm:w-[182px] shrink-0 rounded-2xl overflow-hidden self-start"
            style={{ boxShadow: '0 30px 60px -30px rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.16)' }}
          >
            {cover ? (
              <img
                src={cover}
                alt={`${novel.title} 표지 일러스트`}
                className="w-full aspect-[3/4] object-cover"
              />
            ) : (
              <div
                className="w-full aspect-[3/4] flex items-end p-3"
                style={{ backgroundImage: `linear-gradient(150deg, ${novel.cover.from}, ${novel.cover.to})` }}
              >
                <span className="text-[34px]">{novel.cover.glyph}</span>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 text-[#fffaf7]">
            <div className="flex flex-wrap gap-1.5">
              {novel.genres.map((genre) => (
                <span key={genre} className="pill pill-ghost">
                  {genre}
                </span>
              ))}
              <span className="pill pill-ghost">{novel.status === 'ongoing' ? '연재 중' : '완결'}</span>
              {characters.length > 0 && <span className="pill pill-ghost">등장인물 {characters.length}인</span>}
              {sceneItems.length > 0 && <span className="pill pill-ghost">삽화 {sceneItems.length}컷</span>}
            </div>

            <h1 className="mt-3 text-[22px] sm:text-[34px] font-extrabold tracking-tight leading-snug">
              {novel.title}
            </h1>
            <p className="mt-1.5 text-[13px]" style={{ color: 'rgba(255,250,247,0.72)' }}>
              {novel.tagline}
            </p>
            <p className="mt-2 text-[12px]" style={{ color: 'rgba(255,250,247,0.56)' }}>
              글 {novel.penName}
            </p>

            <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-[12px]">
              <div>
                <dt style={{ color: 'rgba(255,250,247,0.5)' }}>공개 회차</dt>
                <dd className="mt-0.5 font-extrabold text-[15px]">
                  {published.length}화{pending.length > 0 ? ` (+${pending.length})` : ''}
                </dd>
              </div>
              <div>
                <dt style={{ color: 'rgba(255,250,247,0.5)' }}>누적 참여</dt>
                <dd className="mt-0.5 font-extrabold text-[15px]">{formatNumber(participants)}명</dd>
              </div>
              <div>
                <dt style={{ color: 'rgba(255,250,247,0.5)' }}>최근 업데이트</dt>
                <dd className="mt-0.5 font-extrabold text-[15px]">
                  {published.length > 0
                    ? formatRelative(published[published.length - 1].publishedAt)
                    : '-'}
                </dd>
              </div>
            </dl>

            <div className="mt-5 flex flex-wrap gap-2">
              {first && (
                <Link to={`/novel/${novel.id}/ep/${first.id}`} className="btn btn-light">
                  1화부터 읽기
                </Link>
              )}
              <Link to={`/novel/${novel.id}/tree`} className="btn btn-glass">
                분기 트리
              </Link>
              {characters.length > 0 && (
                <button
                  type="button"
                  className="btn btn-glass"
                  onClick={() =>
                    document
                      .getElementById('characters')
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                >
                  캐릭터 {characters.length}인
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 시놉시스 */}
      <section className="card mt-5 p-5 sm:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 lg:max-w-[680px]">
            <p className="eyebrow">Synopsis</p>
            <p
              className="mt-2.5 text-[13.5px] leading-[1.9]"
              style={{ color: 'var(--ink-soft)', wordBreak: 'keep-all' }}
            >
              {novel.synopsis}
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {novel.genres.map((genre) => (
                <span key={genre} className="pill pill-genre">
                  #{genre.replace(/\s/g, '')}
                </span>
              ))}
            </div>
          </div>

          <dl className="grid shrink-0 grid-cols-2 gap-x-8 gap-y-4 text-[12px] lg:text-right">
            {[
              { label: '필명', value: novel.penName },
              { label: '공개 회차', value: `${published.length}화` },
              { label: '등장인물', value: `${characters.length}인` },
              { label: '본문 삽화', value: `${sceneItems.length}컷` },
            ].map((item) => (
              <div key={item.label}>
                <dt style={{ color: 'var(--ink-mute)' }}>{item.label}</dt>
                <dd className="mt-1 text-[14px] font-extrabold">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* 등장인물 — 큰 포스터 카드 */}
      {characters.length > 0 && (
        <section id="characters" className="mt-8 scroll-mt-24">
          <div className="section-head">
            <div>
              <p className="eyebrow">Characters</p>
              <h2 className="section-title">등장인물</h2>
              <p className="mt-1.5 text-[12px]" style={{ color: 'var(--ink-mute)' }}>
                이 작품을 움직이는 {characters.length}명. 카드의 대사는 첫 등장 회차에서 가져왔습니다.
              </p>
            </div>
            <span className="chip chip-accent">{characters.length}명</span>
          </div>
          <CharacterStrip characters={characters} />
        </section>
      )}

      {/* 🎨 명장면 일러스트 갤러리 */}
      {sceneItems.length > 0 && (
        <section className="mt-8">
          <div className="section-head">
            <div>
              <p className="eyebrow">Scene Gallery</p>
              <h2 className="section-title">🎨 명장면 일러스트 갤러리</h2>
              <p className="mt-1.5 text-[12px]" style={{ color: 'var(--ink-mute)' }}>
                본문에 들어간 삽화 {sceneItems.length}컷. 눌러서 크게 보고, 그 장면의 회차로 바로 갑니다.
              </p>
            </div>
          </div>
          <SceneGallery items={sceneItems} />
        </section>
      )}

      <section className="card p-5 mt-4">
        <div className="flex items-end justify-between gap-3 mb-3">
          <div>
            <p className="eyebrow">Branching</p>
            <h2 className="text-[17px] font-extrabold mt-1">이야기는 이렇게 갈라집니다</h2>
          </div>
          <Link
            to={`/novel/${novel.id}/tree`}
            className="text-[11.5px] font-bold"
            style={{ color: 'var(--accent)' }}
          >
            크게 보기 →
          </Link>
        </div>
        <BranchTree novel={novel} episodes={episodesOfNovel} votes={votes} compact />
        <p className="mt-2 text-[11px]" style={{ color: 'var(--ink-mute)' }}>
          굵은 선이 지금 다수파가 고른 채택 루트, 점선은 아직 집필 중인 회차입니다.
          <span className="md:hidden"> 트리는 좌우로 밀어서 볼 수 있어요.</span>
        </p>
      </section>

      <section className="mt-8">
        <div className="section-head">
          <div>
            <p className="eyebrow">Episodes</p>
            <h2 className="section-title">회차 목록</h2>
          </div>
          <span className="text-[11.5px]" style={{ color: 'var(--ink-mute)' }}>
            총 {published.length + pending.length}화
          </span>
        </div>
        <ul className="grid grid-cols-1 gap-2">
          {[...published, ...pending].map((episode) => (
            <EpisodeRow
              key={episode.id}
              novelId={novel.id}
              episode={episode}
              voted={votes.some((vote) => vote.episodeId === episode.id)}
              leading={(() => {
                if (episode.choices.length === 0) return null
                const tally = tallyVotes(episode, votes)
                const leader = episode.choices.find((choice) => choice.id === tally.leaderId)
                return leader ? `${tally.percents[leader.id]}%` : null
              })()}
            />
          ))}
        </ul>
      </section>
    </div>
  )
}

function EpisodeRow({
  novelId,
  episode,
  voted,
  leading,
}: {
  novelId: string
  episode: Episode
  voted: boolean
  leading: string | null
}) {
  const pending = episode.status === 'pending'
  const content = (
    <>
      <span
        className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-[11.5px] font-extrabold tabular-nums"
        style={{
          background: pending ? 'var(--surface-2)' : 'var(--accent-soft)',
          color: pending ? 'var(--ink-mute)' : 'var(--accent-strong)',
        }}
      >
        {episode.no}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className="block text-[13.5px] font-bold truncate"
          style={{ color: pending ? 'var(--ink-mute)' : 'var(--ink)' }}
        >
          {episode.title}
        </span>
        {episode.branchLabel && (
          <span className="block text-[11px] truncate mt-0.5" style={{ color: 'var(--ink-mute)' }}>
            “{episode.branchLabel}” 루트
          </span>
        )}
      </span>
      <span className="shrink-0 text-right text-[11px]" style={{ color: 'var(--ink-mute)' }}>
        {pending ? (
          '집필 중'
        ) : voted ? (
          <span style={{ color: 'var(--accent)' }}>투표 완료</span>
        ) : episode.voteClosesAt ? (
          <Countdown closesAt={episode.voteClosesAt} className="text-[11px]" />
        ) : (
          leading ?? ''
        )}
      </span>
      {!pending && <span className="shrink-0 text-[13px]" style={{ color: 'var(--ink-mute)' }}>›</span>}
    </>
  )

  if (pending) {
    return (
      <li
        className="flex items-center gap-3 rounded-2xl border px-3.5 py-3"
        style={{ borderColor: 'var(--line)', borderStyle: 'dashed', background: 'var(--surface)' }}
      >
        {content}
      </li>
    )
  }

  return (
    <li>
      <Link
        to={`/novel/${novelId}/ep/${episode.id}`}
        className="card card-tap flex items-center gap-3 px-3.5 py-3"
      >
        {content}
      </Link>
    </li>
  )
}
