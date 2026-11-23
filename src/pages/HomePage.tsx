import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store/StoreProvider'
import { NovelCard } from '../components/NovelCard'
import { NovelCarousel } from '../components/NovelCarousel'
import { CharacterSpotlight } from '../components/CharacterSpotlight'
import { SceneGallery } from '../components/SceneGallery'
import { Icon } from '../components/Icon'
import { imageUrl, scenesForEpisodes } from '../data/art'
import { ALL_FLOWS, flowFor } from '../data/flows'
import { allSessions, progressOf } from '../lib/play'
import { CURATIONS, GENRE_GROUPS, inCuration, inGroup, novelGroup } from '../lib/genres'
import { recentReading } from '../lib/library'
import { novelParticipants } from '../lib/vote'
import { formatNumber } from '../lib/format'
import {
  EPISODE_PRICE,
  FREE_EPISODE_NO,
  PASS,
  WAIT_FREE_EPISODE_NO,
  formatWon,
} from '../lib/commerce'

export function HomePage() {
  const { ready, novels, episodes, votes, openPricing, hasPass, passDays } = useStore()
  const sessions = useMemo(() => allSessions(), [])
  const recent = useMemo(() => recentReading(6), [])
  const curationCounts = useMemo(
    () =>
      CURATIONS.map((curation) => ({
        curation,
        count: novels.filter((novel) => inCuration(novel, curation)).length,
      })),
    [novels],
  )

  if (!ready) {
    return (
      <div className="page-shell py-24 text-center text-[13px]" style={{ color: 'var(--ink-mute)' }}>
        이야기를 불러오는 중…
      </div>
    )
  }

  const published = episodes.filter((episode) => episode.status === 'published')
  const characterCount = novels.reduce((sum, novel) => sum + (novel.characters?.length ?? 0), 0)
  const sceneTotal = ALL_FLOWS.reduce((sum, flow) => sum + flow.scenes.length, 0)
  const endingTotal = ALL_FLOWS.reduce((sum, flow) => sum + flow.endings.length, 0)

  // 피드: 최신 작품부터
  const feed = [...novels].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
  const groupCounts = GENRE_GROUPS.map((group) => ({
    name: group.name,
    count: novels.filter((novel) => inGroup(novel, group.name)).length,
  })).filter((item) => item.count > 0)

  // 랭킹 — 참여 수(시드 + 이 기기 투표)가 많은 순
  const ranking = [...novels]
    .map((novel) => {
      const own = episodes.filter((episode) => episode.novelId === novel.id)
      return {
        novel,
        participants: novelParticipants(own),
        publishedCount: own.filter((episode) => episode.status === 'published').length,
      }
    })
    .sort((a, b) => b.participants - a.participants)
    .slice(0, 5)

  // 스포트라이트: 모든 작품의 인물을 한 줄로
  const spotlight = novels.flatMap((novel) =>
    (novel.characters ?? []).map((character) => ({
      character,
      novelId: novel.id,
      novelTitle: novel.title,
      workLabel: novelGroup(novel),
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

  // 내가 쓰던 소설 (이 기기 기준)
  const inProgress = novels
    .map((novel) => {
      const flow = flowFor(novel.id)
      const session = sessions[novel.id]
      const progress = progressOf(flow, session ?? null)
      return { novel, flow, progress }
    })
    .filter((item) => item.flow && item.progress.done > 0)
    .sort((a, b) => Number(a.progress.complete) - Number(b.progress.complete))
    .slice(0, 3)

  return (
    <div className="page-shell home pt-5 pb-4">
      {/* ── 대표 작품 ─────────────────────────────── */}
      <NovelCarousel
        novels={novels}
        publishedCount={(novelId) =>
          episodes.filter((episode) => episode.novelId === novelId && episode.status === 'published').length
        }
      />

      {/* ── 플랫폼 지표 + 요금 한 줄 ───────────────── */}
      <div className="home-meta">
        <dl className="stat-bar">
          {[
            { label: '작품', value: `${novels.length}편` },
            { label: '선택 장면', value: `${sceneTotal}개` },
            { label: '엔딩', value: `${endingTotal}개` },
            { label: '등장인물', value: `${characterCount}인` },
          ].map((stat) => (
            <div key={stat.label}>
              <dt>{stat.label}</dt>
              <dd>{stat.value}</dd>
            </div>
          ))}
        </dl>
        <p className="home-terms">
          <Icon name="lock" size={13} />
          전 작품 {FREE_EPISODE_NO}화까지 무료 · {WAIT_FREE_EPISODE_NO}화 기다무 · 이후 대여권 1장 또는{' '}
          {EPISODE_PRICE.coins}코인
          <Link to="/about" className="home-terms-link">
            이용 안내
          </Link>
        </p>
      </div>

      {/* ── 랭킹 + 패스 안내 ──────────────────────── */}
      <div className="home-cols">
        <section className="home-block">
          <div className="section-head">
            <div>
              <p className="eyebrow">Ranking</p>
              <h2 className="section-title">지금 많이 읽는 작품</h2>
              <p className="section-sub">선택이 많이 모인 순서입니다. 1~2화는 무료로 바로 읽을 수 있어요.</p>
            </div>
            <Link to="/library" className="section-more">
              전체 작품 <Icon name="arrowRight" size={13} />
            </Link>
          </div>

          <ol className="rank-list">
            {ranking.map((item, index) => {
              const cover = imageUrl(item.novel.coverImage)
              const own = episodes.filter((episode) => episode.novelId === item.novel.id)
              const hasWait = own.some(
                (episode) => episode.status === 'published' && episode.no === WAIT_FREE_EPISODE_NO,
              )
              return (
                <li key={item.novel.id}>
                  <Link to={`/novel/${item.novel.id}`} className="rank-row">
                    <span className="rank-no">{String(index + 1).padStart(2, '0')}</span>
                    <span className="rank-cover">
                      {cover ? (
                        <img src={cover} alt="" loading="lazy" />
                      ) : (
                        <span
                          aria-hidden
                          style={{
                            backgroundImage: `linear-gradient(150deg, ${item.novel.cover.from}, ${item.novel.cover.to})`,
                          }}
                        />
                      )}
                    </span>
                    <span className="rank-body">
                      <span className="rank-genre">{novelGroup(item.novel)}</span>
                      <span className="rank-title">{item.novel.title}</span>
                      <span className="rank-meta">
                        {item.novel.penName} · {item.publishedCount}화 연재
                      </span>
                    </span>
                    <span className="rank-side">
                      <span className="rank-tags">
                        <span className="tag" data-tone="free">
                          무료
                        </span>
                        {hasWait && (
                          <span className="tag" data-tone="wait">
                            기다무
                          </span>
                        )}
                      </span>
                      <span className="rank-count">{formatNumber(item.participants)}명 참여</span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ol>
        </section>

        <aside className="home-aside">
          <div className="pass-promo">
            <p className="eyebrow">Next Pass</p>
            <h3 className="pass-promo-title">{PASS.name}</h3>
            <p className="pass-promo-price">
              {formatWon(PASS.price)}
              <em>/월</em>
            </p>
            <ul className="pass-promo-list">
              {PASS.features.slice(0, 3).map((feature) => (
                <li key={feature}>
                  <Icon name="check" size={13} /> {feature}
                </li>
              ))}
            </ul>
            {hasPass ? (
              <p className="pass-promo-status">이용 중 · 남은 기간 {passDays}일</p>
            ) : (
              <button type="button" className="btn btn-primary" onClick={() => openPricing('pass')}>
                무료 체험으로 시작
              </button>
            )}
            <button type="button" className="pass-promo-link" onClick={() => openPricing('coin')}>
              코인·대여권만 충전하기 <Icon name="arrowRight" size={13} />
            </button>
          </div>
        </aside>
      </div>

      {/* ── 최근 본 작품 ──────────────────────────── */}
      {recent.length > 0 && (
        <section className="home-block">
          <div className="section-head">
            <div>
              <p className="eyebrow">Continue Reading</p>
              <h2 className="section-title">최근 본 작품</h2>
              <p className="section-sub">읽던 회차에서 바로 이어집니다. 읽은 자리는 이 기기에 저장돼요.</p>
            </div>
            <Link to="/shelf" className="section-more">
              내 서재 <Icon name="arrowRight" size={13} />
            </Link>
          </div>
          <div className="reading-grid">
            {recent.flatMap((entry) => {
              const novel = novels.find((item) => item.id === entry.novelId)
              if (!novel) return []
              const cover = imageUrl(novel.coverImage)
              return [
                <Link key={novel.id} to={`/novel/${novel.id}/ep/${entry.episodeId}`} className="reading-row">
                  <span className="reading-thumb">
                    {cover ? <img src={cover} alt="" loading="lazy" /> : null}
                  </span>
                  <span className="reading-body">
                    <span className="reading-title">{novel.title}</span>
                    <span className="reading-sub">
                      {entry.episodeNo}화 · {entry.episodeTitle}
                    </span>
                    <span className="reading-meter">
                      <span style={{ width: `${Math.max(4, Math.round(entry.percent * 100))}%` }} />
                    </span>
                  </span>
                  <span className="reading-go">
                    이어 읽기 <Icon name="arrowRight" size={13} />
                  </span>
                </Link>,
              ]
            })}
          </div>
        </section>
      )}

      {/* ── 기획전 ────────────────────────────────── */}
      <section className="home-block">
        <div className="section-head">
          <div>
            <p className="eyebrow">Curated</p>
            <h2 className="section-title">오늘의 기획전</h2>
            <p className="section-sub">
              로맨스 · 로판 · 오피스/현대물 · 미스터리 — 지금 읽고 싶은 결로 바로 들어가세요.
            </p>
          </div>
          <Link to="/library" className="section-more">
            전체 보기 <Icon name="arrowRight" size={13} />
          </Link>
        </div>
        <div className="curation-grid">
          {curationCounts.map(({ curation, count }, index) => {
            const sample = novels.find((novel) => inCuration(novel, curation))
            const art = imageUrl(sample?.heroImage ?? sample?.coverImage)
            return (
              <Link key={curation.id} to={`/library?curation=${curation.id}`} className="curation-card">
                <span className="curation-media">
                  {art ? <img src={art} alt="" loading="lazy" /> : null}
                </span>
                <span className="curation-body">
                  <span className="curation-kicker">
                    {String(index + 1).padStart(2, '0')} · {count}편
                  </span>
                  <span className="curation-title">{curation.title}</span>
                  <span className="curation-desc">{curation.desc}</span>
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ── 이어 쓰던 소설 ────────────────────────── */}
      {inProgress.length > 0 && (
        <section className="home-block">
          <div className="section-head">
            <div>
              <p className="eyebrow">Continue</p>
              <h2 className="section-title">이어 쓰던 소설</h2>
              <p className="section-sub">고르던 자리에서 바로 이어집니다. 선택도 대사도 이 기기에 저장돼요.</p>
            </div>
            <span className="chip">{inProgress.length}편</span>
          </div>

          <div className="resume-grid">
            {inProgress.map(({ novel, progress }) => {
              const cover = imageUrl(novel.coverImage)
              return (
                <Link key={novel.id} to={`/novel/${novel.id}/play`} className="resume-card">
                  <span className="resume-cover">
                    {cover ? (
                      <img src={cover} alt="" loading="lazy" />
                    ) : (
                      <span
                        aria-hidden
                        style={{
                          backgroundImage: `linear-gradient(150deg, ${novel.cover.from}, ${novel.cover.to})`,
                        }}
                      />
                    )}
                  </span>
                  <span className="resume-body">
                    <span className="resume-title">{novel.title}</span>
                    <span className="resume-progress" aria-hidden>
                      <span style={{ width: `${progress.percent}%` }} />
                    </span>
                    <span className="resume-meta">
                      {progress.complete
                        ? '완성 · 엔딩 확인하기'
                        : `${progress.done} / ${progress.total} 선택 · 이어 쓰기`}
                    </span>
                  </span>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* ── 캐릭터 스포트라이트 ───────────────────── */}
      <div className="home-block">
        <CharacterSpotlight items={spotlight} />
      </div>

      {/* ── 명장면 갤러리 ─────────────────────────── */}
      {sceneRail.length > 0 && (
        <section className="home-block">
          <div className="section-head">
            <div>
              <p className="eyebrow">Scene Gallery</p>
              <h2 className="section-title">명장면 일러스트</h2>
              <p className="section-sub">장면마다 붙는 삽화입니다. 눌러서 크게 보고, 그 장면의 회차로 바로 가세요.</p>
            </div>
          </div>
          <SceneGallery items={sceneRail} layout="rail" />
        </section>
      )}

      {/* ── 작품 피드 ─────────────────────────────── */}
      <section className="home-block">
        <div className="section-head">
          <div>
            <p className="eyebrow">All titles</p>
            <h2 className="section-title">연재 중인 작품</h2>
            <p className="section-sub">
              모든 작품이 여섯 장면, 매 장면 3~4개의 갈래, 그리고 세 개의 엔딩으로 이어집니다.
            </p>
          </div>
          <Link to="/library" className="section-more">
            전체 보기 <Icon name="arrowRight" size={13} />
          </Link>
        </div>

        <div className="genre-tabs mb-4" aria-label="장르별로 보기">
          {groupCounts.map((item) => (
            <Link key={item.name} to={`/library?genre=${encodeURIComponent(item.name)}`} className="genre-tab">
              {item.name} <span>{item.count}</span>
            </Link>
          ))}
        </div>

        <div className="book-grid">
          {feed.map((novel) => (
            <NovelCard
              key={novel.id}
              novel={novel}
              episodes={episodes.filter((episode) => episode.novelId === novel.id)}
            />
          ))}
        </div>
      </section>

      {/* ── 요금 안내 ─────────────────────────────── */}
      <section className="home-block">
        <div className="section-head">
          <div>
            <p className="eyebrow">Plans</p>
            <h2 className="section-title">읽는 만큼, 또는 한 달 내내</h2>
            <p className="section-sub">무료 회차로 시작하고, 이어 읽고 싶을 때 대여권·코인·패스를 고르세요.</p>
          </div>
        </div>

        <div className="plan-grid">
          {[
            {
              id: 'free',
              kicker: 'Step 1',
              title: '무료 회차',
              price: '0원',
              unit: `전 작품 ${FREE_EPISODE_NO}화`,
              body: '작품마다 처음 두 회차는 무료입니다. 고르고, 말 걸고, 엔딩까지 맛보세요.',
              cta: '무료로 읽기',
              to: '/library',
            },
            {
              id: 'wait',
              kicker: 'Step 2',
              title: '기다무',
              price: '0원',
              unit: `${WAIT_FREE_EPISODE_NO}화 · 24시간`,
              body: '기다무를 신청하면 하루 뒤 무료로 열립니다. 급할 때는 대여권·코인으로 바로.',
              cta: '기다무 신청하기',
              to: '/library',
            },
          ].map((plan) => (
            <article key={plan.id} className="plan-card">
              <p className="eyebrow">{plan.kicker}</p>
              <h3 className="plan-title">{plan.title}</h3>
              <p className="plan-price">
                {plan.price}
                <em>{plan.unit}</em>
              </p>
              <p className="plan-body">{plan.body}</p>
              <Link to={plan.to} className="plan-cta">
                {plan.cta} <Icon name="arrowRight" size={13} />
              </Link>
            </article>
          ))}

          <article className="plan-card plan-card-pass">
            <p className="eyebrow">Unlimited</p>
            <h3 className="plan-title">{PASS.name}</h3>
            <p className="plan-price">
              {formatWon(PASS.price)}
              <em>/월</em>
            </p>
            <p className="plan-body">전 작품 유료 회차 무제한, 기다무 즉시 열람, 캐릭터 톡 무제한.</p>
            <button type="button" className="plan-cta" onClick={() => openPricing('pass')}>
              {hasPass ? `이용 중 (D-${passDays})` : `${PASS.trialDays}일 무료로 시작`}
              <Icon name="arrowRight" size={13} />
            </button>
          </article>
        </div>
      </section>

      {/* ── 진행 방식 ─────────────────────────────── */}
      <section className="home-block">
        <div className="section-head">
          <div>
            <p className="eyebrow">How it works</p>
            <h2 className="section-title">고르고, 말 걸고, 완성합니다</h2>
          </div>
        </div>
        <div className="how-grid">
          {[
            {
              step: '01',
              title: '장면마다 3~4개의 문장을 고른다',
              body: '한 작품에 여섯 장면. 고른 즉시 그 결과가 본문에 붙고, 그 문장이 다음 장면으로 이어집니다.',
            },
            {
              step: '02',
              title: '장면 속 인물에게 말을 건다',
              body: '말을 걸기 좋은 자리에서 인물과 대화하세요. 그 행동과 대사가 본문에 그대로 들어갑니다.',
            },
            {
              step: '03',
              title: '내 소설로 완성해 읽는다',
              body: '마지막 선택까지 마치면, 내가 고른 갈래와 넣은 대사가 한 편의 소설로 묶입니다. 엔딩은 세 개.',
            },
          ].map((item) => (
            <article key={item.step} className="how-card">
              <span className="how-step">{item.step}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── 마무리 ────────────────────────────────── */}
      <section className="home-block">
        <div className="cta-band">
          <div>
            <p className="eyebrow">Next Page</p>
            <h2>이 소설의 다음 문장은, 내가 쓴다</h2>
            <p>
              고르고, 말을 걸고, 완성하세요. {novels.length}편 모두 여섯 장면과 세 개의 엔딩으로
              이어집니다.
            </p>
          </div>
          <div className="cta-actions">
            <Link className="btn btn-primary" to="/library">
              작품 둘러보기
            </Link>
            <Link className="btn btn-secondary" to="/studio">
              작가 스튜디오
            </Link>
          </div>
        </div>
      </section>

      {votes.length > 0 && (
        <p className="home-foot-note">
          예전 회차에서 남긴 선택 {votes.length}개도 그대로 남아 있어요. 작품 화면에서 다시 볼 수
          있습니다.
        </p>
      )}
    </div>
  )
}
