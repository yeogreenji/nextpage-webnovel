/** 투표 결과를 SNS 공유용 이미지(1080×1920 스토리 규격)로 그립니다. */

export interface ResultCardInput {
  novelTitle: string
  episodeTitle: string
  penName: string
  choiceLabel: string
  percent: number
  isMajority: boolean
  totalVoters: number
}

const WIDTH = 1080
const HEIGHT = 1920

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + width, y, x + width, y + height, radius)
  ctx.arcTo(x + width, y + height, x, y + height, radius)
  ctx.arcTo(x, y + height, x, y, radius)
  ctx.arcTo(x, y, x + width, y, radius)
  ctx.closePath()
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate
      continue
    }
    if (current) lines.push(current)
    current = word
    if (lines.length === maxLines) break
  }
  if (current && lines.length < maxLines) lines.push(current)

  if (lines.length === maxLines) {
    const last = lines[maxLines - 1]
    if (ctx.measureText(last).width > maxWidth - 40) {
      lines[maxLines - 1] = `${last.slice(0, Math.max(0, last.length - 2))}…`
    }
  }
  return lines
}

export async function renderResultCard(input: ResultCardInput): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas context unavailable')

  // 배경
  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT)
  gradient.addColorStop(0, '#241a2b')
  gradient.addColorStop(0.55, '#3b2437')
  gradient.addColorStop(1, '#1a1620')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  // 은은한 원
  const glow = ctx.createRadialGradient(820, 380, 60, 820, 380, 620)
  glow.addColorStop(0, 'rgba(247, 183, 163, 0.30)')
  glow.addColorStop(1, 'rgba(247, 183, 163, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  const glow2 = ctx.createRadialGradient(180, 1500, 40, 180, 1500, 520)
  glow2.addColorStop(0, 'rgba(168, 184, 240, 0.22)')
  glow2.addColorStop(1, 'rgba(168, 184, 240, 0)')
  ctx.fillStyle = glow2
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  const family = '"Pretendard", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif'
  const padding = 96

  // 상단 브랜드
  ctx.textBaseline = 'top'
  ctx.fillStyle = 'rgba(255,255,255,0.62)'
  ctx.font = `600 30px ${family}`
  ctx.letterSpacing = '10px'
  ctx.fillText('NEXT PAGE', padding, 132)
  ctx.letterSpacing = '0px'
  ctx.fillStyle = 'rgba(255,255,255,0.38)'
  ctx.font = `400 26px ${family}`
  ctx.fillText('선택형 웹소설 · 독자 투표 결과', padding, 190)

  // 작품명
  ctx.fillStyle = '#ffffff'
  ctx.font = `800 74px ${family}`
  const titleLines = wrapText(ctx, input.novelTitle, WIDTH - padding * 2, 3)
  let y = 400
  for (const line of titleLines) {
    ctx.fillText(line, padding, y)
    y += 94
  }

  // 회차 + 필명
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.font = `400 34px ${family}`
  y += 10
  ctx.fillText(`${input.episodeTitle} · ${input.penName}`, padding, y)

  // 선택지
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.font = `600 44px ${family}`
  const choiceLines = wrapText(ctx, `“${input.choiceLabel}”`, WIDTH - padding * 2, 2)
  y += 110
  for (const line of choiceLines) {
    ctx.fillText(line, padding, y)
    y += 62
  }

  // 퍼센트
  ctx.fillStyle = '#ffffff'
  ctx.font = `800 236px ${family}`
  ctx.fillText(`${input.percent}%`, padding - 8, 1080)

  // 다수파/소수파 배지
  const badgeText = input.isMajority ? '다수파' : '소수파'
  const badgeColor = input.isMajority ? 'rgba(247, 183, 163, 0.92)' : 'rgba(168, 184, 240, 0.92)'
  ctx.font = `700 40px ${family}`
  const badgeWidth = ctx.measureText(badgeText).width + 76
  ctx.fillStyle = badgeColor
  roundedRect(ctx, padding, 1352, badgeWidth, 82, 41)
  ctx.fill()
  ctx.fillStyle = '#241a2b'
  ctx.fillText(badgeText, padding + 38, 1374)

  // 안내 문장
  ctx.fillStyle = 'rgba(255,255,255,0.66)'
  ctx.font = `400 34px ${family}`
  ctx.fillText(
    input.isMajority
      ? '나와 같은 선택을 한 독자가 더 많습니다'
      : '나만의 선택, 이야기를 다른 쪽으로 밀었습니다',
    padding,
    1480,
  )

  // 구분선
  ctx.strokeStyle = 'rgba(255,255,255,0.16)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(padding, 1600)
  ctx.lineTo(WIDTH - padding, 1600)
  ctx.stroke()

  // 참여 수
  ctx.fillStyle = 'rgba(255,255,255,0.8)'
  ctx.font = `600 38px ${family}`
  ctx.fillText(`총 ${input.totalVoters.toLocaleString('ko-KR')}명 참여`, padding, 1652)

  ctx.fillStyle = 'rgba(255,255,255,0.42)'
  ctx.font = `400 30px ${family}`
  ctx.fillText('다음 화는, 당신이 고른다', padding, 1740)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('이미지를 만들 수 없습니다'))
    }, 'image/png')
  })
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 4000)
}

export async function copyBlobToClipboard(blob: Blob): Promise<boolean> {
  try {
    if (!navigator.clipboard || typeof ClipboardItem === 'undefined') return false
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    return true
  } catch {
    return false
  }
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
