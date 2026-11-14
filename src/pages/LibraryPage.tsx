import { useMemo, useState } from 'react'
import { useStore } from '../store/StoreProvider'
import { NovelCard } from '../components/NovelCard'

export function LibraryPage() {
  const { ready, novels, episodes } = useStore()
  const [genre, setGenre] = useState<string>('전체')

  const genres = useMemo(() => {
    const set = new Set<string>()
    novels.forEach((novel) => novel.genres.forEach((item) => set.add(item)))
    return ['전체', ...Array.from(set)]
  }, [novels])

  const list = novels.filter((novel) => genre === '전체' || novel.genres.includes(genre))

  return (
    <div className="page-shell pt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Library</p>
          <h1 className="mt-1 text-[26px] sm:text-[30px] font-extrabold tracking-tight">작품 목록</h1>
          <p className="mt-2 text-[13px] max-w-[560px]" style={{ color: 'var(--ink-soft)' }}>
            연재 중인 선택형 웹소설 {novels.length}편. 모든 작품은 회차마다 독자 투표로 갈라집니다.
          </p>
        </div>
        <span className="chip chip-accent">{list.length}편 표시 중</span>
      </div>

      <div className="mt-5 flex flex-wrap gap-1.5">
        {genres.map((item) => (
          <button
            key={item}
            type="button"
            className={item === genre ? 'chip chip-accent' : 'chip'}
            onClick={() => setGenre(item)}
            style={item === genre ? undefined : { background: 'var(--surface)' }}
          >
            {item}
          </button>
        ))}
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
        <p className="mt-10 text-[13px]" style={{ color: 'var(--ink-mute)' }}>
          해당 장르의 작품이 아직 없습니다.
        </p>
      )}
    </div>
  )
}
