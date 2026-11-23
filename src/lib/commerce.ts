import type { Episode, EpisodeStatus } from '../types'

/**
 * 넥스트페이지 유료 모델 — 코인 · 대여권 · 넥스트패스(월정액).
 *
 * 이 파일이 플랫폼의 '가격표'와 '열람 규칙'의 단일 출처입니다.
 * 화면은 여기의 카탈로그·정책만 읽고, 결제 연동(PG)은 아직 붙지 않은 데모입니다.
 * 실제 결제를 붙일 때는 `charge()` 가 호출되는 자리에서 PG 승인 결과를 받아
 * `applyCharge()` 를 부르면 되도록 나눠 두었습니다.
 */

/* ───────────────────────── 카탈로그 ───────────────────────── */

export interface CoinPackage {
  id: string
  /** 표시 이름 */
  name: string
  coins: number
  /** 덤으로 붙는 코인 (0이면 없음) */
  bonus: number
  /** 결제 금액(원) */
  price: number
  /** 카드에 붙는 짧은 꼬리표 */
  tag?: string
  note: string
}

export interface TicketPackage {
  id: string
  name: string
  tickets: number
  price: number
  tag?: string
  note: string
}

export interface PassPlan {
  id: string
  name: string
  price: number
  /** 무료 체험 일수 */
  trialDays: number
  features: string[]
  note: string
}

/** 1코인 = 100원. 회차 대여 = 2코인(200원). */
export const COIN_VALUE = 100

export const COIN_PACKAGES: CoinPackage[] = [
  { id: 'coin-30', name: '30 코인', coins: 30, bonus: 0, price: 3000, note: '2코인 회차 15편' },
  { id: 'coin-50', name: '50 코인', coins: 50, bonus: 5, price: 5000, tag: '인기', note: '+5 보너스 · 27편' },
  { id: 'coin-100', name: '100 코인', coins: 100, bonus: 15, price: 10000, tag: '최대 혜택', note: '+15 보너스 · 57편' },
  { id: 'coin-200', name: '200 코인', coins: 200, bonus: 40, price: 20000, note: '+40 보너스 · 120편' },
]

export const TICKET_PACKAGES: TicketPackage[] = [
  { id: 'ticket-3', name: '대여권 3장', tickets: 3, price: 1800, note: '1장 600원 · 회차 3편' },
  { id: 'ticket-10', name: '대여권 10장', tickets: 10, price: 5000, tag: '10% 할인', note: '1장 500원 · 회차 10편' },
  { id: 'ticket-30', name: '대여권 30장', tickets: 30, price: 13500, tag: '25% 할인', note: '1장 450원 · 회차 30편' },
]

export const PASS: PassPlan = {
  id: 'nextpass',
  name: '넥스트패스',
  price: 9900,
  trialDays: 7,
  features: [
    '전 작품 유료 회차 무제한',
    '기다무 회차 바로 열람',
    '캐릭터 톡 무제한',
    '새 유료 회차 공개 즉시 열람',
  ],
  note: '월 9,900원 · 언제든 해지 · 다음 결제일 전까지 이용',
}

/** 유료 회차 1편을 열 때 드는 값 */
export const EPISODE_PRICE = { coins: 2, tickets: 1 } as const

/** 캐릭터 톡 — 무료로 주고받는 대화 수(내가 보낸 말 기준) */
export const CHAT_FREE_TURNS = 3
/** 캐릭터 한 명의 대화를 코인으로 여는 값 (넥스트패스는 무제한) */
export const CHAT_UNLOCK = { coins: 3 } as const

/** 1~2화는 무료, 3화는 기다무, 4화부터 유료 */
export const FREE_EPISODE_NO = 2
export const WAIT_FREE_EPISODE_NO = 3
/** 기다무 신청 뒤 무료로 열리는 시간 */
export const WAIT_FREE_HOURS = 24

export const WELCOME = { coins: 30, tickets: 2 } as const

/* ───────────────────────── 지갑 ───────────────────────── */

export type ChargeKind = 'coin' | 'ticket' | 'pass' | 'trial'

export interface ChargeRecord {
  id: string
  at: string
  kind: ChargeKind
  label: string
  /** 결제 금액(원) — 데모에서는 실제로 청구되지 않습니다 */
  amount: number
  coins: number
  tickets: number
}

export interface Wallet {
  coins: number
  tickets: number
  /** 넥스트패스 이용 만료 시각 (ISO). null 이면 미가입 */
  passUntil: string | null
  /** 무료 체험을 이미 쓴 적이 있는지 */
  trialUsed: boolean
  /** 열어 둔 회차·대화 — `ep:<id>` / `chat:<characterId>` */
  unlocked: string[]
  /** 기다무를 신청한 시각 — episodeId → ISO */
  waiting: Record<string, string>
  /** 충전·해지 기록 (마이페이지 영수증) */
  history: ChargeRecord[]
}

export const WALLET_KEY = 'np.wallet.v1'

export function emptyWallet(): Wallet {
  return { coins: 0, tickets: 0, passUntil: null, trialUsed: false, unlocked: [], waiting: {}, history: [] }
}

/** 첫 방문 지갑 — 웰컴 코인과 대여권을 쥐여 줍니다. */
export function createWallet(now: number = Date.now()): Wallet {
  return {
    ...emptyWallet(),
    coins: WELCOME.coins,
    tickets: WELCOME.tickets,
    history: [
      {
        id: `welcome-${now}`,
        at: new Date(now).toISOString(),
        kind: 'coin',
        label: '웰컴 코인 · 대여권',
        amount: 0,
        coins: WELCOME.coins,
        tickets: WELCOME.tickets,
      },
    ],
  }
}

function normalize(raw: Partial<Wallet> | null): Wallet {
  const base = emptyWallet()
  if (!raw || typeof raw !== 'object') return base
  return {
    coins: typeof raw.coins === 'number' && raw.coins >= 0 ? Math.floor(raw.coins) : base.coins,
    tickets: typeof raw.tickets === 'number' && raw.tickets >= 0 ? Math.floor(raw.tickets) : base.tickets,
    passUntil: typeof raw.passUntil === 'string' ? raw.passUntil : null,
    trialUsed: raw.trialUsed === true,
    unlocked: Array.isArray(raw.unlocked) ? raw.unlocked.filter((id) => typeof id === 'string') : [],
    waiting:
      raw.waiting && typeof raw.waiting === 'object'
        ? Object.fromEntries(
            Object.entries(raw.waiting).filter(([, value]) => typeof value === 'string'),
          )
        : {},
    history: Array.isArray(raw.history) ? raw.history.slice(-30) : [],
  }
}

/** 이 기기에 저장된 지갑을 읽습니다. 처음이면 웰컴 지갑을 만들어 저장합니다. */
export function loadWallet(now: number = Date.now()): Wallet {
  try {
    const raw = window.localStorage.getItem(WALLET_KEY)
    if (!raw) {
      const wallet = createWallet(now)
      saveWallet(wallet)
      return wallet
    }
    return normalize(JSON.parse(raw) as Wallet)
  } catch {
    return createWallet(now)
  }
}

export function saveWallet(wallet: Wallet): void {
  try {
    window.localStorage.setItem(WALLET_KEY, JSON.stringify(wallet))
  } catch {
    // 시크릿 모드·저장 공간 부족: 화면은 계속 동작합니다.
  }
}

export function clearWallet(): void {
  try {
    window.localStorage.removeItem(WALLET_KEY)
  } catch {
    // 무시
  }
}

/* ───────────────────────── 패스 ───────────────────────── */

export function passActive(wallet: Wallet, now: number = Date.now()): boolean {
  return Boolean(wallet.passUntil && new Date(wallet.passUntil).getTime() > now)
}

/** 남은 패스 일수 (올림). 미가입이면 0. */
export function passDaysLeft(wallet: Wallet, now: number = Date.now()): number {
  if (!passActive(wallet, now)) return 0
  const ms = new Date(wallet.passUntil as string).getTime() - now
  return Math.max(1, Math.ceil(ms / 86400000))
}

/** 체험 중인지 (가입 경로를 남겨 두어 해지·전환 안내에 씁니다) */
export function passIsTrial(wallet: Wallet): boolean {
  const record = [...wallet.history].reverse().find((item) => item.kind === 'trial' || item.kind === 'pass')
  return record?.kind === 'trial'
}

/* ───────────────────────── 열람 규칙 ───────────────────────── */

export interface EpisodeLike {
  id: string
  no: number
  status: EpisodeStatus
}

export type AccessKind = 'free' | 'waitfree' | 'waiting' | 'owned' | 'pass' | 'locked' | 'pending'

export interface EpisodeAccess {
  kind: AccessKind
  /** 회차 목록·표지에 붙는 짧은 표시 */
  badge: string
  /** 잠금 화면에 쓰는 한 줄 설명 */
  detail: string
  coinPrice: number
  ticketPrice: number
  /** 기다무 신청 뒤 열리는 시각 */
  waitUntil: string | null
  /** 기다무 남은 시간(ms) */
  waitRemainingMs: number
  readable: boolean
}

const policyOf = (episode: EpisodeLike): 'free' | 'waitfree' | 'paid' => {
  if (episode.no <= FREE_EPISODE_NO) return 'free'
  if (episode.no === WAIT_FREE_EPISODE_NO) return 'waitfree'
  return 'paid'
}

/**
 * 회차 하나의 열람 상태를 판정합니다. 우선순위:
 * 집필 중 → 패스 → 무료 회차 → 기다무(대기/열림) → 이미 연 회차 → 유료
 */
export function episodeAccess(
  episode: EpisodeLike,
  wallet: Wallet,
  now: number = Date.now(),
): EpisodeAccess {
  const base = {
    coinPrice: EPISODE_PRICE.coins,
    ticketPrice: EPISODE_PRICE.tickets,
    waitUntil: null as string | null,
    waitRemainingMs: 0,
    readable: false,
  }

  if (episode.status !== 'published') {
    return { ...base, kind: 'pending', badge: '집필 중', detail: '다음 화는 아직 집필 중입니다.' }
  }

  if (passActive(wallet, now)) {
    return { ...base, kind: 'pass', badge: '패스', detail: '넥스트패스로 무제한 열람 중입니다.', readable: true }
  }

  const policy = policyOf(episode)
  if (policy === 'free') {
    return { ...base, kind: 'free', badge: '무료', detail: '무료 공개 회차입니다.', readable: true }
  }

  if (wallet.unlocked.includes(`ep:${episode.id}`)) {
    return { ...base, kind: 'owned', badge: '열람', detail: '이미 연 회차입니다.', readable: true }
  }

  if (policy === 'waitfree') {
    const startedAt = wallet.waiting[episode.id]
    if (!startedAt) {
      return {
        ...base,
        kind: 'waitfree',
        badge: '기다무',
        detail: '기다리면 무료 — 신청하고 24시간 뒤 무료로 열립니다.',
      }
    }
    const until = new Date(startedAt).getTime() + WAIT_FREE_HOURS * 3600 * 1000
    const remaining = until - now
    if (remaining <= 0) {
      return {
        ...base,
        kind: 'waitfree',
        badge: '무료',
        detail: '기다무가 도착했습니다. 지금 무료로 열 수 있습니다.',
        waitUntil: new Date(until).toISOString(),
        readable: true,
      }
    }
    return {
      ...base,
      kind: 'waiting',
      badge: '기다무',
      detail: '무료 공개까지 기다리는 중입니다. 넥스트패스로 바로 읽을 수 있습니다.',
      waitUntil: new Date(until).toISOString(),
      waitRemainingMs: remaining,
    }
  }

  return {
    ...base,
    kind: 'locked',
    badge: `${EPISODE_PRICE.coins}코인`,
    detail: `대여권 1장 또는 ${EPISODE_PRICE.coins}코인으로 열 수 있습니다.`,
  }
}

/** 대여권 → 코인 순서로 낼 수 있는 수단을 고릅니다. */
export function preferredMethod(wallet: Wallet): 'ticket' | 'coin' | null {
  if (wallet.tickets >= EPISODE_PRICE.tickets) return 'ticket'
  if (wallet.coins >= EPISODE_PRICE.coins) return 'coin'
  return null
}

export type SpendFailure = 'insufficient_coins' | 'insufficient_tickets' | 'already_open'

export interface OpenResult {
  ok: boolean
  wallet: Wallet
  failure?: SpendFailure
}

/** 회차 열기 — 지갑에서 대여권 또는 코인을 냅니다. (순수 함수) */
export function openEpisode(
  wallet: Wallet,
  episode: EpisodeLike,
  method: 'ticket' | 'coin',
  now: number = Date.now(),
): OpenResult {
  const entry = `ep:${episode.id}`
  if (wallet.unlocked.includes(entry) || passActive(wallet, now) || policyOf(episode) === 'free') {
    return { ok: false, wallet, failure: 'already_open' }
  }
  if (method === 'ticket') {
    if (wallet.tickets < EPISODE_PRICE.tickets) {
      return { ok: false, wallet, failure: 'insufficient_tickets' }
    }
    return {
      ok: true,
      wallet: {
        ...wallet,
        tickets: wallet.tickets - EPISODE_PRICE.tickets,
        unlocked: [...wallet.unlocked, entry],
      },
    }
  }
  if (wallet.coins < EPISODE_PRICE.coins) {
    return { ok: false, wallet, failure: 'insufficient_coins' }
  }
  return {
    ok: true,
    wallet: {
      ...wallet,
      coins: wallet.coins - EPISODE_PRICE.coins,
      unlocked: [...wallet.unlocked, entry],
    },
  }
}

/** 기다무 신청 — 지금부터 24시간 뒤 무료. 이미 신청했으면 그대로 둡니다. */
export function startWaiting(
  wallet: Wallet,
  episode: EpisodeLike,
  now: number = Date.now(),
): Wallet {
  if (wallet.waiting[episode.id]) return wallet
  return { ...wallet, waiting: { ...wallet.waiting, [episode.id]: new Date(now).toISOString() } }
}

/** 기다무가 도착한 회차를 열어 둡니다. 아직이면 그대로 돌려줍니다. */
export function claimWaiting(
  wallet: Wallet,
  episode: EpisodeLike,
  now: number = Date.now(),
): OpenResult {
  const access = episodeAccess(episode, wallet, now)
  if (access.kind !== 'waitfree' || !access.readable) return { ok: false, wallet, failure: 'already_open' }
  const entry = `ep:${episode.id}`
  if (wallet.unlocked.includes(entry)) return { ok: false, wallet, failure: 'already_open' }
  return { ok: true, wallet: { ...wallet, unlocked: [...wallet.unlocked, entry] } }
}

/* ───────────────────────── 캐릭터 톡 ───────────────────────── */

export interface ChatAccess {
  allowed: boolean
  /** 남은 무료 대화 수 */
  freeTurnsLeft: number
  unlocked: boolean
  viaPass: boolean
}

export function chatAccess(
  characterId: string,
  wallet: Wallet,
  sentByUser: number,
  now: number = Date.now(),
): ChatAccess {
  const viaPass = passActive(wallet, now)
  const unlocked = wallet.unlocked.includes(`chat:${characterId}`)
  const freeTurnsLeft = Math.max(0, CHAT_FREE_TURNS - sentByUser)
  return {
    allowed: viaPass || unlocked || freeTurnsLeft > 0,
    freeTurnsLeft,
    unlocked,
    viaPass,
  }
}

export function unlockChat(
  wallet: Wallet,
  characterId: string,
  now: number = Date.now(),
): OpenResult {
  const entry = `chat:${characterId}`
  if (wallet.unlocked.includes(entry) || passActive(wallet, now)) {
    return { ok: false, wallet, failure: 'already_open' }
  }
  if (wallet.coins < CHAT_UNLOCK.coins) return { ok: false, wallet, failure: 'insufficient_coins' }
  return {
    ok: true,
    wallet: {
      ...wallet,
      coins: wallet.coins - CHAT_UNLOCK.coins,
      unlocked: [...wallet.unlocked, entry],
    },
  }
}

/* ───────────────────────── 충전 ───────────────────────── */

export interface ChargeResult {
  wallet: Wallet
  record: ChargeRecord
}

function receipt(kind: ChargeKind, label: string, amount: number, coins: number, tickets: number, now: number): ChargeRecord {
  return {
    id: `rc-${now}-${Math.random().toString(36).slice(2, 6)}`,
    at: new Date(now).toISOString(),
    kind,
    label,
    amount,
    coins,
    tickets,
  }
}

/**
 * 코인 충전. 데모에서는 PG 승인 없이 바로 지갑에 넣습니다.
 * 실제 결제를 붙일 때는 이 함수 앞에 결제 승인 단계를 두고, 성공했을 때만 부릅니다.
 */
export function chargeCoins(wallet: Wallet, pack: CoinPackage, now: number = Date.now()): ChargeResult {
  const coins = pack.coins + pack.bonus
  return {
    wallet: { ...wallet, coins: wallet.coins + coins },
    record: receipt('coin', `${pack.name}${pack.bonus ? ` (+${pack.bonus})` : ''}`, pack.price, coins, 0, now),
  }
}

export function chargeTickets(wallet: Wallet, pack: TicketPackage, now: number = Date.now()): ChargeResult {
  return {
    wallet: { ...wallet, tickets: wallet.tickets + pack.tickets },
    record: receipt('ticket', pack.name, pack.price, 0, pack.tickets, now),
  }
}

/** 넥스트패스 가입(또는 연장) — 한 달. */
export function startPass(wallet: Wallet, now: number = Date.now()): ChargeResult {
  const from = passActive(wallet, now) ? new Date(wallet.passUntil as string).getTime() : now
  const until = new Date(from + 30 * 86400000).toISOString()
  return {
    wallet: { ...wallet, passUntil: until },
    record: receipt('pass', `${PASS.name} 1개월`, PASS.price, 0, 0, now),
  }
}

/** 무료 체험 — 한 번만. 이미 체험했으면 null 을 돌려줍니다. */
export function startTrial(wallet: Wallet, now: number = Date.now()): ChargeResult | null {
  if (wallet.trialUsed) return null
  const until = new Date(now + PASS.trialDays * 86400000).toISOString()
  return {
    wallet: { ...wallet, passUntil: until, trialUsed: true },
    record: receipt('trial', `${PASS.name} 무료 체험 ${PASS.trialDays}일`, 0, 0, 0, now),
  }
}

/**
 * 패스 해지 — 데모에서는 즉시 이용이 끝납니다.
 * 실제 결제를 붙일 때는 '다음 결제일까지 이용' 정책으로 바꾸고
 * autoRenew 플래그를 함께 두면 됩니다.
 */
export function cancelPass(wallet: Wallet): Wallet {
  return { ...wallet, passUntil: null }
}

export function appendReceipt(wallet: Wallet, record: ChargeRecord): Wallet {
  return { ...wallet, history: [...wallet.history, record].slice(-30) }
}

/* ───────────────────────── 표시 도우미 ───────────────────────── */

export function formatWon(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`
}

/** 코인 1개당 실제 단가 (보너스 포함) */
export function coinUnitPrice(pack: CoinPackage): number {
  return Math.round(pack.price / (pack.coins + pack.bonus))
}

export function ticketUnitPrice(pack: TicketPackage): number {
  return Math.round(pack.price / pack.tickets)
}

/** 목록에 붙일 짧은 표시 — 아직 안 열린 유료 회차는 자물쇠로 보여 줍니다. */
export function accessBadge(access: EpisodeAccess): string {
  if (access.kind === 'locked') return '유료'
  if (access.kind === 'waiting') return '기다무'
  if (access.kind === 'pending') return '집필 중'
  return access.badge
}

/** 작품 하나의 무료/유료 구성을 한 줄로 — 작품 페이지·카드에 씁니다. */
export function pricingSummary(episodes: Episode[]): string {
  if (episodes.length === 0) return '연재 준비 중'
  const published = episodes.filter((episode) => episode.status === 'published')
  if (published.length <= FREE_EPISODE_NO) return '전 회차 무료'
  const paid = published.filter((episode) => episode.no > WAIT_FREE_EPISODE_NO).length
  const wait = published.some((episode) => episode.no === WAIT_FREE_EPISODE_NO)
  if (!paid) return wait ? `${FREE_EPISODE_NO}화까지 무료 · ${WAIT_FREE_EPISODE_NO}화 기다무` : '전 회차 무료'
  return `${FREE_EPISODE_NO}화까지 무료 · ${WAIT_FREE_EPISODE_NO}화 기다무 · 이후 ${paid}화 유료`
}
