import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ChatMessage, Character, Episode, Novel } from '../types'
import { useStore } from '../store/StoreProvider'
import {
  CHAT_FAILURE_TEXT,
  affinityOf,
  buildChatRequest,
  clearMessages,
  loadMessages,
  makeMessage,
  offlineReply,
  requestChat,
  saveMessages,
} from '../lib/chat'
import type { ChatFailure } from '../lib/chat'
import { describeChoices } from '../lib/story'
import { allSessions } from '../lib/play'
import { imageUrl } from '../data/art'
import { withAndParticle } from '../lib/format'
import { Icon } from './Icon'
import { CHAT_FREE_TURNS, CHAT_UNLOCK, PASS, chatAccess, formatWon } from '../lib/commerce'

interface Props {
  novel: Novel
  character: Character
  currentEpisode: Episode | null
  /** 이 화에 실제로 나오는 인물 — 목록 밖 인물을 부르지 않게 프롬프트에 싣습니다 */
  present?: Character[]
  /** 닫기 버튼 (오버레이 모드에서 사용) */
  onClose?: () => void
}

/**
 * 💬 캐릭터 톡 — 작품의 핵심 인물과 메신저처럼 대화합니다.
 * - Vercel 배포 시: /api/chat (Gemini → OpenAI 순서로 시도)
 * - 정적 배포·AI 장애 시: 캐릭터별 성격이 살아 있는 상황 응답 (오프라인 폴백)
 * - 호감도·기분은 이 기기에서 대화량으로 계산합니다.
 */
export function CharacterChat({ novel, character, currentEpisode, present, onClose }: Props) {
  const { episodes, votes, notify, wallet, hasPass, unlockCharacterChat, openPricing } = useStore()
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    loadMessages(novel.id, character.id),
  )
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [failure, setFailure] = useState<ChatFailure | null>(null)
  const [retryText, setRetryText] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMessages(loadMessages(novel.id, character.id))
    setFailure(null)
    setRetryText(null)
  }, [novel.id, character.id])

  useEffect(() => {
    const node = listRef.current
    if (node) node.scrollTop = node.scrollHeight
  }, [messages, sending])

  const affinity = useMemo(
    () => affinityOf({ messages, appliedCount: 0, picks: allSessions()[novel.id]?.picks.length ?? 0 }),
    [messages, novel.id],
  )

  const send = useCallback(
    async (text: string, retry = false) => {
      const value = text.trim()
      if (!value || sending) return

      // 실패 후 「다시 시도」는 내 메시지를 또 쌓지 않고, 마지막 메시지에 대한 답장만 다시 요청합니다.
      const lastIsUser = messages[messages.length - 1]?.role === 'user'
      const history = retry && lastIsUser ? messages.slice(0, -1) : messages
      const nextMessages = retry && lastIsUser ? messages : [...messages, makeMessage('user', value)]
      setMessages(nextMessages)
      setInput('')
      setSending(true)
      setFailure(null)
      setRetryText(value)

      try {
        saveMessages(novel.id, character.id, nextMessages)
        const request = buildChatRequest({
          novel,
          character,
          episodes,
          votes,
          currentEpisode,
          present: (present ?? novel.characters ?? []).map((item) => item.name),
          message: value,
          history,
        })

        const result = await requestChat(request)
        let reply = result.reply
        let source: ChatMessage['source'] = 'ai'
        if (!reply) {
          source = 'offline'
          setFailure(result.failure)
          reply = offlineReply(
            character,
            value,
            currentEpisode,
            describeChoices(novel, episodes, votes),
          )
        }

        const characterMessage = makeMessage('character', reply, source)
        setMessages((prev) => {
          const withReply = [...prev, characterMessage]
          saveMessages(novel.id, character.id, withReply)
          return withReply
        })
      } catch {
        notify('메시지를 보내지 못했어요. 다시 시도해 주세요')
      } finally {
        setSending(false)
      }
    },
    [character, currentEpisode, episodes, messages, novel, notify, present, sending, votes],
  )

  const avatar = imageUrl(character.image)
  const lastSource = [...messages].reverse().find((message) => message.role === 'character')?.source
  const sentByUser = messages.filter((message) => message.role === 'user').length
  const gate = chatAccess(character.id, wallet, sentByUser)

  return (
    <section className="chat" aria-label={`${character.name} 캐릭터 톡`}>
      <header className="chat-header">
        <span className="chat-avatar">
          {avatar ? <img src={avatar} alt="" /> : <span aria-hidden>{character.name.slice(0, 1)}</span>}
        </span>
        <span className="min-w-0 flex-1">
          <span className="chat-name">{character.name}</span>
          <span className="chat-role">
            {character.role} · 대화 {sentByUser}번
            {gate.viaPass ? ' · 패스 무제한' : gate.unlocked ? ' · 열람권' : ` · 무료 ${gate.freeTurnsLeft}번 남음`}
          </span>
        </span>
        <button
          type="button"
          className="chat-action"
          onClick={() => {
            clearMessages(novel.id, character.id)
            setMessages([])
            setFailure(null)
            setRetryText(null)
            notify('대화를 지웠어요')
          }}
        >
          대화 지우기
        </button>
        {onClose && (
          <button type="button" className="chat-action" onClick={onClose}>
            닫기
          </button>
        )}
      </header>

      {/* 호감도 · 기분 */}
      <div className="chat-tone" aria-label="호감도와 기분">
        <span className="chat-tone-gauge">
          <span className="chat-tone-line">
            <span>
              호감도 <b>{affinity.tier}</b>
            </span>
            <span>{affinity.score}/100</span>
          </span>
          <span className="chat-tone-meter" aria-hidden>
            <span style={{ width: `${Math.max(3, affinity.score)}%` }} />
          </span>
        </span>
        <span className="chat-mood-chip" title={affinity.mood}>
          {affinity.mood}
        </span>
      </div>

      <div className="chat-thread" ref={listRef}>
        {messages.length === 0 && (
          <div className="chat-empty">
            <p className="chat-empty-title">{withAndParticle(character.name)} 첫 대화를 시작해 보세요</p>
            <p className="chat-empty-body">
              이 작품({novel.title})의 세계관과 내가 고른 선택지를 기억하고, {character.name}의 말투로
              답장합니다.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`chat-row ${message.role === 'user' ? 'mine' : ''}`}>
            <div className="chat-bubble" data-role={message.role}>
              {message.text.split('\n\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
        ))}

        {sending && (
          <div className="chat-row">
            <div className="chat-bubble chat-typing" data-role="character" aria-label="답장 준비 중">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
      </div>

      {failure && (
        <div className="chat-retry" role="status">
          <span>{CHAT_FAILURE_TEXT[failure]}</span>
          <button type="button" onClick={() => retryText && void send(retryText, true)} disabled={sending}>
            다시 시도
          </button>
        </div>
      )}

      {gate.allowed ? (
        <>
          <form
            className="chat-input"
            onSubmit={(event) => {
              event.preventDefault()
              void send(input)
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={`${character.name}에게 하고 싶은 말을 직접 쓰세요…`}
              aria-label="메시지 입력"
              maxLength={500}
              autoFocus
            />
            <button type="submit" disabled={sending || input.trim().length === 0}>
              보내기
            </button>
          </form>
          <p className="chat-quota">
            {gate.viaPass || gate.unlocked
              ? '대화 제한 없이 이어갈 수 있어요.'
              : `무료 대화 ${CHAT_FREE_TURNS}번 중 ${sentByUser}번 사용 — 이후 ${PASS.name} 또는 ${CHAT_UNLOCK.coins}코인`}
          </p>
        </>
      ) : (
        <div className="chat-gate">
          <p className="chat-gate-kicker">
            <Icon name="lock" size={14} /> 무료 대화 {CHAT_FREE_TURNS}번을 다 썼어요
          </p>
          <p className="chat-gate-body">
            {withAndParticle(character.name)}의 대화를 이어가려면 {PASS.name}(전 작품·전 인물 무제한)나{' '}
            {CHAT_UNLOCK.coins}코인으로 이 인물의 대화를 열 수 있습니다.
          </p>
          <div className="chat-gate-actions">
            <button type="button" className="btn btn-primary btn-sm" onClick={() => openPricing('pass')}>
              {PASS.name} · {formatWon(PASS.price)}/월
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => unlockCharacterChat(character.id, character.name)}
            >
              {CHAT_UNLOCK.coins}코인으로 열기 ({wallet.coins}코인)
            </button>
          </div>
          {hasPass && <p className="chat-gate-body">패스 이용 중에는 계속 대화할 수 있습니다.</p>}
        </div>
      )}

      <p className="chat-foot">
        {lastSource === 'offline'
          ? 'AI 키가 연결되지 않아 기기 안의 상황 응답으로 대화하고 있어요. 작품 맥락과 말투는 그대로입니다.'
          : '작품 세계관과 내 선택지를 바탕으로 답장합니다. 대화는 이 기기에 저장됩니다.'}{' '}
        <Link to="/about" className="underline decoration-dotted underline-offset-4">
          자세히
        </Link>
      </p>
    </section>
  )
}
