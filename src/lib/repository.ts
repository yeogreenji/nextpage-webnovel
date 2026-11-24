import type { Comment, Episode, Novel, ReaderSettings, VoteRecord } from '../types'
import { buildSeed } from '../data/seed'
import { attachArt } from '../data/art'

/** 데이터 레이어 계약 — 저장소를 바꿔도 화면 코드는 그대로 동작합니다. */
export interface Snapshot {
  novels: Novel[]
  episodes: Episode[]
  comments: Comment[]
  votes: VoteRecord[]
  settings: ReaderSettings
}

export interface NovelRepository {
  load(): Promise<Snapshot>
  saveEpisode(episode: Episode): Promise<void>
  addComment(comment: Comment): Promise<void>
  updateComment(comment: Comment): Promise<void>
  saveVote(vote: VoteRecord): Promise<void>
  saveSettings(settings: ReaderSettings): Promise<void>
  reset(): Promise<void>
}

export const DEFAULT_SETTINGS: ReaderSettings = {
  theme: 'light',
  fontSize: 18,
  lineHeight: 1.9,
  font: 'sans',
}

/** 시드 콘텐츠 버전 — 새 작품·회차를 기존 저장분 위에 얹을 때 씁니다. */
const SEED_VERSION = 10

/**
 * v10 문장 교정 — 이미 이 기기에 저장된 회차에도 반영되도록,
 * 정확히 일치하는 문장만 바꿔 끼웁니다. (독자가 스튜디오에서 고친 나머지 글은 그대로)
 */
const TEXT_FIXES: { id: string; from: string; to: string }[] = [
  {
    id: 'ep-office-1',
    from: '강남대로는 이미 만원이었고, 내 인생도 그랬다.',
    to: '강남대로는 이미 만원이었고, 그 위를 걷는 사람들의 아침도 그랬다.',
  },
  {
    id: 'ep-office-1',
    from: '8시 59분에 도착하는 성실함은 내가 만든 것이었다.',
    to: '8시 59분에 도착하는 성실함은 하윤이 만든 것이었다.',
  },
  { id: 'ep-parcel-1', from: '내 이름이었다. 주소는 이 집이고, 받는 사람도 나였다.', to: '자기 이름이었다. 주소는 이 집이고, 받는 사람은 윤재였다.' },
  {
    id: 'ep-parcel-1',
    from: '사흘 뒤의 내가 뭘 하든, 지금의 내가 할 수 있는 일은',
    to: '사흘 뒤의 자신이 뭘 하든, 지금의 자신이 할 수 있는 일은',
  },
  { id: 'ep-marry-3b', from: '왜 내가 서명한 날 아침에', to: '왜 지안이 서명한 날 아침에' },
  { id: 'ep-palace-3a', from: '3층 봉인서가는', to: '3층 봉인서고는' },
  { id: 'ep-palace-3b', from: '사서는 봉인서가에 들어가지 않는다', to: '사서는 봉인서고에 들어가지 않는다' },
  {
    id: 'ep-secretary-1',
    from: '대표님은 8시 55분 도착이래. 5분 있으면 오셔.',
    to: '대표님은 8시 55분 도착이래. 1분 있으면 오셔.',
  },
  { id: 'ep-secretary-1', from: '8시 54분, 엘리베이터가 열리고', to: '8시 55분, 엘리베이터가 열리고' },
]

/** 제목만 바뀐 회차 — 본문이 그대로면 제목을 새 시드로 맞춥니다. */
const TITLE_FIXES: { id: string; from: string; to: string }[] = [
  { id: 'ep-palace-1', from: '두 번째 첫 출근', to: '다시, 서고의 아침' },
  { id: 'ep-villainess-1', from: '두 번째 첫 출근', to: '3년 전의 임명장' },
]

/** 저장된 회차에 문장·제목 교정을 적용합니다. */
function applyEpisodeFixes(episodes: Episode[]): Episode[] {
  return episodes.map((episode) => {
    let next = episode
    for (const fix of TEXT_FIXES) {
      if (fix.id !== episode.id || !next.body.includes(fix.from)) continue
      next = { ...next, body: next.body.split(fix.from).join(fix.to) }
    }
    for (const fix of TITLE_FIXES) {
      if (fix.id === episode.id && next.title === fix.from) next = { ...next, title: fix.to }
    }
    return next
  })
}

const KEYS = {
  novels: 'np.novels.v1',
  episodes: 'np.episodes.v1',
  comments: 'np.comments.v1',
  votes: 'np.votes.v1',
  // 2026 리뉴얼: 기본 서체를 Pretendard(고딕)로 바꾸며 저장 키를 새로 잡았습니다.
  settings: 'np.settings.v2',
  version: 'np.seed.version.v1',
} as const

function read<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function write(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 저장 공간이 없거나 시크릿 모드인 경우: 화면은 계속 동작하고, 새로고침 시 초기화됩니다.
  }
}

/**
 * 시드 연재본이 기존 저장분보다 확실히 길고, 같은 문단에서 시작하면 '내용 개고'로 봅니다.
 * - 기존 독자의 투표·댓글·진행은 그대로 두고 본문만 새 연재본으로 바꿉니다.
 * - 스튜디오에서 직접 쓴 글은 첫 문단이 시드와 달라 교체되지 않습니다.
 */
function isContentUpgrade(stored: Episode, fresh: Episode): boolean {
  if (stored.status !== 'published' || fresh.status !== 'published') return false
  if (fresh.body.length < stored.body.length + 200) return false
  const head = stored.body.trim().slice(0, 80)
  return head.length > 0 && fresh.body.includes(head)
}

function readSettings(): ReaderSettings {
  const stored = read<Partial<ReaderSettings>>(KEYS.settings)
  return { ...DEFAULT_SETTINGS, ...(stored ?? {}) }
}

/**
 * 이 기기에 남아 있는 예전 시드에 새 작품·새 회차를 더합니다.
 * - 사용자가 스튜디오에서 고친 글은 건드리지 않습니다.
 * - 아직 '집필 중'이던 노드가 정식 연재로 바뀌면 새 본문으로 교체합니다.
 */
function mergeSeedContent(): void {
  const seed = buildSeed()
  const storedEpisodes = read<Episode[]>(KEYS.episodes)
  if (!storedEpisodes || storedEpisodes.length === 0) return

  const storedNovels = read<Novel[]>(KEYS.novels) ?? []
  const storedComments = read<Comment[]>(KEYS.comments) ?? []
  const seedEpisodes = new Map(seed.episodes.map((episode) => [episode.id, episode]))
  const storedEpisodeIds = new Set(storedEpisodes.map((episode) => episode.id))

  const nextEpisodes = storedEpisodes.map((episode) => {
    const fresh = seedEpisodes.get(episode.id)
    if (!fresh) return episode
    // 집필 중이던 회차가 정식 연재로 바뀌면 새 본문으로 교체합니다.
    if (episode.status === 'pending' && fresh.status === 'published') return fresh
    // 연재본이 더 길어졌으면(상용 분량 개고) 새 본문·갈래로 교체합니다.
    // 사용자가 스튜디오에서 직접 고친 글은 첫 문단이 달라지므로 건드리지 않습니다.
    if (isContentUpgrade(episode, fresh)) {
      return {
        ...episode,
        body: fresh.body,
        choices: fresh.choices.map((choice) => {
          const previous = episode.choices.find((item) => item.id === choice.id)
          return previous ? { ...choice, baseVotes: previous.baseVotes } : choice
        }),
      }
    }
    return episode
  })
  seed.episodes.forEach((episode) => {
    if (!storedEpisodeIds.has(episode.id)) nextEpisodes.push(episode)
  })

  const novelIds = new Set(storedNovels.map((novel) => novel.id))
  const nextNovels = [...storedNovels, ...seed.novels.filter((novel) => !novelIds.has(novel.id))]

  const commentIds = new Set(storedComments.map((comment) => comment.id))
  const nextComments = [
    ...storedComments,
    ...seed.comments.filter((comment) => !commentIds.has(comment.id)),
  ]

  write(KEYS.novels, nextNovels)
  write(KEYS.episodes, applyEpisodeFixes(nextEpisodes))
  write(KEYS.comments, nextComments)
  write(KEYS.version, SEED_VERSION)
}

/**
 * 이 기기에 저장하는 기본 구현.
 * 서버 없이도 투표·댓글·집필 기록이 남아, 배포만 하면 바로 체험할 수 있습니다.
 */
export class LocalRepository implements NovelRepository {
  async load(): Promise<Snapshot> {
    const version = read<number>(KEYS.version) ?? 1
    if (version < SEED_VERSION) mergeSeedContent()

    const stored = read<Episode[]>(KEYS.episodes)

    if (!stored || stored.length === 0) {
      const seed = buildSeed()
      write(KEYS.novels, seed.novels)
      write(KEYS.episodes, seed.episodes)
      write(KEYS.comments, seed.comments)
      write(KEYS.version, SEED_VERSION)
      const withArt = attachArt(seed.novels, seed.episodes)
      return {
        novels: withArt.novels,
        episodes: withArt.episodes,
        comments: seed.comments,
        votes: [],
        settings: readSettings(),
      }
    }

    const withArt = attachArt(read<Novel[]>(KEYS.novels) ?? [], stored)
    return {
      novels: withArt.novels,
      episodes: withArt.episodes,
      comments: read<Comment[]>(KEYS.comments) ?? [],
      votes: read<VoteRecord[]>(KEYS.votes) ?? [],
      settings: readSettings(),
    }
  }

  async saveEpisode(episode: Episode): Promise<void> {
    const episodes = read<Episode[]>(KEYS.episodes) ?? []
    const next = episodes.some((item) => item.id === episode.id)
      ? episodes.map((item) => (item.id === episode.id ? episode : item))
      : [...episodes, episode]
    write(KEYS.episodes, next)
  }

  async addComment(comment: Comment): Promise<void> {
    const comments = read<Comment[]>(KEYS.comments) ?? []
    write(KEYS.comments, [...comments, comment])
  }

  async updateComment(comment: Comment): Promise<void> {
    const comments = read<Comment[]>(KEYS.comments) ?? []
    write(
      KEYS.comments,
      comments.map((item) => (item.id === comment.id ? comment : item)),
    )
  }

  async saveVote(vote: VoteRecord): Promise<void> {
    const votes = read<VoteRecord[]>(KEYS.votes) ?? []
    const next = votes.some((item) => item.episodeId === vote.episodeId)
      ? votes.map((item) => (item.episodeId === vote.episodeId ? vote : item))
      : [...votes, vote]
    write(KEYS.votes, next)
  }

  async saveSettings(settings: ReaderSettings): Promise<void> {
    write(KEYS.settings, settings)
  }

  async reset(): Promise<void> {
    Object.values(KEYS).forEach((key) => {
      try {
        window.localStorage.removeItem(key)
      } catch {
        // 무시
      }
    })
  }}

let cached: NovelRepository | null = null

/**
 * 저장소 팩토리.
 * Supabase(또는 다른 백엔드)를 붙일 때는 이 함수가 돌려주는 구현만 바꾸면 됩니다.
 * 예) `return new SupabaseRepository(url, anonKey)`
 */
export function getRepository(): NovelRepository {
  if (!cached) cached = new LocalRepository()
  return cached
}
