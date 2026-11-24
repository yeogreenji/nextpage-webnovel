import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store/StoreProvider'
import { Icon } from './Icon'
import { formatRemaining, remainingUntil } from '../lib/format'
import {
  EPISODE_PRICE,
  PASS,
  WAIT_FREE_HOURS,
  formatWon,
  preferredMethod,
} from '../lib/commerce'
import type { EpisodeAccess } from '../lib/commerce'
import type { Episode } from '../types'

/**
 * 잠긴 회차 안내 — 대여권·코인·넥스트패스, 그리고 기다무.
 * 유료 회차(4화부터)는 대여권 1장 또는 2코인, 3화는 기다무(신청 후 24시간).
 */
export function EpisodeLock({ episode, access, novelId, freeEpisodeId }: { episode: Episode; access: EpisodeAccess; novelId?: string; freeEpisodeId?: string }) {
  const { wallet, unlockEpisode, requestWaitFree, collectWaitFree, openPricing, hasPass } = useStore()
  const [, tick] = useState(0)

  // 기다무 남은 시간을 1초마다 새로 그립니다.
  useEffect(() => {
    if (access.kind !== 'waiting') return undefined
    const timer = window.setInterval(() => tick((value) => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [access.kind])

  const remaining = access.waitUntil ? formatRemaining(remainingUntil(access.waitUntil)) : null
  const method = preferredMethod(wallet)
  const waitArrived = access.kind === 'waitfree' && access.readable

  if (episode.status !== 'published') {
    return (
      <section className="ep-lock">
        <div className="ep-lock-body">
          <p className="eyebrow">Coming soon</p>
          <h2>다음 화는 아직 집필 중입니다</h2>
          <p className="ep-lock-lead">
            투표 결과가 확정되면 이 자리에 공개됩니다. 그동안 다른 갈래를 읽거나 내 소설로 완성해
            보세요.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="ep-lock" aria-label="유료 회차 안내">
      <div className="ep-lock-body">
        <span className="ep-lock-mark">
          <Icon name={access.kind === 'waiting' ? 'clock' : 'lock'} size={18} />
        </span>

        {access.kind === 'waiting' ? (
          <>
            <p className="eyebrow">Wait &amp; Free</p>
            <h2>기다무 — 무료 공개까지 {remaining}</h2>
            <p className="ep-lock-lead">{access.detail}</p>
            <div className="ep-lock-actions">
              <button type="button" className="btn btn-primary" onClick={() => openPricing('pass')}>
                넥스트패스로 바로 읽기 · {formatWon(PASS.price)}/월
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => unlockEpisode(episode, method ?? 'coin')}
                disabled={!method}
              >
                2코인으로 바로 열기
              </button>
            </div>
            <p className="ep-lock-note">
              기다무는 회차마다 한 번 신청할 수 있고, {WAIT_FREE_HOURS}시간이 지나면 무료로 열립니다.
            </p>
          </>
        ) : waitArrived ? (
          <>
            <p className="eyebrow">Wait &amp; Free</p>
            <h2>기다무가 도착했어요</h2>
            <p className="ep-lock-lead">기다린 회차를 지금 무료로 열 수 있습니다.</p>
            <div className="ep-lock-actions">
              <button type="button" className="btn btn-primary" onClick={() => collectWaitFree(episode)}>
                무료로 열기
              </button>
            </div>
          </>
        ) : access.kind === 'waitfree' ? (
          <>
            <p className="eyebrow">Wait &amp; Free</p>
            <h2>이 회차는 기다리면 무료</h2>
            <p className="ep-lock-lead">
              기다무를 신청하면 {WAIT_FREE_HOURS}시간 뒤 무료로 열립니다. 기다리지 않고 바로 읽으려면
              넥스트패스나 2코인을 쓰면 됩니다.
            </p>
            <div className="ep-lock-actions">
              <button type="button" className="btn btn-primary" onClick={() => requestWaitFree(episode)}>
                기다무 신청하기
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => openPricing('pass')}>
                패스로 바로 읽기
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => openPricing('coin')}>
                충전소
              </button>
            </div>
            <p className="ep-lock-note">기다무 신청은 회차마다 한 번, 무료로 열리면 계속 읽을 수 있습니다.</p>
          </>
        ) : (
          <>
            <p className="eyebrow">Paid Episode</p>
            <h2>이 회차는 유료 회차입니다</h2>
            <p className="ep-lock-lead">
              대여권 1장 또는 {EPISODE_PRICE.coins}코인으로 열 수 있습니다. 넥스트패스를 쓰면 전 작품
              유료 회차를 무제한으로 읽습니다.
            </p>
            <div className="ep-lock-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => unlockEpisode(episode, 'ticket')}
                disabled={wallet.tickets < EPISODE_PRICE.tickets}
              >
                대여권 1장으로 열기
                <span className="ep-lock-balance">보유 {wallet.tickets}장</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => unlockEpisode(episode, 'coin')}
                disabled={wallet.coins < EPISODE_PRICE.coins}
              >
                {EPISODE_PRICE.coins}코인으로 열기
                <span className="ep-lock-balance">보유 {wallet.coins}코인</span>
              </button>
            </div>
            <button
              type="button"
              className="ep-lock-pass"
              onClick={() => openPricing('pass')}
            >
              <span>
                <Icon name="pass" size={16} />
                <b>{PASS.name}</b> — 전 작품 무제한 · {formatWon(PASS.price)}/월
                {hasPass ? ' (이용 중)' : ''}
              </span>
              <Icon name="arrowRight" size={16} />
            </button>
            <p className="ep-lock-note">
              <Icon name="lock" size={12} /> 결제 연동 전 데모입니다. 대여권·코인은 이 기기 지갑에서
              차감되고, 실제 결제는 이뤄지지 않습니다. 충전이 모자라면{' '}
              <Link to="/about">운영 안내</Link>를 확인하세요.
            </p>
          </>
        )}
      </div>

      {novelId && (
        <div className="ep-lock-escape">
          {freeEpisodeId && (
            <Link to={`/novel/${novelId}/ep/${freeEpisodeId}`}>
              무료 회차부터 읽기 <Icon name="arrowRight" size={12} />
            </Link>
          )}
          <Link to={`/novel/${novelId}#episodes`}>
            회차 목록 보기 <Icon name="arrowRight" size={12} />
          </Link>
        </div>
      )}
    </section>
  )
}
