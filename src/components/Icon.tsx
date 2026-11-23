import type { ReactElement, SVGProps } from 'react'

/**
 * 넥스트페이지 아이콘 — 이모지 대신 쓰는 선 아이콘.
 * 모두 currentColor 를 따르므로 글자색만 바꾸면 됩니다. (stroke 1.6px, 24 그리드)
 */
export type IconName =
  | 'book'
  | 'bookOpen'
  | 'sparkle'
  | 'clock'
  | 'palette'
  | 'chat'
  | 'heart'
  | 'heartFilled'
  | 'coin'
  | 'ticket'
  | 'pass'
  | 'lock'
  | 'arrowRight'
  | 'search'
  | 'chevronLeft'
  | 'chevronRight'
  | 'check'
  | 'close'
  | 'settings'
  | 'trendUp'
  | 'gift'
  | 'user'

const PATHS: Record<IconName, ReactElement> = {
  book: (
    <>
      <path d="M5 4.5h9.5a2.5 2.5 0 0 1 2.5 2.5v12.5H7.5A2.5 2.5 0 0 0 5 22z" />
      <path d="M5 19.5V4.5" />
    </>
  ),
  bookOpen: (
    <>
      <path d="M12 6.5C10.4 5.2 8.3 4.5 5.5 4.5H4v13h2c2.6 0 4.7.7 6 2 1.3-1.3 3.4-2 6-2h2v-13h-1.5c-2.8 0-4.9.7-6.5 2z" />
      <path d="M12 6.5v13" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3.5l1.7 4.6 4.6 1.7-4.6 1.7L12 16.1l-1.7-4.6L5.7 9.8l4.6-1.7z" />
      <path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </>
  ),
  palette: (
    <>
      <path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.2 0 1.9-.9 1.9-1.9 0-1.4 1.1-2.1 2.4-2.1h1.2A2.5 2.5 0 0 0 20 14a10.5 10.5 0 0 0-8-10.5z" />
      <circle cx="8.4" cy="10.2" r="1" />
      <circle cx="12" cy="7.9" r="1" />
      <circle cx="15.6" cy="10.2" r="1" />
    </>
  ),
  chat: (
    <>
      <path d="M20 12.5c0 3.9-3.6 7-8 7-1 0-2-.2-2.9-.5L5 20.5l1.3-3.4A6.6 6.6 0 0 1 4 12.5c0-3.9 3.6-7 8-7s8 3.1 8 7z" />
      <path d="M8.5 12.5h.01M12 12.5h.01M15.5 12.5h.01" />
    </>
  ),
  heart: <path d="M12 20s-7.5-4.4-7.5-9.3A4.2 4.2 0 0 1 12 8a4.2 4.2 0 0 1 7.5 2.7C19.5 15.6 12 20 12 20z" />,
  heartFilled: (
    <path
      d="M12 20s-7.5-4.4-7.5-9.3A4.2 4.2 0 0 1 12 8a4.2 4.2 0 0 1 7.5 2.7C19.5 15.6 12 20 12 20z"
      fill="currentColor"
      stroke="none"
    />
  ),
  coin: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.5 9.2l2.5 3 2.5-3M12 12.2v4.3M10 13.6h4M10 15.4h4" />
    </>
  ),
  ticket: (
    <>
      <path d="M3.5 9.2V6.8h17v2.4a2.8 2.8 0 0 0 0 5.6v2.4h-17v-2.4a2.8 2.8 0 0 0 0-5.6z" />
      <path d="M9.5 6.8v10.4" strokeDasharray="2 2.4" />
    </>
  ),
  pass: (
    <>
      <rect x="3.2" y="5.5" width="17.6" height="13" rx="2.4" />
      <path d="M3.2 10h17.6M7 14.4h4" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2.2" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </>
  ),
  arrowRight: <path d="M4.5 12h14.5M13.5 6.5l5.5 5.5-5.5 5.5" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4 4" />
    </>
  ),
  chevronLeft: <path d="M14.5 6l-6 6 6 6" />,
  chevronRight: <path d="M9.5 6l6 6-6 6" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="2.8" />
      <path d="M12 3.5v2.2M12 18.3v2.2M4.9 7.9l1.9 1.1M17.2 15l1.9 1.1M4.9 16.1l1.9-1.1M17.2 9l1.9-1.1" />
    </>
  ),
  trendUp: (
    <>
      <path d="M4 16.5l5.5-5.5 3.5 3.5 6-6.5" />
      <path d="M14.5 8h5v5" />
    </>
  ),
  gift: (
    <>
      <path d="M4.5 9.5h15v10h-15z" />
      <path d="M3.5 9.5h17M12 9.5v10" />
      <path d="M12 9.5C10.5 6 8.8 5.2 7.6 6.2 6.2 7.4 7.6 9.5 12 9.5zM12 9.5c1.5-3.5 3.2-4.3 4.4-3.3 1.4 1.2 0 3.3-4.4 3.3z" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.6" />
      <path d="M4.8 20c.8-3.4 3.7-5.4 7.2-5.4s6.4 2 7.2 5.4" />
    </>
  ),
}

interface Props extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName
  size?: number
}

export function Icon({ name, size = 18, strokeWidth = 1.6, ...rest }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  )
}
