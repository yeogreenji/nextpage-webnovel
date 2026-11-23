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
  ReaderFont,
  ReaderSettings,
  ThemeName,
  VoteRecord,
} from '../types'
import { DEFAULT_SETTINGS, getRepository } from '../lib/repository'
import { clearAllSessions } from '../lib/play'
import {
  clearWallet,
  loadWallet,
  saveWallet,
  createWallet,
  episodeAccess,
  openEpisode as spendForEpisode,
  startWaiting as markWaiting,
  claimWaiting as claimWaitFree,
  unlockChat as spendForChat,
  chargeCoins as addCoins,
  chargeTickets as addTickets,
  startPass as beginPass,
  startTrial as beginTrial,
  appendReceipt,
  passActive,
  passDaysLeft,
} from '../lib/commerce'
import type {
  ChargeResult,
  CoinPackage,
  EpisodeAccess,
  EpisodeLike,
  TicketPackage,
  Wallet,
} from '../lib/commerce'

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

export type PricingTab = 'coin' | 'ticket' | 'pass'

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
  setLineHeight: (lineHeight: number) => void
  setFont: (font: ReaderFont) => void
  castVote: (episodeId: string, choiceId: string) => Promise<void>
  addComment: (input: { novelId: string; episodeId: string; author: string; text: string }) => Promise<void>
  toggleCommentLike: (commentId: string) => Promise<void>
  publishIntoSlot: (slotEpisodeId: string, draft: EpisodeDraft) => Promise<Episode | null>
  appendEpisode: (novelId: string, draft: EpisodeDraft) => Promise<Episode | null>
  createNovel: (novel: NovelDraft, firstEpisode: EpisodeDraft) => Promise<Novel | null>
  resetAll: () => Promise<void>

  /* ── 유료 모델: 코인 · 대여권 · 넥스트패스 ── */
  wallet: Wallet
  hasPass: boolean
  passDays: number
  pricingOpen: boolean
  pricingTab: PricingTab
  openPricing: (tab?: PricingTab) => void
  closePricing: () => void
  selectPricingTab: (tab: PricingTab) => void
  buyCoins: (pack: CoinPackage) => void
  buyTickets: (pack: TicketPackage) => void
  subscribePass: () => void
  activateTrial: () => boolean
  endPass: () => void
  accessOf: (episode: EpisodeLike) => EpisodeAccess
  unlockEpisode: (episode: Episode, method: 'ticket' | 'coin') => boolean
  requestWaitFree: (episode: Episode) => void
  collectWaitFree: (episode: Episode) => boolean
  unlockCharacterChat: (characterId: string, name?: string) => boolean
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
  const [wallet, setWallet] = useState<Wallet>(() =>
    typeof window === 'undefined' ? createWallet() : loadWallet(),
  )
  const [pricingOpen, setPricingOpen] = useState(false)
  const [pricingTab, setPricingTab] = useState<PricingTab>('coin')

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
      const colors: Record<ThemeName, string> = { light: '#f6f4f8', sepia: '#efe3cc', dark: '#0a0710' }
      meta.setAttribute('content', colors[settings.theme])
    }
  }, [settings.theme])

  useEffect(() => {
    document.documentElement.style.setProperty('--reader-font', `${settings.fontSize}px`)
    document.documentElement.style.setProperty('--reader-line-height', String(settings.lineHeight))
    const family =
      settings.font === 'sans'
        ? 'var(--font-sans)'
        : settings.font === 'maru'
          ? 'var(--font-maru)'
          : 'var(--font-serif)'
    document.documentElement.style.setProperty('--reader-font-family', family)
  }, [settings.fontSize, settings.lineHeight, settings.font])

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

  const setLineHeight = useCallback(
    (lineHeight: number) => persistSettings({ ...settings, lineHeight }),
    [persistSettings, settings],
  )

  const setFont = useCallback(
    (font: ReaderFont) => persistSettings({ ...settings, font }),
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

  /* ── 지갑 저장 — 바뀔 때마다 이 기기에 남깁니다 ── */
  const commitWallet = useCallback((next: Wallet, record?: ChargeResult['record']) => {
    const merged = record ? appendReceipt(next, record) : next
    setWallet(merged)
    saveWallet(merged)
    return merged
  }, [])

  const openPricing = useCallback((tab: PricingTab = 'coin') => {
    setPricingTab(tab)
    setPricingOpen(true)
  }, [])
  const closePricing = useCallback(() => setPricingOpen(false), [])
  const selectPricingTab = useCallback((tab: PricingTab) => setPricingTab(tab), [])

  const buyCoins = useCallback(
    (pack: CoinPackage) => {
      const { wallet: next, record } = addCoins(wallet, pack)
      commitWallet(next, record)
      notify(`${pack.coins + pack.bonus}코인을 충전했어요`)
    },
    [commitWallet, notify, wallet],
  )

  const buyTickets = useCallback(
    (pack: TicketPackage) => {
      const { wallet: next, record } = addTickets(wallet, pack)
      commitWallet(next, record)
      notify(`대여권 ${pack.tickets}장을 충전했어요`)
    },
    [commitWallet, notify, wallet],
  )

  const subscribePass = useCallback(() => {
    const { wallet: next, record } = beginPass(wallet)
    commitWallet(next, record)
    notify('넥스트패스를 시작했어요 — 전 작품 무제한')
  }, [commitWallet, notify, wallet])

  const activateTrial = useCallback(() => {
    const result = beginTrial(wallet)
    if (!result) {
      notify('무료 체험은 한 번만 쓸 수 있어요')
      return false
    }
    commitWallet(result.wallet, result.record)
    notify('넥스트패스 무료 체험을 켰어요 (결제 연동 전 데모)')
    return true
  }, [commitWallet, notify, wallet])

  const endPass = useCallback(() => {
    commitWallet({ ...wallet, passUntil: null })
    notify('넥스트패스를 해지했어요')
  }, [commitWallet, notify, wallet])

  const accessOf = useCallback((episode: EpisodeLike) => episodeAccess(episode, wallet), [wallet])

  const unlockEpisode = useCallback(
    (episode: Episode, method: 'ticket' | 'coin') => {
      const result = spendForEpisode(wallet, episode, method)
      if (!result.ok) {
        if (result.failure === 'insufficient_tickets') {
          notify('대여권이 모자라요 — 충전소에서 채울 수 있어요')
          openPricing('ticket')
        } else if (result.failure === 'insufficient_coins') {
          notify('코인이 모자라요 — 충전소에서 채울 수 있어요')
          openPricing('coin')
        }
        return false
      }
      commitWallet(result.wallet)
      notify(method === 'ticket' ? '대여권 1장으로 열었어요' : '2코인으로 열었어요')
      return true
    },
    [commitWallet, notify, openPricing, wallet],
  )

  const requestWaitFree = useCallback(
    (episode: Episode) => {
      const next = markWaiting(wallet, episode)
      if (next === wallet) {
        notify('이미 기다무를 신청한 회차예요')
        return
      }
      commitWallet(next)
      notify('기다무 신청 완료 — 24시간 뒤 무료로 열려요')
    },
    [commitWallet, notify, wallet],
  )

  const collectWaitFree = useCallback(
    (episode: Episode) => {
      const result = claimWaitFree(wallet, episode)
      if (!result.ok) return false
      commitWallet(result.wallet)
      notify('기다무 회차를 무료로 열었어요')
      return true
    },
    [commitWallet, notify, wallet],
  )

  const unlockCharacterChat = useCallback(
    (characterId: string, name?: string) => {
      const result = spendForChat(wallet, characterId)
      if (!result.ok) {
        if (result.failure === 'insufficient_coins') {
          notify('코인이 모자라요 — 충전소에서 채울 수 있어요')
          openPricing('coin')
        }
        return false
      }
      commitWallet(result.wallet)
      notify(`${name ?? '캐릭터'}와의 대화를 3코인으로 열었어요`)
      return true
    },
    [commitWallet, notify, openPricing, wallet],
  )

  const resetAll = useCallback(async () => {
    await repository.reset()
    clearAllSessions()
    clearWallet()
    setWallet(createWallet())
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
    setLineHeight,
    setFont,
    castVote,
    addComment,
    toggleCommentLike,
    publishIntoSlot,
    appendEpisode,
    createNovel,
    resetAll,
    wallet,
    hasPass: passActive(wallet),
    passDays: passDaysLeft(wallet),
    pricingOpen,
    pricingTab,
    openPricing,
    closePricing,
    selectPricingTab,
    buyCoins,
    buyTickets,
    subscribePass,
    activateTrial,
    endPass,
    accessOf,
    unlockEpisode,
    requestWaitFree,
    collectWaitFree,
    unlockCharacterChat,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const value = useContext(StoreContext)
  if (!value) throw new Error('useStore must be used inside <StoreProvider>')
  return value
}
