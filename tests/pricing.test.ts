import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'

/** localStorage 가 없는 실행에서도 돌도록 최소 DOM 을 준비합니다. */
if (typeof window === 'undefined') {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' })
  const define = (key: string, value: unknown) =>
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true })
  define('window', dom.window)
  define('document', dom.window.document)
  define('localStorage', dom.window.localStorage)
}

import {
  CHAT_FREE_TURNS,
  COIN_PACKAGES,
  EPISODE_PRICE,
  PASS,
  TICKET_PACKAGES,
  WALLET_KEY,
  cancelPass,
  chargeCoins,
  chargeTickets,
  chatAccess,
  claimWaiting,
  clearWallet,
  createWallet,
  episodeAccess,
  loadWallet,
  openEpisode,
  passActive,
  passDaysLeft,
  pricingSummary,
  saveWallet,
  startPass,
  startTrial,
  startWaiting,
  unlockChat,
  WAIT_FREE_HOURS,
} from '../src/lib/commerce'
import type { Wallet } from '../src/lib/commerce'
import { buildSeed } from '../src/data/seed'
import type { Episode } from '../src/types'

const seed = buildSeed()
const episodeOf = (id: string): Episode => seed.episodes.find((episode) => episode.id === id)!
const free = episodeOf('ep-office-1') // 1화
const waitFree = episodeOf('ep-office-3a') // 3화
const paid = episodeOf('ep-office-4a') // 4화

const wallet = (patch: Partial<Wallet> = {}): Wallet => ({ ...createWallet(), ...patch })

describe('유료 모델 — 무료 · 기다무 · 유료 경계', () => {
  it('1~2화는 무료, 3화는 기다무, 4화부터 유료다', () => {
    assert.equal(episodeAccess(free, wallet()).kind, 'free')
    assert.equal(episodeAccess(waitFree, wallet()).kind, 'waitfree')
    assert.equal(episodeAccess(paid, wallet()).kind, 'locked')
    assert.equal(episodeAccess(paid, wallet()).coinPrice, EPISODE_PRICE.coins)
    assert.equal(episodeAccess(paid, wallet()).ticketPrice, EPISODE_PRICE.tickets)
  })

  it('기다무는 신청 뒤 24시간이 지나야 무료로 열린다', () => {
    const now = Date.now()
    const w = startWaiting(wallet(), waitFree, now)
    const waiting = episodeAccess(waitFree, w, now + 1000)
    assert.equal(waiting.kind, 'waiting')
    assert.ok(waiting.waitRemainingMs > WAIT_FREE_HOURS * 3600 * 1000 - 2000)
    assert.equal(waiting.readable, false)
    // 신청은 한 번만 — 다시 신청해도 시각이 앞당겨지지 않는다
    assert.equal(startWaiting(w, waitFree, now + 5000).waiting[waitFree.id], w.waiting[waitFree.id])

    const arrived = episodeAccess(waitFree, w, now + WAIT_FREE_HOURS * 3600 * 1000 + 1000)
    assert.equal(arrived.readable, true)
    const claimed = claimWaiting(w, waitFree, now + WAIT_FREE_HOURS * 3600 * 1000 + 1000)
    assert.equal(claimed.ok, true)
    assert.ok(claimed.wallet.unlocked.includes(`ep:${waitFree.id}`))
    // 아직 도착하지 않은 상태에서는 열리지 않는다
    assert.equal(claimWaiting(w, waitFree, now + 1000).ok, false)
  })

  it('기다무 회차도 기다리지 않고 대여권으로 바로 열 수 있다', () => {
    const result = openEpisode(wallet(), waitFree, 'ticket')
    assert.equal(result.ok, true)
    assert.equal(episodeAccess(waitFree, result.wallet).kind, 'owned')
  })
})

describe('유료 모델 — 대여권 · 코인', () => {
  it('대여권 1장으로 유료 회차를 열면 장수가 줄고 회차가 열린다', () => {
    const before = wallet({ tickets: 2 })
    const result = openEpisode(before, paid, 'ticket')
    assert.equal(result.ok, true)
    assert.equal(result.wallet.tickets, 1)
    assert.equal(episodeAccess(paid, result.wallet).kind, 'owned')
    assert.equal(episodeAccess(paid, result.wallet).readable, true)
  })

  it('코인 2개로도 열리고, 모자라면 열리지 않는다', () => {
    const ok = openEpisode(wallet({ coins: 5 }), paid, 'coin')
    assert.equal(ok.ok, true)
    assert.equal(ok.wallet.coins, 5 - EPISODE_PRICE.coins)

    const poor = openEpisode(wallet({ coins: EPISODE_PRICE.coins - 1 }), paid, 'coin')
    assert.equal(poor.ok, false)
    assert.equal(poor.failure, 'insufficient_coins')
    assert.equal(poor.wallet.coins, EPISODE_PRICE.coins - 1)

    const noTicket = openEpisode(wallet({ tickets: 0 }), paid, 'ticket')
    assert.equal(noTicket.failure, 'insufficient_tickets')
  })

  it('이미 연 회차·무료 회차는 다시 과금하지 않는다', () => {
    const owned = openEpisode(wallet(), paid, 'coin').wallet
    assert.equal(openEpisode(owned, paid, 'coin').failure, 'already_open')
    assert.equal(openEpisode(wallet(), free, 'coin').failure, 'already_open')
  })
})

describe('유료 모델 — 넥스트패스', () => {
  it('패스가 켜져 있으면 모든 회차가 열리고 남은 일수가 계산된다', () => {
    const { wallet: withPass } = startPass(wallet())
    assert.equal(passActive(withPass), true)
    assert.equal(passDaysLeft(withPass), 30)
    for (const episode of [free, waitFree, paid]) {
      assert.equal(episodeAccess(episode, withPass).readable, true)
    }
    // 패스가 있으면 코인·대여권을 쓰지 않는다
    const opened = openEpisode(withPass, paid, 'coin')
    assert.equal(opened.ok, false)
    assert.equal(opened.wallet.coins, withPass.coins)
  })

  it('무료 체험은 한 번만, 7일이다', () => {
    const first = startTrial(wallet())
    assert.ok(first)
    assert.equal(passDaysLeft(first!.wallet), PASS.trialDays)
    assert.equal(first!.wallet.trialUsed, true)
    assert.equal(startTrial(first!.wallet), null)
  })

  it('해지하면 즉시 이용이 끝나고 유료 회차가 다시 잠긴다', () => {
    const { wallet: withPass } = startPass(wallet())
    const ended = cancelPass(withPass)
    assert.equal(passActive(ended), false)
    assert.equal(episodeAccess(paid, ended).kind, 'locked')
  })
})

describe('유료 모델 — 캐릭터 톡', () => {
  it(`처음 ${CHAT_FREE_TURNS}번은 무료, 그 뒤에는 패스·코인이 필요하다`, () => {
    const w = wallet()
    assert.equal(chatAccess('ch-a', w, 0).allowed, true)
    assert.equal(chatAccess('ch-a', w, CHAT_FREE_TURNS - 1).allowed, true)
    assert.equal(chatAccess('ch-a', w, CHAT_FREE_TURNS).allowed, false)
    assert.equal(chatAccess('ch-a', w, CHAT_FREE_TURNS).freeTurnsLeft, 0)

    const unlocked = unlockChat(wallet({ coins: 10 }), 'ch-a')
    assert.equal(unlocked.ok, true)
    assert.equal(chatAccess('ch-a', unlocked.wallet, CHAT_FREE_TURNS + 5).allowed, true)

    const { wallet: withPass } = startPass(wallet())
    assert.equal(chatAccess('ch-a', withPass, 99).viaPass, true)

    const poor = unlockChat(wallet({ coins: 0 }), 'ch-a')
    assert.equal(poor.failure, 'insufficient_coins')
  })
})

describe('유료 모델 — 충전과 지갑', () => {
  it('코인 패키지는 덤까지 더해지고 영수증이 남는다', () => {
    const pack = COIN_PACKAGES[1]
    const { wallet: next, record } = chargeCoins(wallet({ coins: 0 }), pack)
    assert.equal(next.coins, pack.coins + pack.bonus)
    assert.equal(record.amount, pack.price)
    assert.equal(record.kind, 'coin')
  })

  it('대여권 패키지도 장수와 금액이 그대로 들어간다', () => {
    const pack = TICKET_PACKAGES[0]
    const { wallet: next, record } = chargeTickets(wallet({ tickets: 0 }), pack)
    assert.equal(next.tickets, pack.tickets)
    assert.equal(record.amount, pack.price)
  })

  it('첫 방문 지갑은 웰컴 코인 30개와 대여권 2장으로 시작한다', () => {
    clearWallet()
    const fresh = loadWallet()
    assert.equal(fresh.coins, 30)
    assert.equal(fresh.tickets, 2)
    assert.equal(fresh.passUntil, null)
    assert.equal(fresh.history.length, 1)

    saveWallet({ ...fresh, coins: 7 })
    assert.equal(loadWallet().coins, 7)
    assert.ok(window.localStorage.getItem(WALLET_KEY))
    clearWallet()
  })
})

describe('유료 모델 — 가격 표기', () => {
  it('작품의 무료·기다무·유료 구성을 한 줄로 요약한다', () => {
    const office = seed.episodes.filter((episode) => episode.novelId === 'nv-office')
    const summary = pricingSummary(office)
    assert.match(summary, /2화까지 무료/)
    assert.match(summary, /3화 기다무/)
    assert.match(summary, /유료/)

    // 2화 갈래까지만 있는 작품은 전 회차가 무료 구간이다
    const short = seed.episodes.filter((episode) => episode.novelId === 'nv-secretary')
    assert.equal(pricingSummary(short), '전 회차 무료')
  })
})
