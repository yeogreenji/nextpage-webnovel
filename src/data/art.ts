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
        quote: '제가 뽑은 숫자는, 제가 설명할게요.',
        image: 'images/characters/nv-office-hayun.jpg',
      },
      {
        id: 'ch-seojun',
        name: '서준',
        role: '마케팅팀 신임 팀장',
        tag: '남주',
        quote: '사과는 회의실 밖에서. 다음부터는.',
        image: 'images/characters/nv-office-seojun.jpg',
      },
    ],
  },
  'nv-contract': {
    cover: 'images/covers/nv-contract.jpg',
    characters: [
      {
        id: 'ch-seoha',
        name: '서하',
        role: '골동품 가게의 마지막 주인',
        tag: '여주',
        quote: '가게는 사라져도, 이름은 남잖아요.',
        image: 'images/characters/nv-contract-seoha.jpg',
      },
      {
        id: 'ch-gwanrija',
        name: '계약의 관리자',
        role: '이름을 말할 수 없는 남자',
        tag: '남주',
        quote: '저는 계약의 일부이기 때문입니다.',
        image: 'images/characters/nv-contract-gwanrija.jpg',
      },
    ],
  },
  'nv-parcel': {
    cover: 'images/covers/nv-parcel.jpg',
    characters: [
      {
        id: 'ch-yunjae',
        name: '윤재',
        role: '이사 온 지 사흘 된 직장인',
        tag: '남주',
        quote: '사흘 뒤의 내가, 지금의 나에게 보낸 상자.',
        image: 'images/characters/nv-parcel-yunjae.jpg',
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
