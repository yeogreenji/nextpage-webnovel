import { Link, useParams } from 'react-router-dom'
import { useStore } from '../store/StoreProvider'
import { BranchTree } from '../components/BranchTree'
import { imageUrl } from '../data/art'

export function TreePage() {
  const { novelId = '' } = useParams()
  const { ready, novels, episodes, votes } = useStore()
  const novel = novels.find((item) => item.id === novelId)
  const episodesOfNovel = episodes.filter((item) => item.novelId === novelId)

  if (!ready) {
    return (
      <div className="page-shell py-20 text-center text-[13px]" style={{ color: 'var(--ink-mute)' }}>
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

  return (
    <div className="page-shell pt-6">
      <nav className="flex items-center gap-1.5 text-[11.5px] mb-4" style={{ color: 'var(--ink-mute)' }}>
        <Link to={`/novel/${novel.id}`} className="hover:underline truncate max-w-[60vw]">
          {novel.title}
        </Link>
        <span aria-hidden>·</span>
        <span>분기 트리</span>
      </nav>

      <section className="hero-band mb-5">
        <div className="hero-band-bg">
          {imageUrl(novel.coverImage) && <img src={imageUrl(novel.coverImage)} alt="" aria-hidden />}
        </div>
        <div className="hero-band-scrim" />
        <div className="relative z-[2] p-6 sm:p-8 text-[#fffaf7]">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="pill pill-ghost">Branching Tree</span>
            <span className="pill pill-ghost">{novel.genres[0]}</span>
          </div>
          <h1 className="mt-3 text-[22px] sm:text-[27px] font-extrabold tracking-tight">
            이야기 분기 트리
          </h1>
          <p
            className="mt-2 text-[12.5px] leading-relaxed max-w-[560px]"
            style={{ color: 'rgba(255,250,247,0.72)' }}
          >
            회차마다 독자가 고른 방향으로 다음 화가 이어집니다. 채택 루트는 계속 이어지고, 미채택
            루트도 읽을 수 있습니다. 회차를 눌러 바로 이동하세요.
          </p>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3 text-[11.5px]" style={{ color: 'var(--ink-mute)' }}>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-6 h-[2.4px] rounded" style={{ background: 'var(--accent)' }} />
          채택 루트
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-6 h-[1.6px] rounded" style={{ background: 'var(--line)' }} />
          미채택 루트
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block w-6 h-[1.6px] rounded"
            style={{ backgroundImage: 'repeating-linear-gradient(90deg, var(--ink-mute) 0 5px, transparent 5px 10px)' }}
          />
          집필 중
        </span>
      </div>

      <section className="card p-4 sm:p-6 mt-4">
        <BranchTree novel={novel} episodes={episodesOfNovel} votes={votes} />
      </section>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link to={`/novel/${novel.id}`} className="btn btn-secondary btn-sm">
          작품 페이지
        </Link>
        <Link to="/studio" className="btn btn-ghost btn-sm">
          다음 화 집필하기
        </Link>
      </div>
    </div>
  )
}
