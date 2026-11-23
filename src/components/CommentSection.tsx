import { useEffect, useState } from 'react'
import { useStore } from '../store/StoreProvider'
import { formatRelative } from '../lib/format'
import { Icon } from './Icon'

interface Props {
  novelId: string
  episodeId: string
}

const NICK_KEY = 'np.nick.v1'

/** 회차별 한 줄 댓글 + 공감 */
export function CommentSection({ novelId, episodeId }: Props) {
  const { comments, addComment, toggleCommentLike, likedCommentIds, notify } = useStore()
  const [nickname, setNickname] = useState('익명 독자')
  const [text, setText] = useState('')

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(NICK_KEY)
      if (saved) setNickname(saved)
    } catch {
      // 무시
    }
  }, [])

  const list = comments
    .filter((comment) => comment.episodeId === episodeId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const submit = async () => {
    const value = text.trim()
    if (!value) {
      notify('한 줄만 적어 주세요')
      return
    }
    try {
      window.localStorage.setItem(NICK_KEY, nickname.trim() || '익명 독자')
    } catch {
      // 무시
    }
    await addComment({ novelId, episodeId, author: nickname, text: value })
    setText('')
    notify('댓글을 남겼어요')
  }

  return (
    <section className="card p-5 sm:p-6 mt-6">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="eyebrow">독자 한마디</p>
          <h2 className="text-[17px] font-extrabold mt-1">한 줄 댓글 {list.length}</h2>
        </div>
        <span className="text-[11px]" style={{ color: 'var(--ink-mute)' }}>
          이 기기에 저장
        </span>
      </div>

      <div className="mt-4 grid gap-2">
        <input
          className="input"
          style={{ maxWidth: 180 }}
          value={nickname}
          maxLength={12}
          onChange={(event) => setNickname(event.target.value)}
          aria-label="닉네임"
          placeholder="닉네임"
        />
        <div className="flex gap-2">
          <input
            className="input"
            value={text}
            maxLength={120}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                void submit()
              }
            }}
            placeholder="이번 화 어땠나요? 한 줄로 남겨 주세요"
            aria-label="한 줄 댓글"
          />
          <button type="button" className="btn btn-primary btn-sm shrink-0" onClick={() => void submit()}>
            등록
          </button>
        </div>
        <div className="flex justify-between text-[11px]" style={{ color: 'var(--ink-mute)' }}>
          <span>욕설·개인정보가 담긴 글은 남기지 말아 주세요.</span>
          <span>{text.length}/120</span>
        </div>
      </div>

      <ul className="mt-4 grid gap-3">
        {list.length === 0 && (
          <li className="text-[12.5px]" style={{ color: 'var(--ink-mute)' }}>
            아직 댓글이 없습니다. 첫 한마디를 남겨 보세요.
          </li>
        )}
        {list.map((comment) => {
          const liked = likedCommentIds.includes(comment.id)
          return (
            <li
              key={comment.id}
              className="rounded-xl px-3.5 py-3"
              style={{ background: 'var(--surface-2)' }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] font-bold">{comment.author}</span>
                <span className="text-[11px]" style={{ color: 'var(--ink-mute)' }}>
                  {formatRelative(comment.createdAt)}
                </span>
              </div>
              <p className="mt-1 text-[13px] leading-relaxed" style={{ wordBreak: 'keep-all' }}>
                {comment.text}
              </p>
              <button
                type="button"
                onClick={() => void toggleCommentLike(comment.id)}
                className="mt-1.5 inline-flex items-center gap-1 text-[11.5px] font-semibold"
                style={{ color: liked ? 'var(--accent)' : 'var(--ink-mute)' }}
                aria-pressed={liked}
              >
                <Icon name={liked ? 'heartFilled' : 'heart'} size={12} /> 공감 {comment.likes}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
