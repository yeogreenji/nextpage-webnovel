import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useStore } from '../store/StoreProvider'
import { BranchTree } from '../components/BranchTree'
import { CharacterStrip } from '../components/CharacterStrip'
import { SceneGallery } from '../components/SceneGallery'
import { Countdown } from '../components/Countdown'
import { CharacterTalkSection } from '../components/CharacterTalkSection'
import { formatRelative } from '../lib/format'
import { tallyVotes } from '../lib/vote'
import { imageUrl, scenesForEpisodes } from '../data/art'
import { flowFor } from '../data/flows'
import { allSessions, progressOf } from '../lib/play'
import type { Episode } from '../types'
import { endingProgress, isOnShelf, readingOf, toggleShelf } from '../lib/library'
import { pricingSummary, episodeAccess, accessBadge, FREE_EPISODE_NO } from '../lib/commerce'
import { Icon } from '../components/Icon'

export function NovelPage() {
  const { novelId = '' } = useParams()
  const location = useLocation()
  const { ready, novels, episodes, votes, notify, wallet } = useStore()
  const [shelfOn, setShelfOn] = useState(() => (novelId ? isOnShelf(novelId) : false))
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

  const flow = flowFor(novel.id)
  const reading = readingOf(novel.id)
  const codex = endingProgress(novel.id, flow)
  const playSession = allSessions()[novel.id]
  const playProgress = progressOf(flow, playSession ?? null)
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
          {imageUrl(novel.heroImage ?? novel.coverImage) ? (
            <img src={imageUrl(novel.heroImage ?? novel.coverImage)} alt="" aria-hidden />
          ) : (
            <div
              className="hero-band-art-fallback"
              aria-hidden
              style={{
                backgroundImage: `radial-gradient(120% 120% at 20% 0%, ${novel.cover.from}, ${novel.cover.to})`,
              }}
            >
              <span>{novel.cover.glyph}</span>
            </div>
          )}
        </div>

        <div className="novel-hero-inner flex flex-col sm:flex-row gap-5 sm:gap-8 p-5 sm:p-8">
          <div className="novel-hero-cover">
            {cover ? (
              <img src={cover} alt={`${novel.title} 표지 일러스트`} />
            ) : (
              <div
                style={{ backgroundImage: `linear-gradient(150deg, ${novel.cover.from}, ${novel.cover.to})` }}
              >
                <span>{novel.cover.glyph}</span>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 novel-hero-body">
            <div className="novel-hero-tags">
              {novel.genres.slice(0, 2).map((genre) => (
                <span key={genre} className="tag">
                  {genre}
                </span>
              ))}
              <span className="tag tag-ink">{novel.status === 'ongoing' ? '연재 중' : '완결'}</span>
              {characters.length > 0 && <span className="tag">등장인물 {characters.length}인</span>}
              {sceneItems.length > 0 && <span className="tag">삽화 {sceneItems.length}컷</span>}
            </div>

            <h1 className="novel-hero-title">{novel.title}</h1>
            <p className="novel-hero-tagline">{novel.tagline}</p>
            <p className="novel-hero-pen">
              글 {novel.penName}
              {published.length > 0 && (
                <>
                  <span aria-hidden>·</span>
                  최근 업데이트 {formatRelative(published[published.length - 1].publishedAt)}
                </>
              )}
            </p>

            <dl className="novel-hero-facts">
              <div>
                <dt>공개 회차</dt>
                <dd>
                  {published.length}화{pending.length > 0 ? ` (+${pending.length})` : ''}
                </dd>
              </div>
              <div>
                <dt>선택 장면</dt>
                <dd>{flow ? `${flow.scenes.length}번` : '-'}</dd>
              </div>
              <div>
                <dt>엔딩</dt>
                <dd>{flow ? `${flow.endings.length}개` : '-'}</dd>
              </div>
            </dl>

            <p className="novel-hero-pricing">
              <Icon name="lock" size={13} /> {pricingSummary(published)}
            </p>

            <div className="novel-hero-actions">
              {first && (
                <Link to={`/novel/${novel.id}/ep/${first.id}`} className="btn btn-primary">
                  {FREE_EPISODE_NO}화까지 무료로 읽기
                </Link>
              )}
              {flow && (
                <Link to={`/novel/${novel.id}/play`} className="btn btn-secondary">
                  {playProgress.complete
                    ? '내가 완성한 소설 읽기'
                    : playProgress.done > 0
                      ? `이어서 쓰기 (${playProgress.done}/${playProgress.total})`
                      : '내가 고르는 소설로 시작'}
                </Link>
              )}
              {first && (
                <Link to={`/novel/${novel.id}/read`} className="btn btn-ghost">
                  <Icon name="bookOpen" size={15} /> 소설로 쭉 읽기
                </Link>
              )}
              <button
                type="button"
                className="btn btn-ghost"
                data-on={shelfOn}
                aria-pressed={shelfOn}
                onClick={() => {
                  const added = toggleShelf(novel.id)
                  setShelfOn(added)
                  notify(added ? '내 서재에 담았어요' : '내 서재에서 뺐어요')
                }}
              >
                <Icon name={shelfOn ? 'heartFilled' : 'heart'} size={15} />
                {shelfOn ? '서재에 담김' : '서재에 담기'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 이어 읽기 */}
      {reading && (
        <div className="resume-bar">
          <p>
            <Icon name="clock" size={14} />
            <b>
              {reading.episodeNo}화 · {reading.episodeTitle}
            </b>
            까지 읽었어요
            {reading.percent > 0 && ` · ${Math.round(reading.percent * 100)}%`}
          </p>
          <Link to={`/novel/${novel.id}/ep/${reading.episodeId}`} className="btn btn-secondary btn-sm">
            이어 읽기
            <Icon name="arrowRight" size={13} />
          </Link>
        </div>
      )}

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

      {/* 엔딩 도감(작품) */}
      {flow && (
        <section className="card mt-5 p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Ending Collection</p>
              <h2 className="mt-1 text-[17px] font-extrabold">이 작품의 엔딩 {flow.endings.length}개</h2>
              <p className="mt-1 text-[12px]" style={{ color: 'var(--ink-mute)' }}>
                마지막 장면에서 고른 갈래가 엔딩을 정합니다. 모은 엔딩 {codex.unlocked} / {codex.total}.
              </p>
            </div>
            <Link to="/shelf" className="text-[11.5px] font-bold" style={{ color: 'var(--accent)' }}>
              엔딩 도감 전체 →
            </Link>
          </div>
          <div className="novel-collect mt-3">
            {codex.items.map((slot) => (
              <div key={slot.ending.id} className="novel-collect-item" data-unlocked={slot.unlocked}>
                <b>{slot.unlocked ? slot.ending.name : '??? (미발견)'}</b>
                <span>{slot.unlocked ? slot.ending.tone : slot.ending.tone} · {slot.unlocked ? '도달함' : '아직'}</span>
              </div>
            ))}
          </div>
        </section>
      )}

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

      {/* 💬 캐릭터 톡 */}
      {characters.length > 0 && (
        <CharacterTalkSection novel={novel} characters={characters} currentEpisode={first} />
      )}

      {/* 🎨 명장면 일러스트 갤러리 */}
      {sceneItems.length > 0 && (
        <section className="mt-8">
          <div className="section-head">
            <div>
              <p className="eyebrow">Scene Gallery</p>
              <h2 className="section-title">명장면 일러스트 갤러리</h2>
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
            <p className="section-sub">
              {pricingSummary(published)} · {published.length + pending.length}화
            </p>
          </div>
          <Link to="/about" className="section-more">
            이용 안내 <Icon name="arrowRight" size={13} />
          </Link>
        </div>
        <ul className="ep-list">
          {[...published, ...pending].map((episode) => (
            <EpisodeRow
              key={episode.id}
              novelId={novel.id}
              episode={episode}
              access={episodeAccess(episode, wallet)}
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
  access,
  voted,
  leading,
}: {
  novelId: string
  episode: Episode
  access: ReturnType<typeof episodeAccess>
  voted: boolean
  leading: string | null
}) {
  const pending = episode.status === 'pending'
  const locked = access.kind === 'locked' || access.kind === 'waiting'
  const content = (
    <>
      <span className="ep-no">{String(episode.no).padStart(2, '0')}</span>
      <span className="ep-main">
        <span className="ep-title">
          {episode.title}
          {locked && (
            <span className="ep-lock-icon" aria-label="잠김">
              <Icon name={access.kind === 'waiting' ? 'clock' : 'lock'} size={12} />
            </span>
          )}
        </span>
        {episode.branchLabel && <span className="ep-sub">“{episode.branchLabel}” 루트</span>}
      </span>
      <span className="ep-state">
        {pending ? (
          <span className="tag">집필 중</span>
        ) : (
          <span
            className="tag"
            data-tone={
              access.kind === 'locked' ? 'paid' : access.kind === 'waiting' || access.kind === 'waitfree' ? 'wait' : 'free'
            }
          >
            {accessBadge(access)}
          </span>
        )}
        {!pending && voted && <span className="ep-voted">투표함</span>}
        {!pending && !voted && episode.voteClosesAt && (
          <Countdown closesAt={episode.voteClosesAt} className="ep-countdown" />
        )}
        {!pending && !voted && !episode.voteClosesAt && leading && (
          <span className="ep-leading">{leading}</span>
        )}
      </span>
      {!pending && <Icon name="chevronRight" size={15} className="ep-go" />}
    </>
  )

  if (pending) {
    return <li className="ep-row" data-state="pending">{content}</li>
  }

  return (
    <li>
      <Link to={`/novel/${novelId}/ep/${episode.id}`} className="ep-row" data-state={locked ? 'locked' : 'open'}>
        {content}
      </Link>
    </li>
  )
}
