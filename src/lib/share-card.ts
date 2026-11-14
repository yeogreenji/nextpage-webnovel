/** 투표 결과를 SNS 공유용 이미지(1080×1920 스토리 규격)로 그립니다. */

export interface ResultCardInput {
  novelTitle: string
  episodeTitle: string
  penName: string
  choiceLabel: string
  percent: number
  isMajority: boolean
  totalVoters: number
  /** 표지 일러스트 URL (같은 출처) */
  coverImage?: string
  /** 선택지 장면 일러스트 URL (같은 출처) */
  sceneImage?: string
}

const WIDTH = 1080
const HEIGHT = 1920
const IMAGE_H = 1120
const PAD = 96

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

function loadImage(src?: string): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null)
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = src
  })
}

/** 이미지를 잘라서(cover) 지정 영역을 가득 채웁니다. */
function drawCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const ratio = Math.max(width / image.width, height / image.height)
  const drawWidth = image.width * ratio
  const drawHeight = image.height * ratio
  ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight)
}

export async function renderResultCard(input: ResultCardInput): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas context unavailable')

  const family = '"Pretendard", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif'

  // 배경
  const background = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT)
  background.addColorStop(0, '#1d1620')
  background.addColorStop(0.55, '#2a1c25')
  background.addColorStop(1, '#140f16')
  ctx.fillStyle = background
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  const [scene, cover] = await Promise.all([loadImage(input.sceneImage), loadImage(input.coverImage)])

  // 선택지 장면 아트워크
  if (scene) {
    ctx.save()
    drawCover(ctx, scene, 0, 0, WIDTH, IMAGE_H)
    const fade = ctx.createLinearGradient(0, IMAGE_H * 0.34, 0, IMAGE_H + 160)
    fade.addColorStop(0, 'rgba(23, 17, 22, 0)')
    fade.addColorStop(0.5, 'rgba(23, 17, 22, 0.7)')
    fade.addColorStop(0.82, 'rgba(23, 17, 22, 0.97)')
    fade.addColorStop(1, 'rgba(23, 17, 22, 1)')
    ctx.fillStyle = fade
    ctx.fillRect(0, IMAGE_H * 0.34, WIDTH, HEIGHT - IMAGE_H * 0.34)
    const sideFade = ctx.createLinearGradient(0, 0, WIDTH, 0)
    sideFade.addColorStop(0, 'rgba(20, 14, 18, 0.5)')
    sideFade.addColorStop(0.5, 'rgba(20, 14, 18, 0)')
    sideFade.addColorStop(1, 'rgba(20, 14, 18, 0.5)')
    ctx.fillStyle = sideFade
    ctx.fillRect(0, 0, WIDTH, IMAGE_H)
    ctx.restore()
  } else {
    const glow = ctx.createRadialGradient(820, 380, 60, 820, 380, 620)
    glow.addColorStop(0, 'rgba(247, 183, 163, 0.30)')
    glow.addColorStop(1, 'rgba(247, 183, 163, 0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, WIDTH, HEIGHT)
  }

  const ink = '#fffaf7'

  // 상단 가독성을 위한 스크림
  const topScrim = ctx.createLinearGradient(0, 0, 0, 340)
  topScrim.addColorStop(0, 'rgba(14, 10, 13, 0.82)')
  topScrim.addColorStop(1, 'rgba(14, 10, 13, 0)')
  ctx.fillStyle = topScrim
  ctx.fillRect(0, 0, WIDTH, 340)

  // 상단 브랜드
  ctx.textBaseline = 'top'
  ctx.fillStyle = 'rgba(255,255,255,0.88)'
  ctx.font = `700 28px ${family}`
  ctx.letterSpacing = '10px'
  ctx.fillText('NEXT PAGE', PAD, 96)
  ctx.letterSpacing = '0px'
  ctx.fillStyle = 'rgba(255,255,255,0.62)'
  ctx.font = `400 24px ${family}`
  ctx.fillText('선택형 웹소설 · 독자 투표 결과', PAD, 146)

  // 표지 썸네일 (우상단)
  if (cover) {
    const cw = 132
    const ch = 198
    const cx = WIDTH - PAD - cw
    const cy = 92
    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.55)'
    ctx.shadowBlur = 30
    ctx.shadowOffsetY = 14
    roundedRect(ctx, cx, cy, cw, ch, 10)
    ctx.fillStyle = '#1b1418'
    ctx.fill()
    ctx.restore()
    ctx.save()
    roundedRect(ctx, cx, cy, cw, ch, 10)
    ctx.clip()
    drawCover(ctx, cover, cx, cy, cw, ch)
    ctx.restore()
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'
    ctx.lineWidth = 2
    roundedRect(ctx, cx, cy, cw, ch, 10)
    ctx.stroke()
  }

  // 작품명
  ctx.fillStyle = ink
  ctx.font = `800 56px ${family}`
  const titleLines = wrapText(ctx, input.novelTitle, WIDTH - PAD * 2, 2)
  let y = 1160
  for (const line of titleLines) {
    ctx.fillText(line, PAD, y)
    y += 70
  }

  // 회차 + 필명
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.font = `400 28px ${family}`
  ctx.fillText(`${input.episodeTitle} · ${input.penName}`, PAD, y + 4)
  y += 74

  // 선택지 인용
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.font = `600 34px ${family}`
  const choiceLines = wrapText(ctx, `“${input.choiceLabel}”`, WIDTH - PAD * 2, 2)
  for (const line of choiceLines) {
    ctx.fillText(line, PAD, y)
    y += 48
  }

  // 퍼센트
  ctx.fillStyle = ink
  ctx.font = `800 180px ${family}`
  ctx.fillText(`${input.percent}%`, PAD - 8, 1420)

  // 다수파 / 소수파 배지
  const badgeText = input.isMajority ? '다수파' : '소수파'
  const badgeColor = input.isMajority ? 'rgba(247, 183, 163, 0.95)' : 'rgba(168, 184, 240, 0.95)'
  ctx.font = `700 32px ${family}`
  const badgeWidth = ctx.measureText(badgeText).width + 64
  ctx.fillStyle = badgeColor
  roundedRect(ctx, PAD, 1652, badgeWidth, 66, 33)
  ctx.fill()
  ctx.fillStyle = '#241a2b'
  ctx.fillText(badgeText, PAD + 32, 1670)

  // 안내 문장
  ctx.fillStyle = 'rgba(255,255,255,0.66)'
  ctx.font = `400 30px ${family}`
  ctx.fillText(
    input.isMajority ? '나와 같은 선택을 한 독자가 더 많습니다' : '나만의 선택, 이야기를 다른 쪽으로 밀었습니다',
    PAD,
    1756,
  )

  ctx.strokeStyle = 'rgba(255,255,255,0.16)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(PAD, 1800)
  ctx.lineTo(WIDTH - PAD, 1800)
  ctx.stroke()

  ctx.fillStyle = 'rgba(255,255,255,0.82)'
  ctx.font = `600 28px ${family}`
  ctx.fillText(`총 ${input.totalVoters.toLocaleString('ko-KR')}명 참여`, PAD, 1828)

  ctx.fillStyle = 'rgba(255,255,255,0.45)'
  ctx.font = `400 26px ${family}`
  ctx.textAlign = 'right'
  ctx.fillText('다음 화는, 당신이 고른다', WIDTH - PAD, 1832)
  ctx.textAlign = 'left'

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
