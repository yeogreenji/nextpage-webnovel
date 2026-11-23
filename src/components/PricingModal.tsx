import { useEffect, useState } from 'react'
import { useStore } from '../store/StoreProvider'
import type { PricingTab } from '../store/StoreProvider'
import { Icon } from './Icon'
import {
  COIN_PACKAGES,
  PASS,
  TICKET_PACKAGES,
  coinUnitPrice,
  formatWon,
  passIsTrial,
  ticketUnitPrice,
} from '../lib/commerce'

/**
 * 충전소 — 코인 · 대여권 · 넥스트패스.
 * 결제선(PG)은 아직 붙지 않은 데모입니다. 버튼을 눌러도 실제 결제는 이뤄지지 않고,
 * 지갑(이 기기 저장소)에만 반영됩니다. PG 연동 시 `buyCoins`·`subscribePass` 앞에
 * 결제 승인 단계만 붙이면 됩니다.
 */
export function PricingModal() {
  const {
    pricingOpen,
    pricingTab,
    selectPricingTab,
    closePricing,
    wallet,
    hasPass,
    passDays,
    buyCoins,
    buyTickets,
    subscribePass,
    activateTrial,
    endPass,
  } = useStore()
  const [coinId, setCoinId] = useState(COIN_PACKAGES[1].id)
  const [ticketId, setTicketId] = useState(TICKET_PACKAGES[1].id)
  const [trialOn, setTrialOn] = useState(false)

  useEffect(() => {
    if (!pricingOpen) return undefined
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closePricing()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pricingOpen, closePricing])

  useEffect(() => {
    if (pricingOpen) setTrialOn(false)
  }, [pricingOpen, pricingTab])

  if (!pricingOpen) return null

  const coin = COIN_PACKAGES.find((item) => item.id === coinId) ?? COIN_PACKAGES[0]
  const ticket = TICKET_PACKAGES.find((item) => item.id === ticketId) ?? TICKET_PACKAGES[0]
  const tabs: { id: PricingTab; label: string }[] = [
    { id: 'coin', label: '코인 충전' },
    { id: 'ticket', label: '대여권' },
    { id: 'pass', label: PASS.name },
  ]

  return (
    <div
      className="modal-backdrop store-backdrop"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) closePricing()
      }}
    >
      <div className="store-modal" role="dialog" aria-modal="true" aria-labelledby="store-title">
        <header className="store-head">
          <div className="min-w-0">
            <p className="eyebrow">Charge &amp; Pass</p>
            <h2 id="store-title" className="store-title">
              충전소
            </h2>
          </div>
          <div className="store-balance" aria-label="보유 잔액">
            <span>
              <Icon name="coin" size={15} /> 코인 <b>{wallet.coins}</b>
            </span>
            <span>
              <Icon name="ticket" size={15} /> 대여권 <b>{wallet.tickets}</b>
            </span>
            <span data-pass={hasPass}>
              <Icon name="pass" size={15} /> {hasPass ? `패스 D-${passDays}` : '패스 없음'}
            </span>
          </div>
          <button type="button" className="store-close" onClick={closePricing} aria-label="충전소 닫기">
            <Icon name="close" size={18} />
          </button>
        </header>

        <div className="store-tabs" role="tablist" aria-label="충전 항목">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={pricingTab === tab.id}
              data-active={pricingTab === tab.id}
              onClick={() => selectPricingTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="store-body">
          {pricingTab === 'coin' && (
            <>
              <p className="store-lead">
                코인 1개는 100원. 유료 회차 1편은 <b>2코인</b>으로 열립니다. 충전한 코인은 이 기기에
                남습니다.
              </p>
              <div className="store-grid">
                {COIN_PACKAGES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="store-card"
                    data-active={item.id === coin.id}
                    aria-pressed={item.id === coin.id}
                    onClick={() => setCoinId(item.id)}
                  >
                    {item.tag && <span className="store-tag">{item.tag}</span>}
                    <span className="store-amount">
                      {item.coins}
                      <em>코인</em>
                      {item.bonus > 0 && <span className="store-bonus">+{item.bonus}</span>}
                    </span>
                    <span className="store-price">{formatWon(item.price)}</span>
                    <span className="store-note">{item.note}</span>
                    <span className="store-unit">1코인 {coinUnitPrice(item)}원</span>
                  </button>
                ))}
              </div>
              <div className="store-foot">
                <span>
                  <b>{coin.coins + coin.bonus}코인</b> · {formatWon(coin.price)}
                </span>
                <button type="button" className="btn btn-primary" onClick={() => buyCoins(coin)}>
                  결제하기 <span className="store-demo">데모</span>
                </button>
              </div>
            </>
          )}

          {pricingTab === 'ticket' && (
            <>
              <p className="store-lead">
                대여권 1장이면 유료 회차 1편을 바로 열 수 있습니다. 코인보다 회차당 단가가 낮습니다.
              </p>
              <div className="store-grid store-grid-3">
                {TICKET_PACKAGES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="store-card"
                    data-active={item.id === ticket.id}
                    aria-pressed={item.id === ticket.id}
                    onClick={() => setTicketId(item.id)}
                  >
                    {item.tag && <span className="store-tag">{item.tag}</span>}
                    <span className="store-amount">
                      {item.tickets}
                      <em>장</em>
                    </span>
                    <span className="store-price">{formatWon(item.price)}</span>
                    <span className="store-note">{item.note}</span>
                    <span className="store-unit">1장 {ticketUnitPrice(item)}원</span>
                  </button>
                ))}
              </div>
              <div className="store-foot">
                <span>
                  대여권 <b>{ticket.tickets}장</b> · {formatWon(ticket.price)}
                </span>
                <button type="button" className="btn btn-primary" onClick={() => buyTickets(ticket)}>
                  결제하기 <span className="store-demo">데모</span>
                </button>
              </div>
            </>
          )}

          {pricingTab === 'pass' && (
            <div className="pass-panel">
              <div className="pass-card">
                <div className="pass-card-top">
                  <span className="pass-mark">
                    <Icon name="pass" size={16} /> {PASS.name}
                  </span>
                  <span className="pass-price">
                    {formatWon(PASS.price)}
                    <em>/월</em>
                  </span>
                </div>
                <ul className="pass-features">
                  {PASS.features.map((feature) => (
                    <li key={feature}>
                      <Icon name="check" size={14} /> {feature}
                    </li>
                  ))}
                </ul>
                <p className="pass-note">{PASS.note}</p>
              </div>

              <div className="pass-side">
                <label className="pass-toggle">
                  <span>
                    <b>패스 무료 체험 활성화</b>
                    <em>결제 연동 전 데모 · {PASS.trialDays}일</em>
                  </span>
                  <input
                    type="checkbox"
                    checked={trialOn}
                    disabled={hasPass || wallet.trialUsed}
                    onChange={(event) => setTrialOn(event.target.checked)}
                  />
                  <span className="pass-switch" aria-hidden />
                </label>

                {hasPass ? (
                  <>
                    <p className="pass-status">
                      이용 중 · 남은 기간 <b>{passDays}일</b>
                      {passIsTrial(wallet) ? ' (무료 체험)' : ''}
                    </p>
                    <button type="button" className="btn btn-secondary" onClick={endPass}>
                      패스 해지
                    </button>
                  </>
                ) : (
                  <>
                    <p className="pass-status">
                      {trialOn
                        ? `${PASS.trialDays}일 동안 모든 유료 회차와 캐릭터 톡을 무제한으로 씁니다.`
                        : wallet.trialUsed
                          ? '무료 체험을 이미 사용했어요. 이번 달부터 정기 결제로 이용할 수 있습니다.'
                          : '무료 체험으로 먼저 써 보고, 마음에 들면 정기 결제로 이어가세요.'}
                    </p>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        if (trialOn) {
                          activateTrial()
                          return
                        }
                        subscribePass()
                      }}
                    >
                      {trialOn ? `${PASS.trialDays}일 무료 체험 시작` : `${PASS.name} 시작 · ${formatWon(PASS.price)}/월`}
                      <span className="store-demo">데모</span>
                    </button>
                  </>
                )}
                <p className="pass-fine">
                  데모 화면입니다. 실제 결제·청구는 이뤄지지 않으며, 결제선(PG) 연동 시 이 버튼이
                  실제 승인으로 바뀝니다. 데모에서 해지하면 즉시 이용이 끝납니다.
                </p>
              </div>
            </div>
          )}
        </div>

        <footer className="store-foot-note">
          <span>
            <Icon name="lock" size={13} /> 결제 연동 전 데모 — 이 화면의 결제는 이 기기 지갑에만
            반영됩니다.
          </span>
          {wallet.history.length > 0 && (
            <span className="store-recent">
              최근: {wallet.history[wallet.history.length - 1].label}
              {wallet.history[wallet.history.length - 1].amount > 0
                ? ` · ${formatWon(wallet.history[wallet.history.length - 1].amount)}`
                : ''}
            </span>
          )}
        </footer>
      </div>
    </div>
  )
}
