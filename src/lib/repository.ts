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

export const DEFAULT_SETTINGS: ReaderSettings = { theme: 'dark', fontSize: 18 }

const KEYS = {
  novels: 'np.novels.v1',
  episodes: 'np.episodes.v1',
  comments: 'np.comments.v1',
  votes: 'np.votes.v1',
  settings: 'np.settings.v1',
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
 * 이 기기에 저장하는 기본 구현.
 * 서버 없이도 투표·댓글·집필 기록이 남아, 배포만 하면 바로 체험할 수 있습니다.
 */
export class LocalRepository implements NovelRepository {
  async load(): Promise<Snapshot> {
    const stored = read<Episode[]>(KEYS.episodes)

    if (!stored || stored.length === 0) {
      const seed = buildSeed()
      write(KEYS.novels, seed.novels)
      write(KEYS.episodes, seed.episodes)
      write(KEYS.comments, seed.comments)
      const withArt = attachArt(seed.novels, seed.episodes)
      return {
        novels: withArt.novels,
        episodes: withArt.episodes,
        comments: seed.comments,
        votes: [],
        settings: read<ReaderSettings>(KEYS.settings) ?? DEFAULT_SETTINGS,
      }
    }

    const withArt = attachArt(read<Novel[]>(KEYS.novels) ?? [], stored)
    return {
      novels: withArt.novels,
      episodes: withArt.episodes,
      comments: read<Comment[]>(KEYS.comments) ?? [],
      votes: read<VoteRecord[]>(KEYS.votes) ?? [],
      settings: read<ReaderSettings>(KEYS.settings) ?? DEFAULT_SETTINGS,
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
  }
}

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
