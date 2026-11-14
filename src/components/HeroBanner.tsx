import { Link } from 'react-router-dom'
import type { Episode, Novel } from '../types'
import { imageUrl } from '../data/art'
import { formatNumber } from '../lib/format'
import { novelParticipants, nextOpenVote } from '../lib/vote'
import { Countdown } from './Countdown'

interface Props {
  novel: Novel
  episodes: Episode[]
}

/** 홈 상단 히어로 — 대표 작품의 아트워크 + 실시간 투표 유도 */
export function HeroBanner({ novel, episodes }: Props) {
  const open = nextOpenVote(episodes)
  const published = episodes.filter((episode) => episode.status === 'published')
  const participants = novelParticipants(episodes)
  const art = imageUrl(novel.heroImage ?? novel.coverImage)
  const cover = imageUrl(novel.coverImage)

  return (
    <section className="hero rise" aria-label="대표 작품">
      <div className="hero-art">
        {art && (
          <img
            className="hero-art-wide"
            src={art}
            alt={`${novel.title} 키 비주얼`}
            fetchPriority="high"
          />
        )}
        {cover && (
          <img
            className="hero-art-tall"
            src={cover}
            alt={`${novel.title} 표지 일러스트`}
            fetchPriority="high"
          />
        )}
      </div>
      <div className="hero-scrim" />

      <div className="hero-copy">
        <span className="live-badge">
          <span className="live-dot" aria-hidden />
          {open ? '실시간 독자 투표 진행 중' : '연재 중인 대표작'}
        </span>

        <p className="hero-eyebrow">
          {novel.genres[0]} · {novel.penName}
        </p>
        <h1 className="hero-title">{novel.title}</h1>
        <p className="hero-tagline">{novel.tagline}</p>

        <div className="mt-6 flex flex-wrap gap-2">
          {open ? (
            <Link
              className="btn btn-light"
              to={`/novel/${novel.id}/ep/${open.id}#vote`}
            >
              지금 투표하기 →
            </Link>
          ) : (
            <Link className="btn btn-light" to={`/novel/${novel.id}`}>
              작품 보러 가기 →
            </Link>
          )}
          <Link className="btn btn-glass" to={`/novel/${novel.id}`}>
            {open ? `${open.no}화 읽고 고르기` : '작품 정보'}
          </Link>
        </div>

        <dl className="hero-facts">
          <div className="hero-fact">
            <dt>연재</dt>
            <dd>{published.length}화</dd>
          </div>
          <div className="hero-fact">
            <dt>누적 참여</dt>
            <dd>{formatNumber(participants)}명</dd>
          </div>
          <div className="hero-fact">
            <dt>{open ? '투표 마감' : '최근 공개'}</dt>
            <dd>
              {open ? (
                <Countdown closesAt={open.voteClosesAt} className="text-[15px]" onDark />
              ) : (
                `${published[published.length - 1]?.no ?? 1}화`
              )}
            </dd>
          </div>
        </dl>
      </div>

      {cover && (
        <Link to={`/novel/${novel.id}`} className="hero-cover" aria-label={`${novel.title} 표지`}>
          <img src={cover} alt={`${novel.title} 표지 일러스트`} />
        </Link>
      )}
    </section>
  )
}
