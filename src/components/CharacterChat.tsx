import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ChatMessage, Character, Episode, Novel } from '../types'
import { useStore } from '../store/StoreProvider'
import { buildChatRequest, clearMessages, loadMessages, makeMessage, offlineReply, saveMessages } from '../lib/chat'
import { describeChoices } from '../lib/story'
import { imageUrl } from '../data/art'
import { withAndParticle } from '../lib/format'

interface Props {
  novel: Novel
  character: Character
  currentEpisode: Episode | null
  /** 닫기 버튼 (오버레이 모드에서 사용) */
  onClose?: () => void
}

const SUGGESTIONS = [
  '지금 기분이 어때요?',
  '다음 화에서 내 선택, 어떻게 될 것 같아요?',
  '서로에게 솔직해져 볼까요?',
]

/**
 * 💬 캐릭터 톡 — 작품의 핵심 인물과 메신저처럼 대화합니다.
 * - Vercel 배포 시: /api/chat (Gemini → OpenAI 순서로 시도)
 * - GitHub Pages 등 정적 배포 시: 캐릭터별 성격이 살아 있는 상황 응답 (오프라인 폴백)
 */
export function CharacterChat({ novel, character, currentEpisode, onClose }: Props) {
  const { episodes, votes, notify } = useStore()
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    loadMessages(novel.id, character.id),
  )
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMessages(loadMessages(novel.id, character.id))
  }, [novel.id, character.id])

  useEffect(() => {
    const node = listRef.current
    if (node) node.scrollTop = node.scrollHeight
  }, [messages, sending])

  const send = useCallback(
    async (text: string) => {
      const value = text.trim()
      if (!value || sending) return

      const history = messages
      const userMessage = makeMessage('user', value)
      const nextMessages = [...history, userMessage]
      setMessages(nextMessages)
      setInput('')
      setSending(true)

      try {
        saveMessages(novel.id, character.id, nextMessages)
        const request = buildChatRequest({
          novel,
          character,
          episodes,
          votes,
          currentEpisode,
          message: value,
          history,
        })

        let reply: string | null = null
        let source: ChatMessage['source'] = 'ai'
        try {
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
          })
          if (response.ok) {
            const data = (await response.json()) as { reply?: string }
            reply = data.reply ?? null
          }
        } catch {
          // 정적 배포(GitHub Pages)에서는 /api 가 없습니다. 폴백으로 계속합니다.
        }

        if (!reply) {
          source = 'offline'
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
    [character, currentEpisode, episodes, messages, novel, notify, sending, votes],
  )

  const avatar = imageUrl(character.image)
  const lastSource = [...messages].reverse().find((message) => message.role === 'character')?.source

  return (
    <section className="chat" aria-label={`${character.name} 캐릭터 톡`}>
      <header className="chat-header">
        <span className="chat-avatar">
          {avatar ? <img src={avatar} alt="" /> : <span aria-hidden>{character.name.slice(0, 1)}</span>}
        </span>
        <span className="min-w-0 flex-1">
          <span className="chat-name">{character.name}</span>
          <span className="chat-role">{character.role}</span>
        </span>
        <button
          type="button"
          className="chat-action"
          onClick={() => {
            clearMessages(novel.id, character.id)
            setMessages([])
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

      {messages.length === 0 && (
        <div className="chat-suggest">
          {SUGGESTIONS.map((suggestion) => (
            <button key={suggestion} type="button" onClick={() => void send(suggestion)}>
              {suggestion}
            </button>
          ))}
        </div>
      )}

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
          placeholder={`${character.name}에게 말 걸기…`}
          aria-label="메시지 입력"
          maxLength={500}
        />
        <button type="submit" disabled={sending || input.trim().length === 0}>
          보내기
        </button>
      </form>

      <p className="chat-foot">
        {lastSource === 'offline'
          ? 'AI 키가 연결되지 않아 기기 안의 상황 응답으로 대화하고 있어요. 작품 맥락과 말투는 그대로입니다.'
          : '작품 세계관과 내 선택지를 바탕으로 답장합니다. AI 응답은 실시간으로 만들어집니다.'}{' '}
        <Link to="/about" className="underline decoration-dotted underline-offset-4">
          자세히
        </Link>
      </p>
    </section>
  )
}
