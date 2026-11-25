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
  CHAT_FAILURE_TEXT,
  affinityOf,
  buildSceneChatRequest,
  loadSceneMessages,
  makeMessage,
  requestChat,
  saveSceneMessages,
  sceneOfflineReply,
} from '../lib/chat'
import type { ChatFailure } from '../lib/chat'
import { presentCast } from '../lib/cast'
import { imageUrl } from '../data/art'
import { withAndParticle, withSubjectParticle } from '../lib/format'

interface Props {
  novel: Novel
  scene: PlayScene
  characters: Character[]
  /** 이 화에 실제로 있는 인물 — 없으면 작품 데이터에서 계산합니다 */
  present?: Character[]
  picks: PlayPick[]
  applied: AppliedLine[]
  /** 이 화의 말 걸기 지점 — 힌트와 행동 요약이 여기서 나옵니다. */
  interaction: SceneInteraction
  /** 말 걸기 지점에서 고른 힌트 — 입력창에 미리 채워 둡니다. */
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
 * 💬 이 화의 인물과 직접 대화 + 「이 대사 소설에 적용하기」
 * — 독자가 타자로 직접 말을 겁니다. 추천 멘트는 그 화의 본문 대사에서만 만든 '힌트'입니다.
 * — 대화 상대는 이 화에 실제로 서 있는 인물로만 한정합니다(없는 사람은 목록에 없습니다).
 * — 지금 읽고 있는 화·내 선택·이 화에 넣은 대사를 기억하고 답합니다. (/api/chat, 실패 시 기기 안 응답)
 */
export function SceneChat({
  novel,
  scene,
  characters,
  present,
  picks,
  applied,
  interaction,
  initialText,
  onApply,
  onClose,
}: Props) {
  const { notify } = useStore()
  const cast = useMemo(() => {
    const listed = present && present.length > 0 ? present : presentCast(novel, scene)
    if (listed.length > 0) return listed
    return characters.filter((item) => item.id === scene.speakerId).slice(0, 1)
  }, [characters, novel, present, scene])

  const [activeId, setActiveId] = useState<string>(cast[0]?.id ?? '')
  const character = cast.find((item) => item.id === activeId) ?? cast[0]

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState(initialText ?? '')
  const [sending, setSending] = useState(false)
  const [failure, setFailure] = useState<ChatFailure | null>(null)
  const [retryText, setRetryText] = useState<string | null>(null)
  const [hintsOpen, setHintsOpen] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setActiveId(cast[0]?.id ?? '')
  }, [cast])

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

  const affinity = useMemo(
    () => affinityOf({ messages, appliedCount: applied.length, picks: picks.length }),
    [applied.length, messages, picks.length],
  )

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
    async (text: string, retry = false) => {
      if (!character) return
      const value = text.trim()
      if (!value || sending) return

      const lastIsUser = messages[messages.length - 1]?.role === 'user'
      const history = retry && lastIsUser ? messages.slice(0, -1) : messages
      const firstTurn = !retry && history.length === 0
      setFailure(null)
      setRetryText(value)
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
          present: cast.map((item) => item.name),
          message: value,
          history,
        })

        const result = await requestChat(request)
        let reply = result.reply
        let source: ChatMessage['source'] = 'ai'

        if (!reply) {
          source = 'offline'
          setFailure(result.failure)
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
    [applied, cast, character, interaction.action, messages, novel, notify, onApply, picks, scene, sending],
  )

  if (!character) return null

  const avatar = imageUrl(character.image)
  const lastSource = [...messages].reverse().find((message) => message.role === 'character')?.source
  const hints = interaction.prompts.slice(0, 3)

  return (
    <>
      <div className="scene-chat-backdrop" onClick={onClose} aria-hidden />
      <aside
        className="scene-chat"
        role="dialog"
        aria-modal="true"
        aria-label={`${withAndParticle(character.name)} 이 화 대화`}
      >
        <header className="scene-chat-head">
          <div className="min-w-0 flex-1">
            <p className="scene-chat-eyebrow">
              {scene.no}화 · {scene.title}
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

        <div className="chat-tone" aria-label="호감도와 기분">
          <span className="chat-tone-gauge">
            <span className="chat-tone-line">
              <span>
                {character.name} 호감도 <b>{affinity.tier}</b>
              </span>
              <span>{affinity.score}/100</span>
            </span>
            <span className="chat-tone-meter" aria-hidden>
              <span style={{ width: `${Math.max(3, affinity.score)}%` }} />
            </span>
          </span>
          <span className="chat-mood-chip">{affinity.mood}</span>
        </div>

        {cast.length > 1 && (
          <div className="scene-chat-cast" role="tablist" aria-label="이 화에 있는 인물">
            <span className="scene-chat-cast-label">이 화에 있는 사람</span>
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
        )}

        <div className="scene-chat-thread" ref={listRef}>
          {messages.length === 0 && (
            <div className="scene-chat-empty">
              <span className="scene-chat-empty-face">
                {avatar ? <img src={avatar} alt="" /> : <span aria-hidden>{character.name.slice(0, 1)}</span>}
              </span>
              <p className="scene-chat-empty-title">
                {withSubjectParticle(character.name)} 지금 이 화에 서 있습니다
              </p>
              <p className="scene-chat-empty-body">
                {interaction.cue} 하고 싶은 말을 직접 쓰세요. 지금까지의 선택을 기억하고 {character.name}의 말투로
                답합니다.
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

        {failure && (
          <div className="chat-retry" role="status">
            <span>{CHAT_FAILURE_TEXT[failure]}</span>
            <button type="button" onClick={() => retryText && void send(retryText, true)} disabled={sending}>
              다시 시도
            </button>
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
            placeholder={`${character.name}에게 하고 싶은 말을 직접 쓰세요…`}
            aria-label="메시지 입력"
            maxLength={400}
          />
          <button type="submit" disabled={sending || input.trim().length === 0}>
            보내기
          </button>
        </form>

        {hints.length > 0 && (
          <details
            className="scene-chat-hints"
            open={hintsOpen}
            onToggle={(event) => setHintsOpen((event.target as HTMLDetailsElement).open)}
          >
            <summary>이 화에서만 쓰는 힌트 {hints.length}개 — 눌러도 되고, 그냥 직접 써도 됩니다</summary>
            <div className="scene-chat-hint-row">
              {hints.map((hint) => (
                <button
                  key={hint}
                  type="button"
                  disabled={sending}
                  onClick={() => {
                    setInput(hint)
                    inputRef.current?.focus({ preventScroll: true })
                  }}
                >
                  {hint}
                </button>
              ))}
            </div>
          </details>
        )}

        <p className="scene-chat-foot">
          {lastSource === 'offline'
            ? 'AI 키가 연결되지 않아 기기 안의 장면 응답으로 대화하고 있어요. 말을 건 자리와 대사는 소설에 그대로 남습니다.'
            : '말을 걸면 행동 요약과 첫 대사가 소설에 바로 들어갑니다. 이후 대사는 「적용」으로 골라 담으세요.'}
        </p>
      </aside>
    </>
  )
}
