/** 넥스트페이지 공용 타입 정의 */

export type ThemeName = 'light' | 'sepia' | 'dark'

/** 등장인물 카드 */
export interface Character {
  id: string
  name: string
  /** 작품 속 역할 (예: 마케팅팀 3년차 대리) */
  role: string
  /** 남주 / 여주 / 조연 — 카드 색을 결정합니다 */
  tag: '남주' | '여주' | '조연'
  /** 카드에 붙는 짧은 역할 배지 (예: 서브남주 · 라이벌 · 조력자). 없으면 tag 사용 */
  badge?: string
  /** 카드에 한 줄로 노출되는 대사 */
  quote: string
  /** 인물 일러스트 경로 (public 기준) */
  image?: string
}

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
  /** 선택지 장면 일러스트 경로 (public 기준) */
  image?: string
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
  /** 표지 일러스트 경로 (public 기준) */
  coverImage?: string
  /** 히어로 배너용 와이드 아트 경로 */
  heroImage?: string
  /** 등장인물 카드 */
  characters?: Character[]
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

export type ReaderFont = 'serif' | 'sans'

export interface ReaderSettings {
  theme: ThemeName
  /** 본문 글자 크기(px) */
  fontSize: number
  /** 본문 줄간격 (1.6 ~ 2.4) */
  lineHeight: number
  /** 본문 서체 — 명조(serif) / 고딕(sans) */
  font: ReaderFont
}

/** 본문 중간에 끼워 넣는 삽화 한 컷 */
export interface InlineScene {
  image: string
  caption: string
  /** 이 문장이 들어 있는 문단 '뒤'에 삽화를 놓습니다. */
  anchor: string
  /** anchor 문단을 찾지 못했을 때 놓을 문단 인덱스 (0-based) */
  fallbackAfter: number
}

/** 캐릭터 톡 대화 한 줄 */
export interface ChatMessage {
  id: string
  role: 'user' | 'character'
  text: string
  at: string
  /** AI가 만든 답장인지, 기기 안 상황 응답인지 */
  source?: 'ai' | 'offline'
}

/** 화면에서 쓰는 집계 결과 */
export interface VoteTally {
  total: number
  counts: Record<string, number>
  percents: Record<string, number>
  leaderId: string | null
}
