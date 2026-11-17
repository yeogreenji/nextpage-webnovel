import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { AppliedLine, Character, ChatMessage, Novel, PlayPick, PlayScene } from '../types'
import { useStore } from '../store/StoreProvider'
import {
  buildSceneChatRequest,
  loadSceneMessages,
  makeMessage,
  saveSceneMessages,
  sceneOfflineReply,
} from '../lib/chat'
import { imageUrl } from '../data/art'
import { withAndParticle } from '../lib/format'

interface Props {
  novel: Novel
  scene: PlayScene
  characters: Character[]
  picks: PlayPick[]
  applied: AppliedLine[]
  onApply: (input: {
    text: string
    kind: 'character' | 'user'
    characterId: string
    characterName: string
  }) => void
  onClose: () => void
}

const SUGGESTIONS = [
  '지금 이 장면, 어떻게 생각해요?',
  '내가 방금 고른 선택, 괜찮았나요?',
  '지금 무슨 생각 하고 있어요?',
]

/**
 * 💬 장면 중간 캐릭터 톡 + 「이 대사 소설에 적용하기」
 * - 지금 읽고 있는 장면·내 선택을 기억하고 답합니다. (/api/chat, 실패 시 기기 안 응답)
 * - 마음에 드는 대사는 그 자리에서 소설 본문으로 옮겨집니다.
 */
export function SceneChat({ novel, scene, characters, picks, applied, onApply, onClose }: Props) {
  const { notify } = useStore()
  const cast = characters.length > 0 ? characters : []
  const [activeId, setActiveId] = useState<string>(scene.speakerId ?? cast[0]?.id ?? '')
  const character = cast.find((item) => item.id === activeId) ?? cast[0]

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!character) return
    setMessages(loadSceneMessages(novel.id, scene.id, character.id))
  }, [character, novel.id, scene.id])

  useEffect(() => {
    const node = listRef.current
    if (node) node.scrollTop = node.scrollHeight
  }, [messages, sending])

  useEffect(() => {
    const timer = window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 220)
    return () => window.clearTimeout(timer)
  }, [])

  const appliedKeys = useMemo(
    () => new Set(applied.map((line) => `${line.kind}::${line.text.trim()}`)),
    [applied],
  )

  const apply = useCallback(
    (text: string, kind: 'character' | 'user', who: Character) => {
      const value = text.trim()
      if (!value) return
      if (appliedKeys.has(`${kind}::${value}`)) {
        notify('이미 소설에 들어간 대사예요')
        return
      }
      onApply({ text: value, kind, characterId: who.id, characterName: who.name })
      notify('대사를 소설에 넣었어요')
    },
    [appliedKeys, notify, onApply],
  )

  const send = useCallback(
    async (text: string) => {
      if (!character) return
      const value = text.trim()
      if (!value || sending) return

      const history = messages
      const userMessage = makeMessage('user', value)
      const nextMessages = [...history, userMessage]
      setMessages(nextMessages)
      setInput('')
      setSending(true)

      try {
        saveSceneMessages(novel.id, scene.id, character.id, nextMessages)
        const request = buildSceneChatRequest({
          novel,
          character,
          scene,
          picks,
          applied,
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
          // 정적 배포나 로컬 미리보기에서는 /api 가 없습니다. 폴백으로 계속합니다.
        }

        if (!reply) {
          source = 'offline'
          reply = sceneOfflineReply(character, value, scene, picks)
        }

        const replyMessage = makeMessage('character', reply, source)
        setMessages((prev) => {
          const withReply = [...prev, replyMessage]
          saveSceneMessages(novel.id, scene.id, character.id, withReply)
          return withReply
        })
      } catch {
        notify('메시지를 보내지 못했어요. 다시 시도해 주세요')
      } finally {
        setSending(false)
      }
    },
    [applied, character, messages, novel, notify, picks, scene, sending],
  )

  if (!character) return null

  const avatar = imageUrl(character.image)
  const lastSource = [...messages].reverse().find((message) => message.role === 'character')?.source

  return (
    <>
      <div className="scene-chat-backdrop" onClick={onClose} aria-hidden />
      <aside className="scene-chat" role="dialog" aria-modal="true" aria-label={`${withAndParticle(character.name)} 이 장면 대화`}>
        <header className="scene-chat-head">
          <div className="min-w-0 flex-1">
            <p className="scene-chat-eyebrow">
              {scene.no}장 · {scene.title}
            </p>
            <p className="scene-chat-title">
              {character.name}
              <span>에게 지금 말 걸기</span>
            </p>
          </div>
          <button type="button" className="scene-chat-close" onClick={onClose} aria-label="대화 닫기">
            ✕
          </button>
        </header>

        <div className="scene-chat-cast" role="tablist" aria-label="대화할 인물">
          {cast.map((item) => {
            const face = imageUrl(item.image)
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={item.id === character.id}
                className="scene-chat-chip"
                data-active={item.id === character.id}
                onClick={() => setActiveId(item.id)}
              >
                <span className="scene-chat-chip-face">
                  {face ? <img src={face} alt="" /> : <span aria-hidden>{item.name.slice(0, 1)}</span>}
                </span>
                <span className="min-w-0">
                  <span className="scene-chat-chip-name">{item.name}</span>
                  <span className="scene-chat-chip-role">{item.badge ?? item.tag}</span>
                </span>
              </button>
            )
          })}
        </div>

        <div className="scene-chat-thread" ref={listRef}>
          {messages.length === 0 && (
            <div className="scene-chat-empty">
              <span className="scene-chat-empty-face">
                {avatar ? <img src={avatar} alt="" /> : <span aria-hidden>{character.name.slice(0, 1)}</span>}
              </span>
              <p className="scene-chat-empty-title">
                {character.name}는 지금 이 장면에 서 있습니다
              </p>
              <p className="scene-chat-empty-body">
                “{scene.place}” — {scene.title}. 여기까지의 내 선택을 기억하고 {character.name}의 말투로
                답합니다. 마음에 드는 대사는 그대로 소설에 넣어 보세요.
              </p>
            </div>
          )}

          {messages.map((message, index) => {
            const kind = message.role === 'user' ? 'user' : 'character'
            const isApplied = appliedKeys.has(`${kind}::${message.text.trim()}`)
            const previous = messages[index - 1]
            const canPair =
              message.role === 'character' &&
              previous?.role === 'user' &&
              index === messages.length - 1 &&
              !sending

            return (
              <div key={message.id} className={`scene-chat-row ${message.role === 'user' ? 'mine' : ''}`}>
                <div className="scene-chat-bubble" data-role={message.role}>
                  {message.text.split(/\n{2,}/).map((paragraph, part) => (
                    <p key={part}>{paragraph}</p>
                  ))}
                </div>
                <div className="scene-chat-actions">
                  <button
                    type="button"
                    className="scene-chat-apply"
                    data-applied={isApplied}
                    onClick={() => apply(message.text, kind, character)}
                  >
                    {isApplied ? '✓ 소설에 들어감' : '✎ 이 대사 소설에 적용'}
                  </button>
                  {canPair && (
                    <button
                      type="button"
                      className="scene-chat-apply ghost"
                      onClick={() => {
                        apply(previous.text, 'user', character)
                        apply(message.text, 'character', character)
                      }}
                    >
                      티키타카 둘 다 넣기
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {sending && (
            <div className="scene-chat-row">
              <div className="scene-chat-bubble chat-typing" data-role="character" aria-label="답장 준비 중">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}
        </div>

        {messages.length === 0 && (
          <div className="scene-chat-suggest">
            {SUGGESTIONS.map((suggestion) => (
              <button key={suggestion} type="button" onClick={() => void send(suggestion)}>
                {suggestion}
              </button>
            ))}
          </div>
        )}

        <form
          className="scene-chat-input"
          onSubmit={(event) => {
            event.preventDefault()
            void send(input)
          }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={`${character.name}에게 말 걸기…`}
            aria-label="메시지 입력"
            maxLength={400}
          />
          <button type="submit" disabled={sending || input.trim().length === 0}>
            보내기
          </button>
        </form>

        <p className="scene-chat-foot">
          {lastSource === 'offline'
            ? 'AI 키가 연결되지 않아 기기 안의 장면 응답으로 대화하고 있어요. 적용한 대사는 소설에 그대로 남습니다.'
            : '이 장면과 내 선택을 기억하고 답합니다. 「적용」을 누르면 본문에 대화 블록으로 들어갑니다.'}
        </p>
      </aside>
    </>
  )
}
