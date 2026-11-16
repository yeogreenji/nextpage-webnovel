import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useStore } from '../store/StoreProvider'
import { StoryMode } from '../components/StoryMode'

/**
 * /novel/:novelId/read — 정주행(소설로 쭉 읽기) 모드.
 * 회차·선택지 UI 없이 한 편의 웹소설로 읽히는 화면.
 * ?from=<episodeId> 로 넘어오면 그 회차부터 이어 읽습니다.
 */
export function StoryModePage() {
  const { novelId = '' } = useParams()
  const [search] = useSearchParams()
  const navigate = useNavigate()
  const { ready, novels } = useStore()
  const novel = novels.find((item) => item.id === novelId)
  const fromEpisodeId = search.get('from')
  const [lastEpisodeId, setLastEpisodeId] = useState<string | null>(fromEpisodeId)

  const exit = (episodeId: string) => {
    setLastEpisodeId(episodeId)
    navigate(`/novel/${novelId}/ep/${episodeId}`)
  }

  if (!ready) {
    return (
      <div className="page-shell py-24 text-center text-[13px]" style={{ color: 'var(--ink-mute)' }}>
        이야기를 펼치는 중…
      </div>
    )
  }

  if (!novel) {
    return (
      <div className="page-shell py-20 text-center">
        <p className="text-[15px] font-bold">작품을 찾을 수 없습니다.</p>
        <Link to="/library" className="btn btn-primary btn-sm mt-4">
          작품 목록으로
        </Link>
      </div>
    )
  }

  return <StoryMode novel={novel} fromEpisodeId={lastEpisodeId} onExit={exit} />
}
