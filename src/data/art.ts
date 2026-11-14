import type { Character, Episode, Novel } from '../types'

/**
 * 일러스트 자산 인덱스.
 * - 파일은 `public/images/` 아래에 있고, Vite 가 `base: './'` 로 그대로 복사합니다.
 * - 화면에서는 항상 `imageUrl()` 을 거쳐 경로를 만듭니다. (GitHub Pages 하위 경로 배포 대응)
 */
const BASE = import.meta.env.BASE_URL || './'

export function imageUrl(path?: string | null): string | undefined {
  if (!path) return undefined
  if (/^(https?:|data:|blob:)/i.test(path)) return path
  return `${BASE}${path.replace(/^\/+/, '')}`
}

interface NovelArt {
  cover?: string
  hero?: string
  characters?: Character[]
}

export const NOVEL_ART: Record<string, NovelArt> = {
  'nv-office': {
    cover: 'images/covers/nv-office.jpg',
    hero: 'images/covers/hero-office.jpg',
    characters: [
      {
        id: 'ch-hayun',
        name: '하윤',
        role: '마케팅팀 3년차 대리',
        tag: '여주',
        badge: '여주',
        quote: '제가 뽑은 숫자는, 제가 설명할게요.',
        image: 'images/characters/nv-office-hayun.jpg',
      },
      {
        id: 'ch-seojun',
        name: '서준',
        role: '마케팅팀 신임 팀장',
        tag: '남주',
        badge: '남주',
        quote: '사과는 회의실 밖에서. 다음부터는.',
        image: 'images/characters/nv-office-seojun.jpg',
      },
      {
        id: 'ch-minjae',
        name: '민재',
        role: '마케팅팀 인턴 · 네 살 연하',
        tag: '조연',
        badge: '서브남주',
        quote: '선배가 만든 숫자면, 한번 믿어볼게요.',
        image: 'images/characters/nv-office-minjae.jpg',
      },
      {
        id: 'ch-yuna',
        name: '유나',
        role: '콘텐츠전략팀 팀장 · 같은 목표의 경쟁자',
        tag: '조연',
        badge: '라이벌',
        quote: '그 보고서, 팀장님이 봐줬다면서요?',
        image: 'images/characters/nv-office-yuna.jpg',
      },
    ],
  },
  'nv-contract': {
    cover: 'images/covers/nv-contract.jpg',
    hero: 'images/covers/hero-contract.jpg',
    characters: [
      {
        id: 'ch-seoha',
        name: '서하',
        role: '골동품 가게의 마지막 주인',
        tag: '여주',
        badge: '여주',
        quote: '가게는 사라져도, 이름은 남잖아요.',
        image: 'images/characters/nv-contract-seoha.jpg',
      },
      {
        id: 'ch-gwanrija',
        name: '계약의 관리자',
        role: '이름을 말할 수 없는 남자',
        tag: '남주',
        badge: '남주',
        quote: '저는 계약의 일부이기 때문입니다.',
        image: 'images/characters/nv-contract-gwanrija.jpg',
      },
      {
        id: 'ch-kael',
        name: '카엘',
        role: '북부 공작 · 계약의 또 다른 당사자',
        tag: '조연',
        badge: '경쟁자',
        quote: '계약서에 없는 이름은, 제 앞에서 꺼내지 마시오.',
        image: 'images/characters/nv-contract-kael.jpg',
      },
      {
        id: 'ch-vivian',
        name: '비비안',
        role: '이름을 사고파는 정보상',
        tag: '조연',
        badge: '조력자',
        quote: '값을 먼저 말하지 않으면, 아무것도 못 사요.',
        image: 'images/characters/nv-contract-vivian.jpg',
      },
    ],
  },
  'nv-parcel': {
    cover: 'images/covers/nv-parcel.jpg',
    hero: 'images/covers/hero-parcel.jpg',
    characters: [
      {
        id: 'ch-yunjae',
        name: '윤재',
        role: '이사 온 지 사흘 된 직장인',
        tag: '남주',
        badge: '남주',
        quote: '사흘 뒤의 내가, 지금의 나에게 보낸 상자.',
        image: 'images/characters/nv-parcel-yunjae.jpg',
      },
      {
        id: 'ch-harin',
        name: '하린',
        role: '402호 이웃 · 사진 속의 여자',
        tag: '여주',
        badge: '여주',
        quote: '그 택배, 제가 보낸 게 아니에요.',
        image: 'images/characters/nv-parcel-harin.jpg',
      },
      {
        id: 'ch-sujin',
        name: '수진',
        role: '같은 팀 동료 · 유일한 목격자',
        tag: '조연',
        badge: '동료',
        quote: '그 상자, 네가 열었어? 진짜?',
        image: 'images/characters/nv-parcel-sujin.jpg',
      },
      {
        id: 'ch-gangsiljang',
        name: '강실장',
        role: '이 건물의 경비실장',
        tag: '조연',
        badge: '경비원',
        quote: '이 건물에는 402호가 없습니다.',
        image: 'images/characters/nv-parcel-gangsiljang.jpg',
      },
    ],
  },
}

/** 선택지 id → 장면 일러스트 */
export const CHOICE_ART: Record<string, string> = {
  'ep-office-1-a': 'images/scenes/ep-office-1-a.jpg',
  'ep-office-1-b': 'images/scenes/ep-office-1-b.jpg',
  'ep-office-2a-a': 'images/scenes/ep-office-2a-a.jpg',
  'ep-office-2a-b': 'images/scenes/ep-office-2a-b.jpg',
  'ep-office-2b-a': 'images/scenes/ep-office-2b-a.jpg',
  'ep-office-2b-b': 'images/scenes/ep-office-2b-b.jpg',
  'ep-office-3a-a': 'images/scenes/ep-office-3a-a.jpg',
  'ep-office-3a-b': 'images/scenes/ep-office-3a-b.jpg',
  'ep-contract-1-a': 'images/scenes/ep-contract-1-a.jpg',
  'ep-contract-1-b': 'images/scenes/ep-contract-1-b.jpg',
  'ep-contract-2a-a': 'images/scenes/ep-contract-2a-a.jpg',
  'ep-contract-2a-b': 'images/scenes/ep-contract-2a-b.jpg',
  'ep-contract-2b-a': 'images/scenes/ep-contract-2b-a.jpg',
  'ep-contract-2b-b': 'images/scenes/ep-contract-2b-b.jpg',
  'ep-parcel-1-a': 'images/scenes/ep-parcel-1-a.jpg',
  'ep-parcel-1-b': 'images/scenes/ep-parcel-1-b.jpg',
}

/** 본문 중간에 끼워 넣는 삽화 한 컷 */
export interface InlineScene {
  image: string
  caption: string
  /** 이 문장이 들어 있는 문단 '뒤'에 삽화를 놓습니다. */
  anchor: string
  /** anchor 문단을 찾지 못했을 때 놓을 문단 인덱스 (0-based) */
  fallbackAfter: number
}

/**
 * 회차 id → 본문 삽화.
 * 문단 사이에 큰 그림이 들어가, 읽는 동안 화면이 계속 그림으로 채워집니다.
 */
export const EPISODE_SCENES: Record<string, InlineScene[]> = {
  'ep-office-1': [
    {
      image: 'images/scenes/story-office-1.jpg',
      caption: '8시 57분, 12층까지 세 사람이 내리고 두 사람이 남았다.',
      anchor: '그의 코트 자락이 복도 끝으로 사라졌다',
      fallbackAfter: 22,
    },
  ],
  'ep-office-2a': [
    {
      image: 'images/scenes/story-office-2a.jpg',
      caption: '회의 시작 2분 전, 숫자를 먼저 말하기로 했다.',
      anchor: '그래서 B안으로 바꿔 왔습니다',
      fallbackAfter: 12,
    },
  ],
  'ep-office-2b': [
    {
      image: 'images/scenes/story-office-2b.jpg',
      caption: '회의가 끝난 회의실. 아무도 남지 않았는데 공기는 남아 있었다.',
      anchor: '회의는 11시에 끝났다',
      fallbackAfter: 16,
    },
  ],
  'ep-office-3a': [
    {
      image: 'images/scenes/story-office-3a.jpg',
      caption: '아메리카노 한 잔, 흑당라떼 한 잔. 반씩 나눠 마시는 것이 규칙.',
      anchor: '그게 규칙입니다',
      fallbackAfter: 24,
    },
  ],
  'ep-contract-1': [
    {
      image: 'images/scenes/story-contract-1b.jpg',
      caption: '비를 맞지도 않은 외투. 문을 두드린 것은 손님이 아니었다.',
      anchor: '비를 맞지도 않은 검은 외투',
      fallbackAfter: 6,
    },
    {
      image: 'images/scenes/story-contract-1.jpg',
      caption: '사흘 동안 열리지 않던 금고가, 그의 손끝에서 열렸다.',
      anchor: '제가 계약의 일부이기 때문입니다',
      fallbackAfter: 30,
    },
  ],
  'ep-contract-2a': [
    {
      image: 'images/scenes/story-contract-2a.jpg',
      caption: '「무엇을 택하든 미안하다.」 할아버지가 남긴 마지막 한 줄.',
      anchor: '무엇을 택하든 미안하다',
      fallbackAfter: 14,
    },
  ],
  'ep-contract-2b': [
    {
      image: 'images/scenes/story-contract-2b.jpg',
      caption: '찻잔 두 개. 하나는 깨진 자국이 있어 늘 자기 것이었다.',
      anchor: '찻잔 두 개',
      fallbackAfter: 8,
    },
  ],
  'ep-parcel-1': [
    {
      image: 'images/scenes/story-parcel-1.jpg',
      caption: '세 번째 상자. 받는 사람은 여전히, 사흘 뒤의 나.',
      anchor: '바닥에 상자 하나',
      fallbackAfter: 18,
    },
  ],
}

/** 문단 배열에 삽화 위치를 계산해 돌려줍니다. */
export function placeScenes(
  episodeId: string,
  paragraphs: string[],
): { text: string; scene?: InlineScene }[] {
  const scenes = EPISODE_SCENES[episodeId] ?? []
  const placed = new Map<number, InlineScene[]>()

  scenes.forEach((scene) => {
    let index = paragraphs.findIndex((line) => line.includes(scene.anchor))
    if (index < 0) index = Math.min(scene.fallbackAfter, paragraphs.length - 1)
    const list = placed.get(index) ?? []
    if (!list.some((item) => item.image === scene.image)) list.push(scene)
    placed.set(index, list)
  })

  return paragraphs.flatMap((text, index) => {
    const items = placed.get(index)
    if (!items || items.length === 0) return [{ text }]
    return [{ text }, ...items.map((scene) => ({ text: '', scene }))]
  })
}

/** 한 작품의 모든 삽화 (작품 페이지 '명장면 갤러리'용) */
export function scenesForEpisodes(
  episodes: Episode[],
): { episode: Episode; scene: InlineScene }[] {
  return episodes.flatMap((episode) =>
    (EPISODE_SCENES[episode.id] ?? []).map((scene) => ({ episode, scene })),
  )
}

/**
 * 저장된 데이터(localStorage)에 일러스트가 없어도 화면에 그림이 나오도록
 * 작품·선택지 id 기준으로 자산을 붙여 줍니다.
 */
export function attachArt(
  novels: Novel[],
  episodes: Episode[],
): { novels: Novel[]; episodes: Episode[] } {
  return {
    novels: novels.map((novel) => {
      const art = NOVEL_ART[novel.id]
      if (!art) return novel
      return {
        ...novel,
        coverImage: novel.coverImage ?? art.cover,
        heroImage: novel.heroImage ?? art.hero,
        characters: novel.characters && novel.characters.length > 0 ? novel.characters : art.characters,
      }
    }),
    episodes: episodes.map((episode) => ({
      ...episode,
      choices: episode.choices.map((choice) => ({
        ...choice,
        image: choice.image ?? CHOICE_ART[choice.id],
      })),
    })),
  }
}
