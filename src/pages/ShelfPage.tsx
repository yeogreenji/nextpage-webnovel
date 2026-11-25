import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store/StoreProvider'
import { imageUrl } from '../data/art'
import { flowFor } from '../data/flows'
import { allSessions, progressOf } from '../lib/play'
import {
  endingProgress,
  endingTotals,
  recentReading,
  shelfEntries,
  toggleShelf,
} from '../lib/library'
import { formatRelative } from '../lib/format'
import { Icon } from '../components/Icon'
import type { IconName } from '../components/Icon'

type Tab = 'recent' | 'shelf' | 'endings'

const TABS: { key: Tab; label: string; icon: IconName }[] = [
  { key: 'recent', label: '최근 본 작품', icon: 'clock' },
  { key: 'shelf', label: '내 서재', icon: 'heart' },
  { key: 'endings', label: '엔딩 도감', icon: 'sparkle' },
]

/**
 * 📚 내 서재 — 최근 본 작품(이어보기) · 찜한 작품 · 엔딩 도감.
 * — 로그인 없이, 이 기기에 저장된 독서 기록으로 채워집니다.
 */
export function ShelfPage() {
  const { ready, novels, episodes, notify } = useStore()
  const [tab, setTab] = useState<Tab>('recent')
  const [tick, setTick] = useState(0)

  // 찜·독서 기록은 localStorage 에 있으므로 화면에 들어올 때마다 새로 읽습니다.
  useEffect(() => {
    setTick((value) => value + 1)
  }, [ready])

  const reading = useMemo(() => recentReading(24), [tick, ready])
  const shelf = useMemo(() => shelfEntries(), [tick, ready])
  const sessions = useMemo(() => allSessions(), [tick, ready])

  const flows = useMemo(
    () => novels.map((novel) => ({ novel, flow: flowFor(novel.id) })),
    [novels],
  )
  const totals = useMemo(
    () => endingTotals(flows.map((item) => ({ novelId: item.novel.id, flow: item.flow }))),
    [flows],
  )

  const removeFromShelf = useCallback(
    (novelId: string) => {
      toggleShelf(novelId)
      setTick((value) => value + 1)
      notify('내 서재에서 뺐어요')
    },
    [notify],
  )

  if (!ready) {
    return (
      <div className="page-shell py-24 text-center text-[13px]" style={{ color: 'var(--ink-mute)' }}>
        서재를 여는 중…
      </div>
    )
  }

  const readingRows = reading.flatMap((entry) => {
    const novel = novels.find((item) => item.id === entry.novelId)
    return novel ? [{ entry, novel }] : []
  })

  const shelfRows = shelf
    .flatMap((entry) => {
      const novel = novels.find((item) => item.id === entry.novelId)
      return novel ? [{ entry, novel }] : []
    })
    .reverse()

  const collection = flows
    .map(({ novel, flow }) => ({
      novel,
      flow,
      progress: endingProgress(novel.id, flow),
      session: sessions[novel.id],
    }))
    .filter((item) => item.flow)
    .sort((a, b) => b.progress.unlocked - a.progress.unlocked || a.novel.title.localeCompare(b.novel.title, 'ko'))

  return (
    <div className="page-shell pt-7 pb-4">
      <section className="shelf-hero">
        <p className="eyebrow">My Shelf</p>
        <h1 className="mt-1 text-[26px] sm:text-[30px] font-extrabold tracking-tight">내 서재</h1>
        <p className="mt-2 max-w-[560px] text-[13px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
          읽던 자리, 찜한 작품, 그리고 아직 보지 못한 엔딩까지. 이 기기에 남은 기록으로 서재를
          채웁니다.
        </p>
        <dl className="shelf-stats">
          <div className="shelf-stat">
            <dt>읽던 작품</dt>
            <dd>{readingRows.length}</dd>
          </div>
          <div className="shelf-stat">
            <dt>찜한 작품</dt>
            <dd>{shelfRows.length}</dd>
          </div>
          <div className="shelf-stat">
            <dt>모은 엔딩</dt>
            <dd>
              {totals.unlocked}
              <span className="text-[12px] font-bold" style={{ color: 'var(--ink-mute)' }}>
                {' '}
                / {totals.total}
              </span>
            </dd>
          </div>
        </dl>
      </section>

      <div className="shelf-tabs mt-5" role="tablist" aria-label="서재 보기">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            className="shelf-tab"
            data-active={tab === item.key}
            onClick={() => setTab(item.key)}
          >
            <Icon name={item.icon} size={13} /> {item.label}
          </button>
        ))}
      </div>

      {tab === 'recent' && (
        <section className="mt-4">
          {readingRows.length === 0 ? (
            <EmptyState
              title="아직 읽은 작품이 없어요"
              body="회차를 한 번 열면 이 자리에 이어 읽을 작품이 쌓입니다."
              href="/library"
              cta="작품 둘러보기"
            />
          ) : (
            <ul className="grid gap-2.5">
              {readingRows.map(({ entry, novel }) => {
                const cover = imageUrl(novel.coverImage)
                const flow = flowFor(novel.id)
                const play = progressOf(flow, sessions[novel.id] ?? null)
                return (
                  <li key={novel.id}>
                    <div className="reading-row">
                      <Link
                        to={`/novel/${novel.id}/ep/${entry.episodeId}`}
                        className="reading-thumb"
                        aria-label={`${novel.title} ${entry.episodeNo}화 이어 읽기`}
                      >
                        {cover ? <img src={cover} alt="" loading="lazy" /> : null}
                      </Link>
                      <div className="reading-body">
                        <Link to={`/novel/${novel.id}`} className="reading-title">
                          {novel.title}
                        </Link>
                        <span className="reading-sub">
                          {entry.episodeNo}화 · {entry.episodeTitle} · {formatRelative(entry.at)}
                        </span>
                        <span className="reading-meter" aria-label={`회차 읽기 ${Math.round(entry.percent * 100)}%`}>
                          <span style={{ width: `${Math.max(4, Math.round(entry.percent * 100))}%` }} />
                        </span>
                        {flow && (
                          <span className="reading-sub">
                            선택형 {play.done}/{play.total}
                            {play.complete ? ' · 완성함' : ''}
                          </span>
                        )}
                      </div>
                      <span className="flex shrink-0 flex-col items-end gap-1.5">
                        <Link
                          to={`/novel/${novel.id}/ep/${entry.episodeId}`}
                          className="reading-go"
                        >
                          이어 읽기 →
                        </Link>
                        {flow && (
                          <Link to={`/novel/${novel.id}/play`} className="reading-go" style={{ color: 'var(--ink-mute)' }}>
                            내 소설 →
                          </Link>
                        )}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      )}

      {tab === 'shelf' && (
        <section className="mt-4">
          {shelfRows.length === 0 ? (
            <EmptyState
              title="찜한 작품이 없어요"
              body="작품 카드의 ♡ 를 누르면 이 자리에 담깁니다. 나중에 한 번에 모아 보세요."
              href="/library"
              cta="작품 둘러보기"
            />
          ) : (
            <ul className="grid gap-2.5">
              {shelfRows.map(({ entry, novel }) => {
                const cover = imageUrl(novel.coverImage)
                const flow = flowFor(novel.id)
                const progress = progressOf(flow, sessions[novel.id] ?? null)
                return (
                  <li key={novel.id}>
                    <div className="reading-row">
                      <Link to={`/novel/${novel.id}`} className="reading-thumb" aria-label={novel.title}>
                        {cover ? <img src={cover} alt="" loading="lazy" /> : null}
                      </Link>
                      <div className="reading-body">
                        <Link to={`/novel/${novel.id}`} className="reading-title">
                          {novel.title}
                        </Link>
                        <span className="reading-sub">
                          {novel.genres.slice(0, 2).join(' · ')} · 찜 {formatRelative(entry.at)}
                        </span>
                        <span className="reading-sub">
                          {flow
                            ? progress.complete
                              ? '내 소설 완성 · 엔딩 확인하기'
                              : progress.done > 0
                                ? `${progress.done}/${progress.total} 선택 — 이어 쓰기`
                                : `${flow.scenes.length}화 · 엔딩 ${flow.endings.length}개`
                            : '회차 연재 중'}
                        </span>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <Link to={`/novel/${novel.id}/play`} className="reading-go">
                          {progress.done > 0 ? '이어 쓰기 →' : '시작하기 →'}
                        </Link>
                        <button
                          type="button"
                          className="reading-go"
                          style={{ color: 'var(--ink-mute)' }}
                          onClick={() => removeFromShelf(novel.id)}
                        >
                          빼기
                        </button>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      )}

      {tab === 'endings' && (
        <section className="mt-4">
          <p className="mb-3 text-[12px] leading-relaxed" style={{ color: 'var(--ink-mute)' }}>
            마지막 장면에서 고른 갈래가 엔딩을 정합니다. 아직 보지 못한 엔딩은 이름을 가려 두었어요.
            모은 엔딩 {totals.unlocked} / {totals.total}.
          </p>
          <div className="codex-grid">
            {collection.map(({ novel, progress }) => {
              const cover = imageUrl(novel.coverImage)
              return (
                <article key={novel.id} className="codex-card">
                  <div className="codex-head">
                    <Link to={`/novel/${novel.id}`} className="codex-thumb" aria-label={novel.title}>
                      {cover ? <img src={cover} alt="" loading="lazy" /> : null}
                    </Link>
                    <Link to={`/novel/${novel.id}/play`} className="codex-title">
                      {novel.title}
                    </Link>
                    <span className="codex-count" data-complete={progress.complete}>
                      {progress.unlocked}/{progress.total}
                    </span>
                  </div>
                  <div className="codex-progress" aria-hidden>
                    <span style={{ width: `${progress.total ? (progress.unlocked / progress.total) * 100 : 0}%` }} />
                  </div>
                  <div className="codex-slots">
                    {progress.items.map((slot) => (
                      <div
                        key={slot.ending.id}
                        className="codex-slot"
                        data-unlocked={slot.unlocked}
                      >
                        <span className="codex-slot-tone" aria-hidden>
                          {slot.ending.tone}
                        </span>
                        <span className="codex-slot-name">
                          {slot.unlocked ? slot.ending.name : '아직 보지 못한 엔딩'}
                        </span>
                        {slot.unlocked ? (
                          <span className="codex-slot-go">
                            {slot.at ? formatRelative(slot.at) : '방금'}
                          </span>
                        ) : (
                          <Link to={`/novel/${novel.id}/play`} className="codex-slot-go" style={{ color: 'var(--accent)' }}>
                            열기 →
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      )}

      {episodes.length === 0 && (
        <p className="mt-6 text-[12px]" style={{ color: 'var(--ink-mute)' }}>
          작품을 불러오지 못했어요. 잠시 뒤 새로고침해 주세요.
        </p>
      )}
    </div>
  )
}

function EmptyState({
  title,
  body,
  href,
  cta,
}: {
  title: string
  body: string
  href: string
  cta: string
}) {
  return (
    <div className="card p-7 text-center">
      <p className="eyebrow">Empty</p>
      <h2 className="mt-1.5 text-[17px] font-extrabold">{title}</h2>
      <p className="mx-auto mt-2 max-w-[420px] text-[12.5px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
        {body}
      </p>
      <Link to={href} className="btn btn-primary btn-sm mt-4">
        {cta}
      </Link>
    </div>
  )
}
