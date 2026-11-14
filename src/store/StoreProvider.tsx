import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import type {
  Comment,
  Episode,
  Novel,
  ReaderSettings,
  ThemeName,
  VoteRecord,
} from '../types'
import { DEFAULT_SETTINGS, getRepository } from '../lib/repository'

export interface EpisodeDraft {
  title: string
  body: string
  choices: { label: string; hint: string }[]
  voteClosesAt: string | null
}

export interface NovelDraft {
  title: string
  tagline: string
  synopsis: string
  genres: string[]
  penName: string
  glyph: string
}

interface StoreValue {
  ready: boolean
  novels: Novel[]
  episodes: Episode[]
  comments: Comment[]
  votes: VoteRecord[]
  likedCommentIds: string[]
  settings: ReaderSettings
  toast: string | null
  notify: (message: string) => void
  setTheme: (theme: ThemeName) => void
  setFontSize: (size: number) => void
  castVote: (episodeId: string, choiceId: string) => Promise<void>
  addComment: (input: { novelId: string; episodeId: string; author: string; text: string }) => Promise<void>
  toggleCommentLike: (commentId: string) => Promise<void>
  publishIntoSlot: (slotEpisodeId: string, draft: EpisodeDraft) => Promise<Episode | null>
  appendEpisode: (novelId: string, draft: EpisodeDraft) => Promise<Episode | null>
  createNovel: (novel: NovelDraft, firstEpisode: EpisodeDraft) => Promise<Novel | null>
  resetAll: () => Promise<void>
}

const StoreContext = createContext<StoreValue | null>(null)

const LIKES_KEY = 'np.likes.v1'

function readLikes(): string[] {
  try {
    const raw = window.localStorage.getItem(LIKES_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function writeLikes(ids: string[]): void {
  try {
    window.localStorage.setItem(LIKES_KEY, JSON.stringify(ids))
  } catch {
    // 무시
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const repository = useMemo(() => getRepository(), [])
  const [ready, setReady] = useState(false)
  const [novels, setNovels] = useState<Novel[]>([])
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [votes, setVotes] = useState<VoteRecord[]>([])
  const [likedCommentIds, setLikedCommentIds] = useState<string[]>([])
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number | null>(null)

  useEffect(() => {
    let alive = true
    repository.load().then((snapshot) => {
      if (!alive) return
      setNovels(snapshot.novels)
      setEpisodes(snapshot.episodes)
      setComments(snapshot.comments)
      setVotes(snapshot.votes)
      setSettings(snapshot.settings)
      setLikedCommentIds(readLikes())
      setReady(true)
    })
    return () => {
      alive = false
    }
  }, [repository])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme)
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) {
      const colors: Record<ThemeName, string> = { light: '#f6f1e7', sepia: '#efe3cd', dark: '#111014' }
      meta.setAttribute('content', colors[settings.theme])
    }
  }, [settings.theme])

  useEffect(() => {
    document.documentElement.style.setProperty('--reader-font', `${settings.fontSize}px`)
  }, [settings.fontSize])

  const notify = useCallback((message: string) => {
    setToast(message)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2400)
  }, [])

  const persistSettings = useCallback(
    (next: ReaderSettings) => {
      setSettings(next)
      void repository.saveSettings(next)
    },
    [repository],
  )

  const setTheme = useCallback(
    (theme: ThemeName) => persistSettings({ ...settings, theme }),
    [persistSettings, settings],
  )

  const setFontSize = useCallback(
    (fontSize: number) => persistSettings({ ...settings, fontSize }),
    [persistSettings, settings],
  )

  const castVote = useCallback(
    async (episodeId: string, choiceId: string) => {
      const record: VoteRecord = { episodeId, choiceId, votedAt: new Date().toISOString() }
      setVotes((prev) =>
        prev.some((vote) => vote.episodeId === episodeId)
          ? prev.map((vote) => (vote.episodeId === episodeId ? record : vote))
          : [...prev, record],
      )
      await repository.saveVote(record)
    },
    [repository],
  )

  const addComment = useCallback(
    async (input: { novelId: string; episodeId: string; author: string; text: string }) => {
      const comment: Comment = {
        id: `cm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        novelId: input.novelId,
        episodeId: input.episodeId,
        author: input.author.trim() || '익명 독자',
        text: input.text.trim(),
        createdAt: new Date().toISOString(),
        likes: 0,
      }
      setComments((prev) => [...prev, comment])
      await repository.addComment(comment)
    },
    [repository],
  )

  const toggleCommentLike = useCallback(
    async (commentId: string) => {
      const target = comments.find((comment) => comment.id === commentId)
      if (!target) return
      const liked = likedCommentIds.includes(commentId)
      const updated: Comment = { ...target, likes: Math.max(0, target.likes + (liked ? -1 : 1)) }
      const nextLikes = liked
        ? likedCommentIds.filter((id) => id !== commentId)
        : [...likedCommentIds, commentId]
      setComments((prev) => prev.map((comment) => (comment.id === commentId ? updated : comment)))
      setLikedCommentIds(nextLikes)
      writeLikes(nextLikes)
      await repository.updateComment(updated)
    },
    [comments, likedCommentIds, repository],
  )

  const publishIntoSlot = useCallback(
    async (slotEpisodeId: string, draft: EpisodeDraft) => {
      const slot = episodes.find((episode) => episode.id === slotEpisodeId)
      if (!slot) return null
      const updated: Episode = {
        ...slot,
        title: draft.title.trim(),
        body: draft.body.trim(),
        status: 'published',
        publishedAt: new Date().toISOString(),
        voteClosesAt: draft.voteClosesAt,
        choices: draft.choices.map((choice, index) => ({
          id: `${slot.id}-${index === 0 ? 'a' : 'b'}`,
          label: choice.label.trim(),
          hint: choice.hint.trim(),
          targetEpisodeId: null,
          baseVotes: 0,
        })),
      }
      setEpisodes((prev) => prev.map((episode) => (episode.id === slot.id ? updated : episode)))
      await repository.saveEpisode(updated)
      return updated
    },
    [episodes, repository],
  )

  const appendEpisode = useCallback(
    async (novelId: string, draft: EpisodeDraft) => {
      const siblings = episodes.filter((episode) => episode.novelId === novelId)
      if (siblings.length === 0) return null
      const no = Math.max(...siblings.map((episode) => episode.no)) + 1
      const id = `ep-${novelId}-${Date.now()}`
      const episode: Episode = {
        id,
        novelId,
        no,
        title: draft.title.trim(),
        body: draft.body.trim(),
        parentEpisodeId: null,
        branchLabel: null,
        status: 'published',
        publishedAt: new Date().toISOString(),
        voteClosesAt: draft.voteClosesAt,
        choices: draft.choices.map((choice, index) => ({
          id: `${id}-${index === 0 ? 'a' : 'b'}`,
          label: choice.label.trim(),
          hint: choice.hint.trim(),
          targetEpisodeId: null,
          baseVotes: 0,
        })),
      }
      setEpisodes((prev) => [...prev, episode])
      await repository.saveEpisode(episode)
      return episode
    },
    [episodes, repository],
  )

  const createNovel = useCallback(
    async (novelDraft: NovelDraft, firstEpisode: EpisodeDraft) => {
      const id = `nv-${Date.now()}`
      const episodeId = `ep-${id}-1`
      const novel: Novel = {
        id,
        title: novelDraft.title.trim(),
        tagline: novelDraft.tagline.trim(),
        synopsis: novelDraft.synopsis.trim(),
        genres: novelDraft.genres,
        penName: novelDraft.penName.trim() || '익명 작가',
        cover: { from: novelDraft.glyph ? '#e8c9a0' : '#f0c9b8', to: '#8c5a4a', glyph: novelDraft.glyph || '📖' },
        startEpisodeId: episodeId,
        createdAt: new Date().toISOString(),
        status: 'ongoing',
      }
      const episode: Episode = {
        id: episodeId,
        novelId: id,
        no: 1,
        title: firstEpisode.title.trim(),
        body: firstEpisode.body.trim(),
        parentEpisodeId: null,
        branchLabel: null,
        status: 'published',
        publishedAt: new Date().toISOString(),
        voteClosesAt: firstEpisode.voteClosesAt,
        choices: firstEpisode.choices.map((choice, index) => ({
          id: `${episodeId}-${index === 0 ? 'a' : 'b'}`,
          label: choice.label.trim(),
          hint: choice.hint.trim(),
          targetEpisodeId: null,
          baseVotes: 0,
        })),
      }
      setNovels((prev) => [...prev, novel])
      setEpisodes((prev) => [...prev, episode])
      await repository.saveEpisode(episode)
      return novel
    },
    [repository],
  )

  const resetAll = useCallback(async () => {
    await repository.reset()
    const snapshot = await repository.load()
    setNovels(snapshot.novels)
    setEpisodes(snapshot.episodes)
    setComments(snapshot.comments)
    setVotes([])
    setSettings(snapshot.settings)
    setLikedCommentIds([])
    writeLikes([])
  }, [repository])

  const value: StoreValue = {
    ready,
    novels,
    episodes,
    comments,
    votes,
    likedCommentIds,
    settings,
    toast,
    notify,
    setTheme,
    setFontSize,
    castVote,
    addComment,
    toggleCommentLike,
    publishIntoSlot,
    appendEpisode,
    createNovel,
    resetAll,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const value = useContext(StoreContext)
  if (!value) throw new Error('useStore must be used inside <StoreProvider>')
  return value
}
