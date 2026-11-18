import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../store/StoreProvider'
import { imageUrl } from '../data/art'
import { flowFor } from '../data/flows'
import { ReadingProgress } from '../components/ReadingProgress'
import { withAndParticle } from '../lib/format'
import { ReaderToolbar } from '../components/ReaderToolbar'
import { SceneChat } from '../components/SceneChat'
import { interactionFor } from '../lib/interaction'
import type { AppliedInput } from '../lib/play'
import type { AppliedLine, PlayChoice, PlayScene, PlaySession } from '../types'
import {
  addAppliedLines,
  appliedFor,
  interactionAnchorOf,
  leadOf,
  clearSession,
  emptySession,
  ensureSession,
  pickChoice,
  progressOf,
  removeAppliedLine,
  resolveEnding,
  rewindTo,
  saveSession,
} from '../lib/play'

/**
 * ✨ 내가 선택하는 대로 완성되는 소설 — 플레이/집필 화면.
 * - 장면마다 3~4개의 갈래, 고르는 즉시 결과 문단이 본문에 붙고 다음 장면이 열립니다.
 * - 장면 중간, 말을 걸기 좋은 자리에서 인물과 대화합니다.
 *   말을 걸면 행동 요약과 대사가 그 자리에 그대로 소설로 들어갑니다.
 * - 여섯 번 고르면 '내가 완성한 소설'로 이어집니다.
 */
export function PlayPage() {
  const { novelId = '' } = useParams()
  const { ready, novels, notify } = useStore()
  const novel = novels.find((item) => item.id === novelId)
  const flow = flowFor(novelId)
  const [session, setSession] = useState<PlaySession | null>(null)
  const [chatSceneId, setChatSceneId] = useState<string | null>(null)
  const [chatSeed, setChatSeed] = useState<string | null>(null)
  const [recordOpen, setRecordOpen] = useState(false)
  const [justPicked, setJustPicked] = useState<string | null>(null)
  const timers = useRef<number[]>([])
  const schedule = (fn: () => void, delay: number) => {
    timers.current.push(window.setTimeout(fn, delay))
  }
  useEffect(() => {
    const pending = timers
    return () => {
      pending.current.forEach((timer) => window.clearTimeout(timer))
      pending.current = []
    }
  }, [])

  useEffect(() => {
    if (!ready || !novelId) return
    setSession(ensureSession(novelId))
  }, [ready, novelId])

  useEffect(() => {
    if (novel) document.title = `${novel.title} — 내가 쓰는 소설 · 넥스트페이지`
    return () => {
      document.title = '넥스트페이지 · 선택형 웹소설'
    }
  }, [novel])

  const progress = progressOf(flow, session)
  const done = progress.done
  const ending = useMemo(
    () => (flow && session ? resolveEnding(flow, session) : null),
    [flow, session],
  )
  const current = flow && session ? flow.scenes[done] ?? null : null

  const choose = useCallback(
    (scene: PlayScene, choice: PlayChoice) => {
      if (!flow || !session) return
      const next = saveSession(pickChoice(flow, session, scene.id, choice.id))
      setSession(next)
      setJustPicked(choice.id)
      schedule(() => setJustPicked(null), 1600)
      schedule(() => {
        if (next.picks.length >= flow.scenes.length) {
          document.getElementById('play-finish')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        } else {
          document.getElementById('play-scene-' + next.picks.length)?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
        }
      }, 240)
      if (next.picks.length >= flow.scenes.length) notify('당신의 소설이 완성됐어요')
    },
    [flow, notify, session],
  )

  const applyLines = useCallback(
    (sceneId: string) => (inputs: AppliedInput[]) => {
      // 「티키타카 둘 다 넣기」처럼 한 번에 여러 줄이 들어와도
      // 한 번의 상태 갱신으로 모두 저장합니다.
      setSession((prev) => saveSession(addAppliedLines(prev ?? ensureSession(novelId), sceneId, inputs)))
    },
    [novelId],
  )

  const rewind = useCallback(
    (sceneIndex: number) => {
      if (!flow || !session) return
      setSession(saveSession(rewindTo(flow, session, sceneIndex)))
      setRecordOpen(false)
      setChatSceneId(null)
      notify(`${sceneIndex + 1}장부터 다시 씁니다`)
      schedule(() => {
        document.getElementById('play-scene-' + sceneIndex)?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }, 120)
    },
    [flow, notify, session],
  )

  const restart = useCallback(() => {
    clearSession(novelId)
    setSession(saveSession(emptySession(novelId)))
    setChatSceneId(null)
    setRecordOpen(false)
    notify('처음부터 다시 씁니다')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [novelId, notify])

  // 키보드 1~4 로 선택
  useEffect(() => {
    if (!current || chatSceneId || recordOpen) return undefined
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && /input|textarea|select/i.test(target.tagName)) return
      if (/^[1-4]$/.test(event.key)) {
        const choice = current.choices[Number(event.key) - 1]
        if (choice) {
          event.preventDefault()
          choose(current, choice)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [chatSceneId, choose, current, recordOpen])

  if (!ready) {
    return (
      <div className="page-shell py-24 text-center text-[13px]" style={{ color: 'var(--ink-mute)' }}>
        이야기를 펼치는 중…
      </div>
    )
  }

  if (!novel || !flow) {
    return (
      <div className="page-shell py-20 text-center">
        <p className="text-[15px] font-bold">아직 선택형으로 열리지 않은 작품입니다.</p>
        <Link to="/library" className="btn btn-secondary btn-sm mt-4">
          작품 목록으로
        </Link>
      </div>
    )
  }

  const activeSession = session ?? ensureSession(novel.id)
  const chatScene = chatSceneId ? flow.scenes.find((scene) => scene.id === chatSceneId) ?? null : null
  const characters = novel.characters ?? []
  const cover = imageUrl(novel.coverImage)

  return (
    <div className="page-shell play-shell pt-4 pb-24">
      <ReadingProgress />

      {/* 진행 바 */}
      <div className="play-bar">
        <Link to={`/novel/${novel.id}`} className="play-back" aria-label="작품 페이지로">
          ‹
        </Link>
        <div className="play-bar-main">
          <p className="play-bar-title">{novel.title}</p>
          <div className="play-progress" aria-hidden>
            <span style={{ width: `${progress.percent}%` }} />
          </div>
        </div>
        <div className="play-bar-meta">
          <span className="play-count">
            {progress.done}
            <span>/{progress.total} 선택</span>
          </span>
          <button type="button" className="play-bar-btn" onClick={() => setRecordOpen((value) => !value)}>
            선택 기록
          </button>
          <button type="button" className="play-bar-btn" onClick={restart}>
            처음부터
          </button>
        </div>
      </div>

      {/* 표지 · 안내 */}
      <header className="play-intro">
        <div className="play-intro-cover">
          {cover ? (
            <img src={cover} alt={`${novel.title} 표지`} />
          ) : (
            <div
              className="play-cover-art"
              style={{ backgroundImage: `linear-gradient(150deg, ${novel.cover.from}, ${novel.cover.to})` }}
              aria-hidden
            >
              <span>{novel.cover.glyph}</span>
            </div>
          )}
        </div>
        <div className="play-intro-copy">
          <p className="eyebrow">내가 쓰는 소설</p>
          <h1>{novel.title}</h1>
          <p className="play-intro-tagline">{novel.tagline}</p>
          <ul className="play-intro-rules">
            <li>
              <b>{flow.scenes.length}장면</b>, 장면마다 <b>3~4개의 갈래</b> — 마음에 드는 문장을
              고릅니다.
            </li>
            <li>고른 즉시 <b>결과 문단</b>이 본문에 붙고, 그 문장이 다음 장면으로 이어집니다.</li>
            <li>
              장면 중간 <b>말 걸기 좋은 자리</b>에서 인물과 대화합니다. 말을 걸면 그 행동과 대사가
              소설에 그대로 들어갑니다.
            </li>
            <li>
              마지막에 <b>{flow.endings.length}개의 엔딩</b> 중 하나 — 마지막 장면에서 고른 선택이
              엔딩을 정합니다.
            </li>
          </ul>
          <div className="play-intro-tools">
            <ReaderToolbar />
          </div>
        </div>
      </header>

      {/* 장면들 */}
      <div className="play-story">
        {flow.scenes.map((scene, sceneIndex) => {
          if (sceneIndex > done) return null
          const pick = activeSession.picks[sceneIndex]
          const choice = scene.choices.find((item) => item.id === pick?.choiceId)
          const isCurrent = sceneIndex === done && !ending
          const lines = appliedFor(activeSession, scene.id)
          const speaker = characters.find((item) => item.id === scene.speakerId) ?? characters[0]
          const interaction = interactionFor(scene, speaker)
          const anchor = interactionAnchorOf(scene)
          const spoke = lines.length > 0
          const openChat = (text?: string) => {
            setChatSceneId(scene.id)
            setChatSeed(text ?? null)
          }

          return (
            <article
              id={`play-scene-${sceneIndex}`}
              key={scene.id}
              className="play-scene"
              data-state={isCurrent ? 'current' : 'done'}
            >
              <header className="play-scene-head">
                <span className="play-scene-no">{scene.no}장</span>
                <div className="min-w-0">
                  <h2 className="play-scene-title">{scene.title}</h2>
                  <p className="play-scene-place">{scene.place}</p>
                </div>
              </header>

              {scene.image ? (
                <figure className="play-scene-figure">
                  <img src={imageUrl(scene.image)} alt="" loading="lazy" decoding="async" />
                </figure>
              ) : (
                speaker && (
                  <div className="play-scene-card">
                    {speaker.image && (
                      <img src={imageUrl(speaker.image)} alt="" loading="lazy" decoding="async" />
                    )}
                    <div className="min-w-0">
                      <p className="play-scene-card-who">
                        이 장면의 인물 · <b>{speaker.name}</b>
                      </p>
                      {speaker.quote && <p className="play-scene-card-quote">“{speaker.quote}”</p>}
                    </div>
                  </div>
                )
              )}

              <div className="play-prose reader-body">
                {leadOf(flow, activeSession, sceneIndex).map((paragraph, index) => (
                  <p key={`lead-${index}`}>{paragraph}</p>
                ))}
                {scene.body.map((paragraph, index) => (
                  <Fragment key={`body-${index}`}>
                    <p>{paragraph}</p>
                    {index === anchor && (
                      <>
                        {spoke && (
                          <div className="play-said" data-scene={scene.id}>
                            <p className="play-said-label">
                              ✍️ {withAndParticle(speaker?.name ?? '인물')} 나눈 말 — 소설에 들어감
                            </p>
                            {lines.map((line) =>
                              line.kind === 'action' ? (
                                <p className="play-said-action" key={line.id}>
                                  {line.text}
                                </p>
                              ) : (
                                <div
                                  className="play-line"
                                  key={line.id}
                                  data-mine={line.kind === 'user'}
                                >
                                  <span className="play-line-who">
                                    {line.kind === 'user' ? '나' : line.characterName}
                                  </span>
                                  <span className="play-line-text">{line.text}</span>
                                  <button
                                    type="button"
                                    className="play-line-remove"
                                    onClick={() =>
                                      setSession(saveSession(removeAppliedLine(activeSession, line.id)))
                                    }
                                    aria-label="소설에서 이 대사 빼기"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ),
                            )}
                          </div>
                        )}

                        {isCurrent && (
                          <div className="speak-gate" data-spoke={spoke}>
                            <p className="speak-gate-kicker">
                              <span aria-hidden>💬</span> 지금 말 걸기 좋은 순간
                            </p>
                            <p className="speak-gate-cue">{interaction.cue}</p>
                            <button
                              type="button"
                              className="speak-gate-open"
                              onClick={() => openChat()}
                            >
                              {withAndParticle(speaker?.name ?? '인물')} 지금 말 걸기
                              <em>소설에 반영됨</em>
                            </button>
                            <div className="speak-gate-prompts" aria-label="추천 대사">
                              {interaction.prompts.map((prompt) => (
                                <button
                                  key={prompt}
                                  type="button"
                                  onClick={() => openChat(prompt)}
                                >
                                  {prompt.startsWith('“') ? prompt : `“${prompt}”`}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </Fragment>
                ))}
              </div>

              {pick && choice && (
                <div className="play-picked">
                  <p className="play-picked-head">
                    <span>내 선택 {sceneIndex + 1}</span>
                    “{choice.label}”
                  </p>
                  <div className="play-result reader-body">
                    {choice.result.map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              )}

              {isCurrent && (
                <div className="choice-panel">
                  <p className="choice-prompt">
                    <span aria-hidden>❖</span> 이 장면에서, 나는 —
                  </p>
                  <div className="choice-grid">
                    {scene.choices.map((item, choiceIndex) => (
                      <button
                        key={item.id}
                        type="button"
                        className="choice-card"
                        data-tone={item.tone}
                        data-just-picked={justPicked === item.id}
                        onClick={() => choose(scene, item)}
                      >
                        <span className="choice-key" data-tone={item.tone}>
                          {String.fromCharCode(65 + choiceIndex)}
                        </span>
                        <span className="choice-label">{item.label}</span>
                        <span className="choice-hint">{item.hint}</span>
                      </button>
                    ))}
                  </div>
                  <div className="choice-foot">
                    <span className="hidden sm:inline">
                      키보드 1 · 2 · 3 · {scene.choices.length} 로도 고를 수 있어요
                    </span>
                    <button
                      type="button"
                      className="play-chat-inline"
                      onClick={() => openChat()}
                    >
                      💬 {withAndParticle(speaker?.name ?? '등장인물')} 대화 — 소설에 반영
                    </button>
                  </div>
                </div>
              )}

              {!isCurrent && speaker && (
                <button
                  type="button"
                  className="play-scene-chat"
                  onClick={() => openChat()}
                >
                  💬 {scene.no}장에서 {withAndParticle(speaker.name)} 나눈 대화 · 대사 가져오기
                </button>
              )}
            </article>
          )
        })}
      </div>

      {/* 완성 */}
      {ending && (
        <section id="play-finish" className="play-finish">
          <p className="eyebrow">Completed · {progress.total} / {progress.total}</p>
          <h2>당신의 소설이 완성됐습니다</h2>
          <p className="play-finish-ending">
            도달한 엔딩 — <b>{ending.name}</b>
          </p>
          <p className="play-finish-kicker">{ending.kicker}</p>

          <dl className="play-finish-stats">
            <div>
              <dt>내가 고른 분기</dt>
              <dd>{progress.total}번</dd>
            </div>
            <div>
              <dt>소설에 넣은 대사</dt>
              <dd>{activeSession.applied.length}개</dd>
            </div>
            <div>
              <dt>도달한 엔딩</dt>
              <dd>{ending.name}</dd>
            </div>
            <div>
              <dt>마지막 선택의 갈래</dt>
              <dd>{activeSession.picks[flow.scenes.length - 1]?.tone}</dd>
            </div>
          </dl>

          <div className="play-finish-actions">
            <Link to={`/novel/${novel.id}/finale`} className="btn btn-primary">
              내가 완성한 소설 읽기 →
            </Link>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => rewind(flow.scenes.length - 1)}
            >
              마지막 선택 다시 하기
            </button>
            <button type="button" className="btn btn-ghost" onClick={restart}>
              처음부터 새로 쓰기
            </button>
          </div>
          <p className="play-finish-note">
            엔딩은 마지막 장면에서 고른 선택이 정합니다. 마지막 선택 하나를 바꾸면 다른 엔딩이 열리고,
            이 작품에는 엔딩이 {flow.endings.length}개 있습니다.
          </p>
        </section>
      )}

      {/* 선택 기록 */}
      {recordOpen && (
        <>
          <div className="play-record-backdrop" onClick={() => setRecordOpen(false)} aria-hidden />
          <aside className="play-record" role="dialog" aria-label="내 선택 기록">
            <header className="play-record-head">
              <div>
                <p className="eyebrow">My route</p>
                <h2>내 선택 기록</h2>
              </div>
              <button type="button" onClick={() => setRecordOpen(false)} aria-label="닫기">
                ✕
              </button>
            </header>
            <ol className="play-record-list">
              {flow.scenes.map((scene, sceneIndex) => {
                const pick = activeSession.picks[sceneIndex]
                const state = pick ? 'picked' : sceneIndex === done ? 'current' : 'future'
                return (
                  <li key={scene.id} data-state={state}>
                    <button
                      type="button"
                      disabled={state === 'future'}
                      onClick={() => rewind(sceneIndex)}
                    >
                      <span className="play-record-no">{scene.no}장</span>
                      <span className="play-record-body">
                        <span className="play-record-title">{scene.title}</span>
                        <span className="play-record-pick">
                          {pick
                            ? `“${pick.label}”`
                            : state === 'current'
                              ? '지금 고르는 중'
                              : '아직 오지 않은 장면'}
                        </span>
                      </span>
                      {state === 'picked' && <span className="play-record-back">다시 쓰기</span>}
                    </button>
                  </li>
                )
              })}
            </ol>
            <p className="play-record-note">
              장면을 누르면 그 장면부터 다시 씁니다. 그 뒤의 선택과 소설에 넣은 대사는 지워져요.
            </p>
            <div className="play-record-actions">
              <Link to={`/novel/${novel.id}/finale`} className="btn btn-secondary btn-sm">
                지금까지 읽기
              </Link>
              <button type="button" className="btn btn-ghost btn-sm" onClick={restart}>
                처음부터
              </button>
            </div>
          </aside>
        </>
      )}

      {/* 장면 중간 캐릭터 톡 */}
      {chatScene && (
        <SceneChat
          novel={novel}
          scene={chatScene}
          characters={characters}
          picks={activeSession.picks}
          applied={appliedFor(activeSession, chatScene.id) as AppliedLine[]}
          interaction={interactionFor(
            chatScene,
            characters.find((item) => item.id === chatScene.speakerId) ?? characters[0],
          )}
          initialText={chatSeed ?? undefined}
          onApply={applyLines(chatScene.id)}
          onClose={() => {
            setChatSceneId(null)
            setChatSeed(null)
          }}
        />
      )}
    </div>
  )
}
