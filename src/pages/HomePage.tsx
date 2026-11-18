import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store/StoreProvider'
import { NovelCard } from '../components/NovelCard'
import { NovelCarousel } from '../components/NovelCarousel'
import { CharacterSpotlight } from '../components/CharacterSpotlight'
import { SceneGallery } from '../components/SceneGallery'
import { imageUrl, scenesForEpisodes } from '../data/art'
import { ALL_FLOWS, flowFor } from '../data/flows'
import { allSessions, progressOf } from '../lib/play'
import { GENRE_GROUPS, inGroup, novelGroup } from '../lib/genres'

export function HomePage() {
  const { ready, novels, episodes, votes } = useStore()
  const sessions = useMemo(() => allSessions(), [])

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

  // 피드: 최신 작품부터, 대표 장르별로도 바로 들어갈 수 있게
  const feed = [...novels].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
  const groupCounts = GENRE_GROUPS.map((group) => ({
    name: group.name,
    count: novels.filter((novel) => inGroup(novel, group.name)).length,
  })).filter((item) => item.count > 0)

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
    <div className="page-shell pt-5 pb-4">
      {/* 🎞 최상단 작품 선택 슬라이드 */}
      <NovelCarousel
        novels={novels}
        publishedCount={(novelId) =>
          episodes.filter((episode) => episode.novelId === novelId && episode.status === 'published').length
        }
      />

      {/* 요약 지표 */}
      <dl className="stat-bar mt-6">
        {[
          { label: '작품', value: `${novels.length}편` },
          { label: '선택 장면', value: `${sceneTotal}개` },
          { label: '도달 가능한 엔딩', value: `${endingTotal}개` },
          { label: '등장인물', value: `${characterCount}인` },
        ].map((stat) => (
          <div key={stat.label}>
            <dt>{stat.label}</dt>
            <dd>{stat.value}</dd>
          </div>
        ))}
      </dl>

      {/* 이어 쓰던 소설 */}
      {inProgress.length > 0 && (
        <section className="mt-11">
          <div className="section-head">
            <div>
              <p className="eyebrow">Continue</p>
              <h2 className="section-title">이어 쓰던 소설</h2>
              <p className="mt-1.5 text-[12px]" style={{ color: 'var(--ink-mute)' }}>
                고르던 자리에서 바로 이어집니다. 선택도 대사도 이 기기에 저장되어 있어요.
              </p>
            </div>
            <span className="chip chip-accent">{inProgress.length}편</span>
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
                        ? `완성 · 엔딩 확인하기`
                        : `${progress.done} / ${progress.total} 선택 · 이어 쓰기 →`}
                    </span>
                  </span>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* ✨ 캐릭터 스포트라이트 */}
      <div className="mt-11">
        <CharacterSpotlight items={spotlight} />
      </div>

      {/* 🎨 명장면 갤러리 */}
      {sceneRail.length > 0 && (
        <section className="mt-11">
          <div className="section-head">
            <div>
              <p className="eyebrow">Scene Gallery</p>
              <h2 className="section-title">🎨 명장면 일러스트</h2>
              <p className="mt-1.5 text-[12px]" style={{ color: 'var(--ink-mute)' }}>
                장면마다 붙는 삽화입니다. 눌러서 크게 보고, 그 장면의 회차로 바로 들어가세요.
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
            <p className="mt-1.5 text-[12px]" style={{ color: 'var(--ink-mute)' }}>
              모든 작품이 여섯 장면, 매 장면 3~4개의 갈래, 그리고 세 개의 엔딩으로 이어집니다.
            </p>
          </div>
          <Link to="/library" className="text-[12px] font-bold" style={{ color: 'var(--accent)' }}>
            전체 보기 →
          </Link>
        </div>

        <div className="genre-tabs mb-4" aria-label="장르별로 보기">
          {groupCounts.map((item) => (
            <Link
              key={item.name}
              to={`/library?genre=${encodeURIComponent(item.name)}`}
              className="genre-tab"
            >
              {item.name} <span style={{ opacity: 0.6 }}>{item.count}</span>
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

      {/* 진행 방식 */}
      <section className="mt-12">
        <div className="section-head">
          <div>
            <p className="eyebrow">How it works</p>
            <h2 className="section-title">고르고, 말 걸고, 완성합니다</h2>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
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
              이 소설의 다음 문장은, 내가 쓴다
            </h2>
            <p className="mt-2 text-[12.5px] opacity-80">
              고르고, 말을 걸고, 완성하세요. {novels.length}편 모두 여섯 장면과 세 개의 엔딩으로
              이어집니다.
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

      {votes.length > 0 && (
        <p className="mt-6 text-[11.5px]" style={{ color: 'var(--ink-mute)' }}>
          예전 회차에서 남긴 선택 {votes.length}개도 그대로 남아 있어요. 작품 화면에서 다시 볼 수
          있습니다.
        </p>
      )}
    </div>
  )
}
