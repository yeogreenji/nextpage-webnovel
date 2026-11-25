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

export type ReaderFont = 'serif' | 'sans' | 'maru'

export interface ReaderSettings {
  theme: ThemeName
  /** 본문 글자 크기(px) */
  fontSize: number
  /** 본문 줄간격 (1.6 ~ 2.4) */
  lineHeight: number
  /** 본문 서체 — 명조(serif) / 고딕(sans) / 마루부리(maru) */
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

/* ─────────────────── 인터랙티브 소설 (내가 쓰는 소설) ─────────────────── */

/* ─────────────────── 인터랙티브 소설 공용 ─────────────────── */

/**
 * 선택의 결 — 마지막 장면에서 고른 결이 그대로 엔딩이 됩니다.
 * A/B는 대부분의 장면, C는 마지막 장면의 세 번째 갈래에 씁니다.
 */
export type ChoiceTone = 'A' | 'B' | 'C'

/**
 * 말 걸기 지점 — 장면 중간에서 인물과 대화를 시작하는 자리.
 * 아무 때나 무는 버튼이 아니라, 본문의 특정 문단 바로 뒤에 붙습니다.
 * 말을 걸면 이 지점에 행동 요약 + 대사가 소설 본문으로 들어갑니다.
 */
export interface SceneInteraction {
  /** 본문 몇 번째 문단(0-based) 뒤에 말 걸기 지점을 둘지 */
  after: number
  /** 지금 말을 걸 만한 이유 — 배너에 한 줄로 노출 */
  cue: string
  /** 추천 대사 3~4개. 누르면 그대로 말을 겁니다. */
  prompts: string[]
  /** 말을 걸었을 때 본문에 남는 행동 문단. {name}은 인물 이름으로 바뀝니다. */
  action: string
}

/** 장면 끝에서 독자가 고르는 선택지 (3~4개) */
export interface PlayChoice {
  id: string
  /** 선택지 문구 — 소설의 문장처럼 적습니다 (예: '사물함 앞에서 그를 기다린다') */
  label: string
  /** 선택지 부연 — 무엇이 달라지는지 한 줄 */
  hint: string
  /** 고른 직후 본문에 바로 붙는 결과 문단. 이 문장이 소설이 됩니다. */
  result: string[]
  /** 선택의 결 — 마지막에 도달할 엔딩을 가릅니다 */
  tone: ChoiceTone
  /**
   * 이 선택만의 다음 장면 이음 문단.
   * 선택지마다 행동이 다르므로, 있으면 장면의 결(A/B) 이음 문단보다 먼저 씁니다.
   */
  lead?: string[]
}

/** 한 장면 = 한 화 = 한 번의 선택 (2~4지선다) */
export interface PlayScene {
  id: string
  /** 화 번호 (1부터). 화면에는 '1화'로 표시 */
  no: number
  title: string
  /** 장면 위에 붙는 위치·시간 한 줄 */
  place: string
  /** 본문 문단 */
  body: string[]
  /**
   * 직전 장면에서 고른 결(A/B)에 따라 본문 앞에 붙는 이음 문단.
   * 앞선 선택의 결과가 이 장면의 첫머리에서 이어지도록 합니다.
   */
  lead?: Partial<Record<ChoiceTone, string[]>>
  /** 3~4개의 선택지 */
  choices: PlayChoice[]
  /** 이 장면에서 대화할 인물 id (novel.characters 기준) */
  speakerId: string
  /**
   * 이 화에 실제로 서 있는 인물 id (novel.characters 기준).
   * — 적혀 있으면 이 목록만 대화 상대로 열립니다.
   * — 비어 있으면 본문·장소에 이름이 나오는 인물만 '이 자리에 있는 사람'으로 봅니다.
   */
  cast?: string[]
  /** 다음 화 예고 — 선택을 마친 뒤 '다음 화가 궁금한' 한 줄 */
  teaser?: string
  /** 장면 일러스트 (public 기준 경로) */
  image?: string
  /** 말 걸기 지점 — 없으면 본문 마지막 문단 뒤에 기본 지점이 생깁니다 */
  interaction?: SceneInteraction
}

/** 완성된 소설이 도달하는 엔딩 */
export interface PlayEnding {
  id: string
  name: string
  kicker: string
  body: string[]
  /**
   * 마지막 장면에서 어떤 결의 선택을 했을 때 닿는 엔딩인지.
   * 엔딩은 마지막 선택의 결로만 정해지므로, 마지막 장면의 갈래마다 엔딩이 하나씩 있어야 합니다.
   */
  tone: ChoiceTone
}

/** 한 부(部) — 장편 아크의 묶음. 화면에서 '1부 …' 머리글로 표시됩니다. */
export interface FlowPart {
  title: string
  kicker: string
  /** 시작 화 번호 (1부터, 포함) */
  from: number
  /** 끝 화 번호 (포함) */
  to: number
}

/** AI·기기 안 장편 이어쓰기의 재료 — 작품별 세계관·다음 화 씨앗 */
export interface SerialBlueprint {
  /** 이어쓰기 목표 화수 (보통 100) */
  target: number
  /** 세계관·인물 관계 한 줄들 (프롬프트에 그대로 들어갑니다) */
  premise: string[]
  /** 다음 화 씨앗 — 화마다 하나씩 돌려 씁니다 */
  beats: string[]
}

/** 한 작품의 인터랙티브 흐름 */
export interface StoryFlow {
  novelId: string
  /** 예: '24화 · 4부 · 화마다 2~3개의 갈래 · 세 개의 엔딩' */
  structure: string
  scenes: PlayScene[]
  endings: PlayEnding[]
  /** 장편 아크의 부 구분 (없으면 한 부) */
  parts?: FlowPart[]
  /** 정적 아크 이후 이어쓰기 재료 (없으면 기본값) */
  serial?: SerialBlueprint
}

/** 독자가 고른 선택 한 번 */
export interface PlayPick {
  sceneId: string
  choiceId: string
  label: string
  tone: ChoiceTone
  at: string
}

/** 채팅에서 소설로 옮긴 대사 */
export interface AppliedLine {
  id: string
  sceneId: string
  characterId: string
  characterName: string
  /** 캐릭터가 한 말 / 독자가 건넨 말 / 말을 건 행동 요약 */
  kind: 'character' | 'user' | 'action'
  text: string
  at: string
}

/** ─────────────── 장편 이어쓰기 (정적 아크 이후 25화 → 100화) ─────────────── */

/** AI·기기 안에서 새로 쓴 한 화 */
export interface SerialChapter {
  /** 화 번호 — 정적 아크의 다음 번호부터 */
  no: number
  title: string
  place: string
  body: string[]
  /** 다음 화 예고 한 줄 */
  teaser: string
  /** 이 화에서 고를 갈래 (2개) */
  choices: { label: string; hint: string; tone: ChoiceTone }[]
  /** 이 화에서 고른 갈래 (아직 안 골랐으면 null) */
  picked: { label: string; tone: ChoiceTone } | null
  /** 이 화를 쓰게 한 재료 — 직전 선택·대화·씨앗 */
  basedOn: string[]
  /** ai = 서버 생성, local = 기기 안 초안 */
  source: 'ai' | 'local'
  at: string
}

/** 이 기기에 쌓이는 장편 이어쓰기 상태 */
export interface SerialState {
  novelId: string
  /** 정적 아크가 끝난 화 번호 (예: 24). 이어쓰기는 이 다음부터 */
  baseChapters: number
  chapters: SerialChapter[]
  updatedAt: string
}

/** 이 기기에 저장되는 플레이 진행 */
export interface PlaySession {
  novelId: string
  picks: PlayPick[]
  applied: AppliedLine[]
  updatedAt: string
  /** 마지막 선택까지 마친 시각 */
  endedAt: string | null
}

/** 화면에서 쓰는 집계 결과 */
export interface VoteTally {
  total: number
  counts: Record<string, number>
  percents: Record<string, number>
  leaderId: string | null
}
