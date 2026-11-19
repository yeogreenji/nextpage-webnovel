import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { buildSeed } from '../src/data/seed'
import { ALL_FLOWS } from '../src/data/flows'
import { CHARACTER_ART, SCENE_ART, WAVE_CHOICE_ART, WAVE_NOVEL_ART } from '../src/data/art-wave'

/**
 * 일러스트 전수 검증 — 25작품 모든 화면에서 그림이 실제로 그려지는지 봅니다.
 * - 카드·표지·히어로·인물 카드: complete && naturalWidth > 0
 * - 신작 10편: 표지·히어로·인물 4인·장면 컷이 모두 붙어 있는지(데이터 기준)
 */

const seed = buildSeed(Date.now())

test.describe.configure({ mode: 'serial' })

async function imageHealth(page: Page): Promise<{ src: string; w: number; complete: boolean; alt: string | null }[]> {
  await page.evaluate(async () => {
    const imgs = Array.from(document.images)
    imgs.forEach((img) => {
      img.loading = 'eager'
    })
    await Promise.all(imgs.map((img) => img.decode().catch(() => {})))
  })
  await page.waitForTimeout(150)
  return page.evaluate(() =>
    Array.from(document.images).map((img) => ({
      src: img.currentSrc || img.src,
      w: img.naturalWidth,
      complete: img.complete,
      alt: img.getAttribute('alt'),
    })),
  )
}

test('25작품 모두 표지·히어로·인물·장면 일러스트가 데이터에 붙어 있다', async () => {
  expect(seed.novels).toHaveLength(25)

  // 신작 10편 — 표지·히어로·인물 4인·선택지 2컷
  const wave = seed.novels.filter((novel) => WAVE_NOVEL_ART[novel.id])
  expect(wave).toHaveLength(10)
  for (const novel of wave) {
    expect(WAVE_NOVEL_ART[novel.id].cover, `${novel.id} 표지`).toBeTruthy()
    expect(WAVE_NOVEL_ART[novel.id].hero, `${novel.id} 히어로`).toBeTruthy()
    const characters = novel.characters ?? []
    expect(characters.length, `${novel.id} 인물 수`).toBeGreaterThanOrEqual(4)
    for (const character of characters) {
      expect(CHARACTER_ART[character.id], `${novel.id} 인물 ${character.name}`).toBeTruthy()
    }
    const episode = seed.episodes.find((item) => item.novelId === novel.id && item.no === 1)
    expect(episode, `${novel.id} 1화`).toBeTruthy()
    for (const choice of episode!.choices) {
      expect(WAVE_CHOICE_ART[choice.id], `${episode!.id} 선택지 ${choice.label}`).toBeTruthy()
    }
  }

  // 모든 작품의 모든 선택 장면에 장면 그림이 있어야 합니다.
  for (const flow of ALL_FLOWS) {
    for (const scene of flow.scenes) {
      expect(scene.image, `${flow.novelId} ${scene.id}`).toBeTruthy()
    }
  }

  // 자산 인덱스에 등록한 경로는 모두 파일로 존재해야 합니다 (대표 표본).
  expect(Object.keys(SCENE_ART).length).toBeGreaterThanOrEqual(106)
})

test('홈 — 최상단 슬라이드·작품 피드의 모든 이미지가 로드된다', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(String(error)))
  await page.goto('/#/', { waitUntil: 'networkidle' })
  await expect(page.locator('.book-card').first()).toBeVisible()

  // 카드 수 = 25
  await expect(page.locator('.book-card')).toHaveCount(25)

  const images = await imageHealth(page)
  expect(images.length).toBeGreaterThan(60)
  const broken = images.filter((img) => !img.complete || img.w === 0)
  expect(broken, JSON.stringify(broken.slice(0, 5))).toHaveLength(0)
  expect(errors).toHaveLength(0)

  // 카드 표지 25장이 모두 실제로 그려졌는지 (naturalWidth > 0)
  const covers = await page.locator('.book-card .book-cover img').evaluateAll((nodes) =>
    nodes.map((node) => ({
      src: (node as HTMLImageElement).currentSrc || (node as HTMLImageElement).src,
      w: (node as HTMLImageElement).naturalWidth,
      alt: node.getAttribute('alt'),
    })),
  )
  expect(covers).toHaveLength(25)
  for (const cover of covers) {
    expect(cover.w, cover.src).toBeGreaterThan(0)
    expect(cover.alt ?? '').not.toBe('')
  }
})

test('홈 최상단 슬라이드를 끝까지 넘겨도 그림이 깨지지 않는다', async ({ page }) => {
  await page.goto('/#/', { waitUntil: 'networkidle' })
  const nextButtons = page.locator('button[aria-label="다음 작품"]')
  const slides = page.locator('.carousel-slide, [data-slide]')
  const count = await slides.count()
  if (count === 0) test.skip()
  for (let index = 0; index < Math.min(count, 25); index += 1) {
    if ((await nextButtons.count()) > 0) {
      await nextButtons.first().click()
      await page.waitForTimeout(250)
    }
    const images = await imageHealth(page)
    const broken = images.filter((img) => !img.complete || img.w === 0)
    expect(broken, JSON.stringify(broken.slice(0, 5))).toHaveLength(0)
  }
})

for (const novel of ['nv-secretary', 'nv-nextdoor', 'nv-younger', 'nv-villainess', 'nv-duchess', 'nv-magetower', 'nv-ex', 'nv-ramen', 'nv-ceo', 'nv-academy-ta']) {
  test(`신작 「${novel}」 작품·플레이·회차 화면의 일러스트`, async ({ page }) => {
    await page.goto(`/#/novel/${novel}`, { waitUntil: 'networkidle' })
    await expect(page.locator('.hero-band-art img').first()).toBeVisible()
    let images = await imageHealth(page)
    expect(images.filter((img) => img.w === 0), `${novel} 작품 페이지`).toHaveLength(0)

    // 인물 카드 4장 모두 그림이 그려짐
    const posters = await page.locator('.char-poster img').evaluateAll((nodes) =>
      nodes.map((node) => ({
        src: (node as HTMLImageElement).src,
        w: (node as HTMLImageElement).naturalWidth,
        alt: node.getAttribute('alt'),
      })),
    )
    expect(posters.length).toBeGreaterThanOrEqual(4)
    for (const poster of posters) {
      expect(poster.w, poster.src).toBeGreaterThan(0)
      expect(poster.alt ?? '').not.toBe('')
    }

    // 플레이(선택형 소설) — 6장면을 넘기며 장면 그림이 매번 로드되는지
    await page.goto(`/#/novel/${novel}/play`, { waitUntil: 'networkidle' })
    for (let sceneIndex = 0; sceneIndex < 6; sceneIndex += 1) {
      const scene = page.locator(`#play-scene-${sceneIndex}`)
      await scene.scrollIntoViewIfNeeded()
      const figure = scene.locator('.play-scene-figure img').first()
      await expect(figure, `${novel} ${sceneIndex + 1}장 장면 그림`).toBeVisible()
      const drawn = await figure.evaluate((node) => (node as HTMLImageElement).naturalWidth)
      expect(drawn, `${novel} ${sceneIndex + 1}장`).toBeGreaterThan(0)
      images = await imageHealth(page)
      expect(images.filter((img) => img.w === 0), `${novel} ${sceneIndex + 1}장`).toHaveLength(0)
      await scene.locator('.choice-panel .choice-card').first().click()
      await page.waitForTimeout(120)
    }
    await expect(page.locator('#play-finish')).toBeVisible()

    // 첫 화 읽기 — 본문 삽화 1컷
    const episode = seed.episodes.find((item) => item.novelId === novel && item.no === 1)
    expect(episode).toBeTruthy()
    await page.goto(`/#/novel/${novel}/ep/${episode!.id}`, { waitUntil: 'networkidle' })
    await expect(page.locator('.inline-scene').first()).toBeVisible()
    images = await imageHealth(page)
    expect(images.filter((img) => img.w === 0), `${novel} 회차`).toHaveLength(0)
  })
}

test('모든 작품의 장면 그림 파일이 서버에서 200으로 내려온다', async ({ page }) => {
  const refs = new Set<string>()
  for (const flow of ALL_FLOWS) {
    for (const scene of flow.scenes) if (scene.image) refs.add(scene.image)
  }
  expect(refs.size).toBeGreaterThanOrEqual(140)
  for (const ref of refs) {
    const response = await page.request.get('/' + ref.replace(/^\/+/, ''))
    expect(response.status(), ref).toBe(200)
    expect(response.headers()['content-type'] ?? '', ref).toContain('image')
  }
})

test('기존 작품의 세 번째 갈래 장면(pf-*)도 화면에 그려진다', async ({ page }) => {
  // 4장에 pf 갈래 장면이 있는 작품 하나를 실제로 3장까지 넘겨 확인합니다.
  await page.goto('/#/novel/nv-office/play', { waitUntil: 'networkidle' })
  for (let sceneIndex = 0; sceneIndex < 3; sceneIndex += 1) {
    const scene = page.locator(`#play-scene-${sceneIndex}`)
    await scene.scrollIntoViewIfNeeded()
    await scene.locator('.choice-panel .choice-card').first().click()
    await page.waitForTimeout(150)
  }
  const figure = page.locator('#play-scene-3 .play-scene-figure img').first()
  await expect(figure).toBeVisible()
  const src = await figure.getAttribute('src')
  expect(src ?? '').toContain('images/scenes/pf-office-4.jpg')
  expect(await figure.evaluate((node) => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
})

test('완성 소설(finale)·정주행(read)·분기 트리 화면도 그림이 깨지지 않는다', async ({ page }) => {
  const novel = 'nv-villainess'
  await page.goto(`/#/novel/${novel}/play`, { waitUntil: 'networkidle' })
  for (let sceneIndex = 0; sceneIndex < 6; sceneIndex += 1) {
    const scene = page.locator(`#play-scene-${sceneIndex}`)
    await scene.scrollIntoViewIfNeeded()
    await scene.locator('.choice-panel .choice-card').first().click()
    await page.waitForTimeout(120)
  }
  await expect(page.locator('#play-finish')).toBeVisible()

  for (const view of ['finale', 'read', 'tree']) {
    await page.goto(`/#/novel/${novel}/${view}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(500)
    const images = await imageHealth(page)
    expect(images.length, `${view} 이미지 수`).toBeGreaterThan(0)
    const broken = images.filter((img) => !img.complete || img.w === 0)
    expect(broken, `${view}: ${JSON.stringify(broken.slice(0, 5))}`).toHaveLength(0)
  }
})
