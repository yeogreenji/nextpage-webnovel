import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Novel, PlaySession, SerialChapter, SerialState, StoryFlow } from '../types'
import { useStore } from '../store/StoreProvider'
import {
  appendChapter,
  blueprintFor,
  buildContinueBrief,
  chapterFromDraft,
  clearSerial,
  emptySerial,
  loadSerial,
  localChapter,
  memorySummary,
  nextSerialNo,
  pickSerial,
  requestSerialChapter,
  saveSerial,
  serialTotal,
} from '../lib/serial'

interface Props {
  novel: Novel
  flow: StoryFlow
  session: PlaySession | null
}

/**
 * ✍️ 장편 이어쓰기 — 정적 아크(20화 이상)가 끝난 뒤 100화까지 계속 씁니다.
 * - 내 선택과 캐릭터 톡에서 소설에 넣은 대사를 누적 기억합니다.
 * - /api/continue (Gemini) 로 다음 화를 쓰고, 실패하면 기기 안 집필로 이어 갑니다.
 * - 쓴 화는 이 기기에 저장되어 새로고침해도 남습니다.
 */
export function SerialWriter({ novel, flow, session }: Props) {
  const { notify } = useStore()
  const base = flow.scenes.length
  const [state, setState] = useState<SerialState>(() => emptySerial(novel.id, base))
  const [loaded, setLoaded] = useState(false)
  const [writing, setWriting] = useState(false)
  const [progressNote, setProgressNote] = useState<string | null>(null)

  useEffect(() => {
    const stored = loadSerial(novel.id)
    setState(stored ?? emptySerial(novel.id, base))
    setLoaded(true)
  }, [base, novel.id])

  const blueprint = useMemo(() => blueprintFor(flow, novel), [flow, novel])
  const total = serialTotal(state)
  const nextNo = nextSerialNo(state)
  const target = blueprint.target
  const brief = useMemo(
    () => buildContinueBrief({ novel, flow, session, state }),
    [novel, flow, session, state],
  )
  const memory = memorySummary(brief)
  const lastChapter = state.chapters[state.chapters.length - 1] ?? null

  const write = useCallback(
    async (count: number) => {
      if (writing) return
      setWriting(true)
      setProgressNote(null)
      let current = loadSerial(novel.id) ?? state
      let written = 0
      try {
        for (let index = 0; index < count; index += 1) {
          if (serialTotal(current) >= target) break
          const nextBrief = buildContinueBrief({ novel, flow, session, state: current })
          const result = await requestSerialChapter(nextBrief)
          const draft = result.draft ?? localChapter(nextBrief)
          const source: SerialChapter['source'] = result.draft ? 'ai' : 'local'
          const isLast = index === count - 1 || serialTotal(current) + 1 >= target
          const autoPick =
            draft.choices.find((choice) => choice.tone === nextBrief.dominantTone) ?? draft.choices[0]
          const chapter = chapterFromDraft(
            nextBrief.nextNo,
            draft,
            [
              ...nextBrief.recent.map((item) => `${item.no}화 ${item.title}`),
              ...(nextBrief.memory.dialogues.length > 0
                ? [`소설에 넣은 대사 ${nextBrief.memory.dialogues.length}줄`]
                : []),
            ],
            source,
            isLast ? null : { label: autoPick.label, tone: autoPick.tone },
          )
          current = saveSerial(appendChapter(current, chapter))
          setState(current)
          written += 1
          setProgressNote(`${chapter.no}화를 썼습니다 · ${serialTotal(current)}/${target}화`)
        }
        notify(written > 0 ? `${written}화를 이어 썼어요 (${serialTotal(current)}/${target}화)` : '이미 목표 화수까지 썼어요')
      } catch {
        notify('다음 화를 쓰지 못했어요. 잠시 뒤 다시 시도해 주세요')
      } finally {
        setWriting(false)
      }
    },
    [flow, novel, notify, session, state, target, writing],
  )

  const reset = useCallback(() => {
    clearSerial(novel.id)
    setState(emptySerial(novel.id, base))
    setProgressNote(null)
    notify('이어쓴 화를 지웠어요')
  }, [base, novel.id, notify])

  const choose = useCallback(
    (chapter: SerialChapter, label: string, tone: SerialChapter['choices'][number]['tone']) => {
      const next = saveSerial(pickSerial(state, chapter.no, { label, tone }))
      setState(next)
      notify('이 화의 갈래를 골랐어요. 다음 화에 반영됩니다')
    },
    [notify, state],
  )

  const remainingTo = (goal: number) => Math.max(0, goal - total)

  return (
    <section id="serial" className="serial-writer">
      <header className="serial-head">
        <div>
          <p className="eyebrow">Long-form · {target}화까지</p>
          <h2>장편 이어쓰기</h2>
          <p className="serial-sub">
            {base}화에서 끝나지 않습니다. 내 선택과 그 화의 인물들과 나눈 대화를
            누적 기억해, 다음 화를 계속 씁니다. 100화까지 이어서 한 편의 장편으로 저장됩니다.
          </p>
        </div>
        <div className="serial-count" aria-label={`${total}화 / ${target}화`}>
          <b>{total}</b>
          <span>/ {target}화</span>
        </div>
      </header>

      <div className="serial-progress" aria-hidden>
        <span style={{ width: `${Math.min(100, Math.round((total / target) * 100))}%` }} />
      </div>

      <div className="serial-memory">
        <span className="serial-memory-label">기억한 것</span>
        {memory.length > 0 ? (
          memory.map((item) => <span key={item} className="serial-memory-chip">{item}</span>)
        ) : (
          <span className="serial-memory-chip">아직 없음 — 화를 고르고 말을 걸면 여기에 쌓입니다</span>
        )}
        {brief.memory.dialogues.slice(-1).map((line) => (
          <span key={line} className="serial-memory-chip" title={line}>
            “{line.length > 26 ? line.slice(0, 26) + "…" : line}”
          </span>
        ))}
        {lastChapter?.picked && (
          <span className="serial-memory-chip">직전 갈래 · {lastChapter.picked.label}</span>
        )}
      </div>

      {state.chapters.length > 0 && (
        <div className="serial-chapters">
          {state.chapters.map((chapter) => {
            const isLast = chapter.no === lastChapter?.no
            return (
              <article key={chapter.no} className="serial-chapter" data-state={isLast ? 'current' : 'done'}>
                <header className="serial-chapter-head">
                  <span className="serial-chapter-no">{chapter.no}화</span>
                  <div className="min-w-0">
                    <h3>{chapter.title}</h3>
                    <p>{chapter.place}</p>
                  </div>
                  <span className="serial-source" data-source={chapter.source}>
                    {chapter.source === 'ai' ? 'AI 집필' : '기기 안 집필'}
                  </span>
                </header>
                <div className="serial-body reader-body">
                  {chapter.body.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
                {chapter.picked ? (
                  <p className="serial-picked">
                    내 선택 · “{chapter.picked.label}”
                  </p>
                ) : (
                  <div className="serial-choices">
                    <p className="serial-choices-label">이 화에서, 나는 —</p>
                    <div className="serial-choice-grid">
                      {chapter.choices.map((choice, index) => (
                        <button
                          key={choice.label}
                          type="button"
                          className="serial-choice"
                          data-tone={choice.tone}
                          onClick={() => choose(chapter, choice.label, choice.tone)}
                        >
                          <span>{String.fromCharCode(65 + index)}</span>
                          {choice.label}
                          {choice.hint && <em>{choice.hint}</em>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {chapter.teaser && <p className="serial-teaser">다음 화 예고 — {chapter.teaser}</p>}
              </article>
            )
          })}
        </div>
      )}

      {loaded && (
        <div className="serial-tools">
          <p className="serial-next">
            {total >= target ? (
              <b>{target}화까지 완성했습니다. 한 편의 장편이 되었어요.</b>
            ) : (
              <>
               다음은 <b>{nextNo}화</b> — 내 선택과 대화를 이어받아 씁니다.
              </>
            )}
          </p>
          <div className="serial-actions">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={writing || total >= target}
              onClick={() => void write(1)}
            >
              {writing ? '쓰는 중…' : `${nextNo}화 쓰기`}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={writing || total >= target}
              onClick={() => void write(5)}
            >
              5화 더
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={writing || total >= target || remainingTo(Math.min(50, target)) === 0}
              onClick={() => void write(remainingTo(Math.min(50, target)))}
            >
              {Math.min(50, target)}화까지
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={writing || total >= target}
              onClick={() => void write(remainingTo(target))}
            >
              {target}화까지 한 번에
            </button>
            {state.chapters.length > 0 && (
              <button type="button" className="btn btn-ghost btn-sm" disabled={writing} onClick={reset}>
                이어쓴 화 지우기
              </button>
            )}
          </div>
          <p className="serial-note" role="status">
            {progressNote ??
              (writing
                ? '다음 화를 쓰는 중입니다…'
                : 'AI가 연결되면 서버가 쓰고, 연결되지 않으면 기기 안에서 초안을 씁니다. 쓴 화는 이 기기에 저장됩니다.')}
          </p>
        </div>
      )}
    </section>
  )
}
