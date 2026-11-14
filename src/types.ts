/** 넥스트페이지 공용 타입 정의 */

export type ThemeName = 'light' | 'sepia' | 'dark'

/** 회차 끝에서 독자가 고르는 선택지 */
export interface Choice {
  id: string
  /** 선택지 문구 (버튼에 그대로 노출) */
  label: string
  /** 선택지 부연 설명 */
  hint: string
  /** 선택 시 이어질 회차 id. null 이면 아직 집필 중 */
  targetEpisodeId: string | null
  /** 실제 독자가 고른 누적 수 (시드 + 이 기기에서의 투표) */
  baseVotes: number
}

export type EpisodeStatus = 'published' | 'pending'

/** 회차 = 분기 트리의 노드 */
export interface Episode {
  id: string
  novelId: string
  /** 작품 내 회차 번호 */
  no: number
  title: string
  /** 본문. 문단은 빈 줄(\n\n)로 구분 */
  body: string
  publishedAt: string
  /** 이 회차로 이어진 부모 회차 */
  parentEpisodeId: string | null
  /** 부모 회차에서 어떤 선택으로 이 회차에 도달했는지 */
  branchLabel: string | null
  choices: Choice[]
  /** 투표 마감 시각 (ISO). null 이면 마감 없음 */
  voteClosesAt: string | null
  status: EpisodeStatus
}

export interface NovelCover {
  /** 카드/표지 그라데이션 색상 */
  from: string
  to: string
  /** 표지 글리프 */
  glyph: string
}

export interface Novel {
  id: string
  title: string
  tagline: string
  synopsis: string
  genres: string[]
  penName: string
  cover: NovelCover
  startEpisodeId: string
  createdAt: string
  status: 'ongoing' | 'completed'
}

export interface Comment {
  id: string
  novelId: string
  episodeId: string
  author: string
  text: string
  createdAt: string
  likes: number
}

/** 이 기기에서 남긴 투표 기록 */
export interface VoteRecord {
  episodeId: string
  choiceId: string
  votedAt: string
}

export interface ReaderSettings {
  theme: ThemeName
  /** 본문 글자 크기(px) */
  fontSize: number
}

/** 화면에서 쓰는 집계 결과 */
export interface VoteTally {
  total: number
  counts: Record<string, number>
  percents: Record<string, number>
  leaderId: string | null
}
