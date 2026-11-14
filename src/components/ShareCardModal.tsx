import { useEffect, useState } from 'react'
import type { ResultCardInput } from '../lib/share-card'
import {
  copyBlobToClipboard,
  copyText,
  downloadBlob,
  renderResultCard,
} from '../lib/share-card'

interface Props {
  open: boolean
  onClose: () => void
  input: ResultCardInput
  shareUrl: string
  onNotice: (message: string) => void
}

/** 투표 결과를 인스타그램 스토리 규격(1080×1920) 이미지로 만들어 저장·복사합니다. */
export function ShareCardModal({ open, onClose, input, shareUrl, onNotice }: Props) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [blob, setBlob] = useState<Blob | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    let alive = true
    let objectUrl: string | null = null
    setBusy(true)
    renderResultCard(input)
      .then((result) => {
        if (!alive) return
        objectUrl = URL.createObjectURL(result)
        setBlob(result)
        setImageUrl(objectUrl)
      })
      .catch(() => onNotice('결과 카드를 만들지 못했습니다'))
      .finally(() => {
        if (alive) setBusy(false)
      })
    return () => {
      alive = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      setImageUrl(null)
      setBlob(null)
    }
  }, [open, input, onNotice])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open) return null

  const filename = `nextpage-${input.percent}pct.png`

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="투표 결과 카드" onClick={onClose}>
      <div
        className="card w-full max-w-[360px] max-h-[92dvh] overflow-y-auto p-4"
        onClick={(event) => event.stopPropagation()}
        style={{ background: 'var(--surface)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="eyebrow">공유 카드</p>
            <p className="text-[14px] font-extrabold">스토리에 올릴 준비 완료</p>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>

        <div
          className="rounded-2xl overflow-hidden flex items-center justify-center"
          style={{ background: 'var(--surface-2)', aspectRatio: '9 / 16' }}
        >
          {imageUrl ? (
            <img src={imageUrl} alt="투표 결과 공유 카드 미리보기" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[12px]" style={{ color: 'var(--ink-mute)' }}>
              {busy ? '카드를 만드는 중…' : '카드를 만들 수 없습니다'}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={!blob}
            onClick={() => {
              if (!blob) return
              downloadBlob(blob, filename)
              onNotice('이미지를 저장했어요')
            }}
          >
            이미지 저장
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={!blob}
            onClick={async () => {
              if (!blob) return
              const ok = await copyBlobToClipboard(blob)
              onNotice(ok ? '이미지를 복사했어요. 붙여넣기만 하면 됩니다' : '이 브라우저는 이미지 복사를 지원하지 않아요')
            }}
          >
            이미지 복사
          </button>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm w-full mt-2"
          onClick={async () => {
            const ok = await copyText(shareUrl)
            onNotice(ok ? '링크를 복사했어요' : '링크를 복사하지 못했어요')
          }}
        >
          회차 링크 복사
        </button>
        <p className="mt-3 text-[11px] leading-relaxed" style={{ color: 'var(--ink-mute)' }}>
          이미지 저장이 안 되는 브라우저에서는 카드를 길게 눌러 저장해 보세요.
        </p>
      </div>
    </div>
  )
}
