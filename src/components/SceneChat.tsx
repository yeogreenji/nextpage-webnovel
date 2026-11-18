import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  AppliedLine,
  Character,
  ChatMessage,
  Novel,
  PlayPick,
  PlayScene,
  SceneInteraction,
} from '../types'
import { useStore } from '../store/StoreProvider'
import {
  buildSceneChatRequest,
  loadSceneMessages,
  makeMessage,
  saveSceneMessages,
  sceneOfflineReply,
} from '../lib/chat'
import { imageUrl } from '../data/art'
import { withAndParticle, withSubjectParticle } from '../lib/format'

interface Props {
  novel: Novel
  scene: PlayScene
  characters: Character[]
  picks: PlayPick[]
  applied: AppliedLine[]
  /** 이 장면의 말 걸기 지점 — 추천 대사와 행동 요약이 여기서 나옵니다. */
  interaction: SceneInteraction
  /** 말 걸기 지점에서 고른 추천 대사 — 입력창에 미리 채워 둡니다. */
  initialText?: string
  /** 소설에 넣을 대사들 — 한 번에 여러 줄(티키타카)이 들어올 수 있습니다. */
  onApply: (
    inputs: {
      text: string
      kind: 'character' | 'user' | 'action'
      characterId: string
      characterName: string
    }[],
  ) => void
  onClose: () => void
}

/**
 * 💬 장면 중간 캐릭터 톡 + 「이 대사 소설에 적용하기」
 * - 말을 걸면 그 행동과 첫 대사가 곧바로 소설 본문(말 걸기 지점)에 들어갑니다.
 * - 지금 읽고 있는 장면·내 선택을 기억하고 답합니다. (/api/chat, 실패 시 기기 안 응답)
 */
export function SceneChat({
  novel,
  scene,
  characters,
  picks,
  applied,
  interaction,
  initialText,
  onApply,
  onClose,
}: Props) {
  const { notify } = useStore()
  const cast = characters.length > 0 ? characters : []
  const [activeId, setActiveId] = useState<string>(scene.speakerId ?? cast[0]?.id ?? '')
  const character = cast.find((item) => item.id === activeId) ?? cast[0]

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState(initialText ?? '')
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
    if (initialText) setInput(initialText)
  }, [initialText])

  useEffect(() => {
    const timer = window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 220)
    return () => window.clearTimeout(timer)
  }, [])

  const appliedKeys = useMemo(
    () => new Set(applied.map((line) => `${line.kind}::${line.text.trim()}`)),
    [applied],
  )

  const apply = useCallback(
    (items: { text: string; kind: 'character' | 'user' }[], who: Character) => {
      const fresh = items
        .map((item) => ({ ...item, text: item.text.trim() }))
        .filter((item) => item.text.length > 0 && !appliedKeys.has(`${item.kind}::${item.text}`))
      if (fresh.length === 0) {
        notify('이미 소설에 들어간 대사예요')
        return
      }
      // 티키타카는 내 대사와 캐릭터 대사를 한 번에 넘깁니다. 두 줄 모두 저장되어야 합니다.
      onApply(
        fresh.map((item) => ({
          text: item.text,
          kind: item.kind,
          characterId: who.id,
          characterName: who.name,
        })),
      )
      notify(fresh.length > 1 ? `대사 ${fresh.length}개를 소설에 넣었어요` : '대사를 소설에 넣었어요')
    },
    [appliedKeys, notify, onApply],
  )

  const send = useCallback(
    async (text: string) => {
      if (!character) return
      const value = text.trim()
      if (!value || sending) return

      const history = messages
      const firstTurn = history.length === 0
      const userMessage = makeMessage('user', value)
      const nextMessages = [...history, userMessage]
      setMessages(nextMessages)
      setInput('')
      setSending(true)

      // 말을 걸었다는 사실 자체가 소설이 됩니다 —
      // 행동 요약 한 문단과 내가 건넨 첫 대사가 말 걸기 지점에 바로 들어갑니다.
      if (firstTurn) {
        onApply([
          {
            text: interaction.action,
            kind: 'action',
            characterId: character.id,
            characterName: character.name,
          },
          {
            text: value,
            kind: 'user',
            characterId: character.id,
            characterName: character.name,
          },
        ])
        notify('말을 건 장면이 소설에 들어갔어요')
      }

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
        if (firstTurn) {
          onApply([
            {
              text: reply,
              kind: 'character',
              characterId: character.id,
              characterName: character.name,
            },
          ])
        }
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
    [applied, character, interaction.action, messages, novel, notify, onApply, picks, scene, sending],
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
            <p className="scene-chat-live">✍️ 여기서 나눈 말은 소설 본문에 그대로 들어갑니다</p>
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
                {withSubjectParticle(character.name)} 지금 이 장면에 서 있습니다
              </p>
              <p className="scene-chat-empty-body">
                {interaction.cue} 여기까지의 내 선택을 기억하고 {character.name}의 말투로 답합니다. 아래
                추천 대사 중 하나를 눌러도 좋아요.
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
                    onClick={() => apply([{ text: message.text, kind }], character)}
                  >
                    {isApplied ? '✓ 소설에 들어감' : '✎ 이 대사 소설에 적용'}
                  </button>
                  {canPair && (
                    <button
                      type="button"
                      className="scene-chat-apply ghost"
                      onClick={() =>
                        apply(
                          [
                            { text: previous.text, kind: 'user' },
                            { text: message.text, kind: 'character' },
                          ],
                          character,
                        )
                      }
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

        <div className="scene-chat-suggest" aria-label="추천 대사">
          <span className="scene-chat-suggest-label">이 장면에서 건넬 말</span>
          <div className="scene-chat-suggest-row">
            {interaction.prompts.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                disabled={sending}
                onClick={() => void send(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

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
            ? 'AI 키가 연결되지 않아 기기 안의 장면 응답으로 대화하고 있어요. 말을 건 자리와 대사는 소설에 그대로 남습니다.'
            : '말을 걸면 행동 요약과 첫 대사가 소설에 바로 들어갑니다. 이후 대사는 「적용」으로 골라 담으세요.'}
        </p>
      </aside>
    </>
  )
}
