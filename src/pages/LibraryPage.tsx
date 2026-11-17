import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStore } from '../store/StoreProvider'
import { NovelCard } from '../components/NovelCard'
import { GENRE_GROUPS, inGroup, matchesQuery, tagsOfGroup } from '../lib/genres'
import { novelParticipants } from '../lib/vote'

type SortKey = 'new' | 'popular' | 'title'

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'new', label: '최신순' },
  { key: 'popular', label: '인기순' },
  { key: 'title', label: '제목순' },
]

export function LibraryPage() {
  const { ready, novels, episodes } = useStore()
  const [params, setParams] = useSearchParams()

  const initialGroup = params.get('genre')
  const [group, setGroup] = useState<string>(
    initialGroup && ['전체', ...GENRE_GROUPS.map((item) => item.name)].includes(initialGroup)
      ? initialGroup
      : '전체',
  )
  const [tag, setTag] = useState<string>('전체')
  const [query, setQuery] = useState<string>('')
  const [sort, setSort] = useState<SortKey>('new')

  // 홈에서 장르 링크로 들어온 경우 반영
  useEffect(() => {
    const next = params.get('genre')
    if (!next) return
    if (['전체', ...GENRE_GROUPS.map((item) => item.name)].includes(next)) {
      setGroup(next)
      setTag('전체')
    }
  }, [params])

  const tags = useMemo(() => tagsOfGroup(novels, group), [novels, group])

  const list = useMemo(() => {
    const filtered = novels.filter((novel) => {
      const inTag = tag === '전체' || novel.genres.includes(tag)
      return inGroup(novel, group) && inTag && matchesQuery(novel, query)
    })

    const participants = (novelId: string) =>
      novelParticipants(episodes.filter((episode) => episode.novelId === novelId))

    return [...filtered].sort((a, b) => {
      if (sort === 'popular') return participants(b.id) - participants(a.id)
      if (sort === 'title') return a.title.localeCompare(b.title, 'ko')
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [novels, episodes, group, tag, query, sort])

  const pickGroup = (next: string) => {
    setGroup(next)
    setTag('전체')
    const params = new URLSearchParams()
    if (next !== '전체') params.set('genre', next)
    setParams(params, { replace: true })
  }

  return (
    <div className="page-shell pt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Library</p>
          <h1 className="mt-1 text-[26px] sm:text-[30px] font-extrabold tracking-tight">작품 목록</h1>
          <p className="mt-2 text-[13px] max-w-[560px]" style={{ color: 'var(--ink-soft)' }}>
            연재 중인 선택형 웹소설 {novels.length}편. 로맨스부터 무협·SF·오컬트까지, 모든 작품은
            여섯 번의 양자택일과 세 개의 엔딩으로 이어집니다. 고른 만큼 내 소설이 됩니다.
          </p>
        </div>
        <span className="chip chip-accent">{list.length}편 표시 중</span>
      </div>

      {/* 대표 장르 */}
      <div className="genre-tabs mt-5" role="tablist" aria-label="대표 장르">
        {['전체', ...GENRE_GROUPS.map((item) => item.name)].map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={item === group}
            className="genre-tab"
            data-active={item === group}
            onClick={() => pickGroup(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {/* 세부 태그 */}
      <div className="tag-row mt-2" aria-label="세부 태그">
        {['전체', ...tags].map((item) => (
          <button
            key={item}
            type="button"
            className={item === tag ? 'chip chip-accent' : 'chip'}
            onClick={() => setTag(item)}
            style={item === tag ? undefined : { background: 'var(--surface)' }}
          >
            {item === '전체' ? '태그 전체' : `#${item.replace(/\s/g, '')}`}
          </button>
        ))}
      </div>

      {/* 검색 · 정렬 */}
      <div className="library-tools mt-4">
        <label className="library-search">
          <span aria-hidden>🔍</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="제목·필명·태그로 검색"
            aria-label="작품 검색"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="검색어 지우기">
              ×
            </button>
          )}
        </label>

        <div className="seg" role="group" aria-label="정렬">
          {SORTS.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-pressed={sort === item.key}
              data-active={sort === item.key}
              onClick={() => setSort(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {!ready ? (
        <p className="mt-10 text-[13px]" style={{ color: 'var(--ink-mute)' }}>
          불러오는 중…
        </p>
      ) : (
        <div className="mt-6 book-grid">
          {list.map((novel) => (
            <NovelCard
              key={novel.id}
              novel={novel}
              episodes={episodes.filter((episode) => episode.novelId === novel.id)}
            />
          ))}
        </div>
      )}

      {ready && list.length === 0 && (
        <div className="mt-10 text-[13px]" style={{ color: 'var(--ink-mute)' }}>
          <p>해당 조건의 작품이 없습니다.</p>
          <button
            type="button"
            className="btn btn-secondary btn-sm mt-3"
            onClick={() => {
              pickGroup('전체')
              setQuery('')
            }}
          >
            필터 초기화
          </button>
        </div>
      )}
    </div>
  )
}
