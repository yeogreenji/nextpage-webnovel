import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store/StoreProvider'
import type { EpisodeDraft } from '../store/StoreProvider'

type Mode = 'slot' | 'append' | 'novel'

function defaultDeadline(): string {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000)
  date.setMinutes(0, 0, 0)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const MODES: { value: Mode; label: string; help: string }[] = [
  { value: 'slot', label: '다음 화 슬롯 채우기', help: '독자가 고른 루트에 예약된 빈 회차를 채웁니다.' },
  { value: 'append', label: '새 회차 추가', help: '기존 작품에 새 회차를 덧붙입니다. (첫 화로는 이어지지 않음)' },
  { value: 'novel', label: '새 작품 시작', help: '작품과 1화를 함께 만듭니다.' },
]

export function StudioPage() {
  const { ready, novels, episodes, publishIntoSlot, appendEpisode, createNovel, notify } = useStore()
  const navigate = useNavigate()

  const [mode, setMode] = useState<Mode>('slot')
  const [novelId, setNovelId] = useState('')
  const [slotId, setSlotId] = useState('')

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [choiceA, setChoiceA] = useState('')
  const [hintA, setHintA] = useState('')
  const [choiceB, setChoiceB] = useState('')
  const [hintB, setHintB] = useState('')
  const [deadline, setDeadline] = useState(defaultDeadline)
  const [submitting, setSubmitting] = useState(false)

  const [novelForm, setNovelForm] = useState({
    title: '',
    tagline: '',
    synopsis: '',
    genres: '',
    penName: '',
    glyph: '📖',
  })

  useEffect(() => {
    if (!novelId && novels.length > 0) setNovelId(novels[0].id)
  }, [novelId, novels])

  const slots = useMemo(
    () =>
      episodes
        .filter((episode) => episode.novelId === novelId && episode.status === 'pending')
        .sort((a, b) => a.no - b.no),
    [episodes, novelId],
  )

  useEffect(() => {
    if (slots.length === 0) {
      setSlotId('')
      return
    }
    if (!slots.some((slot) => slot.id === slotId)) {
      setSlotId(slots[0].id)
      setTitle(slots[0].title)
    }
  }, [slots, slotId])

  const selectedNovel = novels.find((novel) => novel.id === novelId)
  const selectedSlot = slots.find((slot) => slot.id === slotId)

  const bodyLength = body.trim().length
  const baseValid =
    title.trim().length >= 2 &&
    bodyLength >= 30 &&
    choiceA.trim().length > 0 &&
    choiceB.trim().length > 0
  const targetValid =
    mode === 'slot'
      ? Boolean(slotId)
      : mode === 'append'
        ? Boolean(novelId)
        : novelForm.title.trim().length >= 2 && novelForm.penName.trim().length >= 1
  const canSubmit = !submitting && baseValid && targetValid

  const submit = async () => {
    if (!canSubmit) {
      notify('제목·본문(30자 이상)·선택지 A/B를 확인해 주세요')
      return
    }
    setSubmitting(true)
    const draft: EpisodeDraft = {
      title,
      body,
      choices: [
        { label: choiceA, hint: hintA },
        { label: choiceB, hint: hintB },
      ],
      voteClosesAt: deadline ? new Date(deadline).toISOString() : null,
    }

    try {
      if (mode === 'slot') {
        const result = await publishIntoSlot(slotId, draft)
        if (result) {
          notify(`${result.no}화를 발행했어요`)
          navigate(`/novel/${result.novelId}/ep/${result.id}`)
        }
      } else if (mode === 'append') {
        const result = await appendEpisode(novelId, draft)
        if (result) {
          notify(`${result.no}화를 새로 발행했어요`)
          navigate(`/novel/${result.novelId}/ep/${result.id}`)
        }
      } else {
        const novel = await createNovel(
          {
            title: novelForm.title,
            tagline: novelForm.tagline,
            synopsis: novelForm.synopsis,
            genres: novelForm.genres
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean),
            penName: novelForm.penName,
            glyph: novelForm.glyph,
          },
          draft,
        )
        if (novel) {
          notify('작품과 1화를 발행했어요')
          navigate(`/novel/${novel.id}`)
        }
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (!ready) {
    return (
      <div className="page-shell py-20 text-center text-[13px]" style={{ color: 'var(--ink-mute)' }}>
        불러오는 중…
      </div>
    )
  }

  return (
    <div className="page-shell pt-8">
      <p className="eyebrow">Writer studio</p>
      <h1 className="text-[24px] font-extrabold mt-1 tracking-tight">작가 스튜디오</h1>
      <p className="mt-2 max-w-[620px] text-[13px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
        회차를 쓰고 A/B 선택지를 붙이면, 발행 즉시 작품 피드와 분기 트리에 반영됩니다. 발행된 회차부터
        독자 투표가 열립니다.
      </p>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_340px] items-start">
        <div className="grid grid-cols-1 gap-4">
          {/* 1. 발행 방식 */}
          <section className="card p-5">
            <p className="field-label">1. 어디에 발행할까요</p>
            <div className="grid grid-cols-1 gap-2">
              {MODES.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setMode(item.value)}
                  className="text-left rounded-xl border px-3.5 py-2.5 transition-colors"
                  style={{
                    borderColor: mode === item.value ? 'var(--accent)' : 'var(--line)',
                    background: mode === item.value ? 'var(--accent-soft)' : 'var(--surface)',
                  }}
                >
                  <span className="block text-[13px] font-bold">{item.label}</span>
                  <span className="block text-[11.5px] mt-0.5" style={{ color: 'var(--ink-mute)' }}>
                    {item.help}
                  </span>
                </button>
              ))}
            </div>

            {mode !== 'novel' && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="field-label" htmlFor="novel-select">
                    작품
                  </label>
                  <select
                    id="novel-select"
                    className="select"
                    value={novelId}
                    onChange={(event) => {
                      setNovelId(event.target.value)
                      setSlotId('')
                      setTitle('')
                      setBody('')
                    }}
                  >
                    {novels.map((novel) => (
                      <option key={novel.id} value={novel.id}>
                        {novel.title} · {novel.penName}
                      </option>
                    ))}
                  </select>
                </div>

                {mode === 'slot' && (
                  <div>
                    <label className="field-label" htmlFor="slot-select">
                      다음 화 슬롯
                    </label>
                    <select
                      id="slot-select"
                      className="select"
                      value={slotId}
                      onChange={(event) => {
                        setSlotId(event.target.value)
                        const slot = slots.find((item) => item.id === event.target.value)
                        if (slot) setTitle(slot.title)
                      }}
                      disabled={slots.length === 0}
                    >
                      {slots.length === 0 && <option value="">예약된 슬롯이 없습니다</option>}
                      {slots.map((slot) => (
                        <option key={slot.id} value={slot.id}>
                          {slot.no}화 · {slot.branchLabel ?? slot.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {mode === 'slot' && selectedSlot && (
              <p className="mt-2 text-[11.5px] leading-relaxed" style={{ color: 'var(--ink-mute)' }}>
                “{selectedSlot.branchLabel}” 루트를 채웁니다. 발행하면 이 회차로 독자들이 바로 이동할 수
                있습니다.
              </p>
            )}
            {mode === 'append' && (
              <p className="mt-2 text-[11.5px]" style={{ color: 'var(--ink-mute)' }}>
                새 회차는 트리 마지막 줄에 따로 표시됩니다. 기존 루트에 붙이려면 ‘다음 화 슬롯 채우기’를
                쓰세요.
              </p>
            )}
          </section>

          {/* 2. 새 작품 정보 */}
          {mode === 'novel' && (
            <section className="card p-5">
              <p className="field-label">2. 작품 정보</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="field-label" htmlFor="n-title">
                    작품명
                  </label>
                  <input
                    id="n-title"
                    className="input"
                    value={novelForm.title}
                    onChange={(event) => setNovelForm({ ...novelForm, title: event.target.value })}
                    placeholder="예: 오늘도 칼퇴는 글렀다"
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="n-pen">
                    필명
                  </label>
                  <input
                    id="n-pen"
                    className="input"
                    value={novelForm.penName}
                    onChange={(event) => setNovelForm({ ...novelForm, penName: event.target.value })}
                    placeholder="필명 (실명 대신)"
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="n-genre">
                    장르 (쉼표로 구분)
                  </label>
                  <input
                    id="n-genre"
                    className="input"
                    value={novelForm.genres}
                    onChange={(event) => setNovelForm({ ...novelForm, genres: event.target.value })}
                    placeholder="오피스 로코, 현대물"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="field-label" htmlFor="n-tagline">
                    한 줄 소개
                  </label>
                  <input
                    id="n-tagline"
                    className="input"
                    value={novelForm.tagline}
                    onChange={(event) => setNovelForm({ ...novelForm, tagline: event.target.value })}
                    placeholder="카드에 보이는 짧은 문장"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="field-label" htmlFor="n-synopsis">
                    시놉시스
                  </label>
                  <textarea
                    id="n-synopsis"
                    className="textarea"
                    style={{ minHeight: 88 }}
                    value={novelForm.synopsis}
                    onChange={(event) => setNovelForm({ ...novelForm, synopsis: event.target.value })}
                    placeholder="세 문장 정도면 충분합니다."
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="n-glyph">
                    표지 글리프
                  </label>
                  <input
                    id="n-glyph"
                    className="input"
                    value={novelForm.glyph}
                    maxLength={4}
                    onChange={(event) => setNovelForm({ ...novelForm, glyph: event.target.value })}
                  />
                </div>
              </div>
            </section>
          )}

          {/* 3. 회차 */}
          <section className="card p-5">
            <p className="field-label">{mode === 'novel' ? '3' : '2'}. 회차 내용</p>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="field-label" htmlFor="ep-title">
                  회차 제목
                </label>
                <input
                  id="ep-title"
                  className="input"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="예: 흑당라떼는 반씩 나눠 마시는 것"
                />
              </div>
              <div>
                <div className="flex items-baseline justify-between">
                  <label className="field-label" htmlFor="ep-body">
                    본문
                  </label>
                  <span className="text-[11px]" style={{ color: 'var(--ink-mute)' }}>
                    {bodyLength.toLocaleString('ko-KR')}자 · 빈 줄로 문단 구분
                  </span>
                </div>
                <textarea
                  id="ep-body"
                  className="textarea"
                  style={{ minHeight: 240 }}
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder={'첫 문단을 씁니다.\n\n빈 줄을 넣으면 새 문단이 됩니다.'}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {(
                  [
                    { key: 'A', label: choiceA, hint: hintA, setLabel: setChoiceA, setHint: setHintA },
                    { key: 'B', label: choiceB, hint: hintB, setLabel: setChoiceB, setHint: setHintB },
                  ] as const
                ).map((item) => (
                  <div key={item.key} className="rounded-xl p-3" style={{ background: 'var(--surface-2)' }}>
                    <p className="field-label" style={{ marginBottom: 6 }}>
                      선택지 {item.key}
                    </p>
                    <input
                      className="input"
                      value={item.label}
                      onChange={(event) => item.setLabel(event.target.value)}
                      placeholder={item.key === 'A' ? '예: 먼저 사과하고 자료를 고친다' : '예: 그대로 들어간다'}
                      aria-label={`선택지 ${item.key} 문구`}
                    />
                    <input
                      className="input mt-2"
                      value={item.hint}
                      onChange={(event) => item.setHint(event.target.value)}
                      placeholder="짧은 부연 (선택)"
                      aria-label={`선택지 ${item.key} 부연`}
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="field-label" htmlFor="ep-deadline">
                  투표 마감
                </label>
                <input
                  id="ep-deadline"
                  type="datetime-local"
                  className="input"
                  value={deadline}
                  onChange={(event) => setDeadline(event.target.value)}
                />
                <p className="mt-1 text-[11px]" style={{ color: 'var(--ink-mute)' }}>
                  마감 뒤에는 결과만 공개됩니다. 비워 두면 마감 없이 계속 투표할 수 있습니다.
                </p>
              </div>
            </div>
          </section>

          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="btn btn-primary" onClick={() => void submit()} disabled={!canSubmit}>
              {submitting ? '발행 중…' : '발행하기'}
            </button>
            <Link to={selectedNovel ? `/novel/${selectedNovel.id}` : '/library'} className="btn btn-ghost">
              취소
            </Link>
            <span className="text-[11.5px]" style={{ color: 'var(--ink-mute)' }}>
              발행한 내용은 이 기기에 저장됩니다.
            </span>
          </div>
        </div>

        {/* 미리보기 */}
        <aside className="card p-5 lg:sticky lg:top-20">
          <p className="eyebrow">Preview</p>
          <h2 className="text-[15px] font-extrabold mt-1">
            {title.trim() || '회차 제목이 여기에 보입니다'}
          </h2>
          <p className="mt-1 text-[11.5px]" style={{ color: 'var(--ink-mute)' }}>
            {mode === 'novel'
              ? novelForm.title.trim() || '새 작품'
              : selectedNovel
                ? `${selectedNovel.title} · ${selectedNovel.penName}`
                : '작품을 선택하세요'}
          </p>

          <div className="mt-3 rounded-xl p-3" style={{ background: 'var(--surface-2)' }}>
            <p
              className="text-[12.5px] leading-relaxed line-clamp-[10]"
              style={{ color: 'var(--ink-soft)', whiteSpace: 'pre-wrap', wordBreak: 'keep-all' }}
            >
              {body.trim() || '본문을 쓰면 여기에서 읽기 화면을 미리 볼 수 있습니다.'}
            </p>
          </div>

          <div className="mt-3 grid gap-2">
            {[choiceA, choiceB].map((choice, index) => (
              <div
                key={index}
                className="rounded-lg border px-3 py-2 text-[12px]"
                style={{ borderColor: 'var(--line)' }}
              >
                <span className="font-extrabold mr-1.5" style={{ color: 'var(--accent)' }}>
                  {String.fromCharCode(65 + index)}
                </span>
                {choice.trim() || '선택지 문구'}
              </div>
            ))}
          </div>

          <p className="mt-3 text-[11px] leading-relaxed" style={{ color: 'var(--ink-mute)' }}>
            발행 즉시 작품 피드 · 분기 트리에 반영되고, 회차 끝에 투표 카드가 열립니다.
          </p>
        </aside>
      </div>
    </div>
  )
}
