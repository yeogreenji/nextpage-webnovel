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
  'nv-regress': {
    cover: 'images/covers/nv-regress.jpg',
    hero: 'images/covers/hero-regress.jpg',
    characters: [
      {
        id: 'ch-seorin',
        name: '한서린',
        role: '태강그룹 장녀 · 두 번째 스물넷',
        tag: '여주',
        badge: '여주',
        quote: '이번 생에는, 순서를 바꿉니다.',
        image: 'images/characters/nv-regress-seorin.jpg',
      },
      {
        id: 'ch-regress-dohyeon',
        name: '강도현',
        role: '태강그룹 법무실 수석 변호사',
        tag: '남주',
        badge: '남주',
        quote: '웃으실 때는, 보통 누군가 다칩니다.',
        image: 'images/characters/nv-regress-dohyeon.jpg',
      },
      {
        id: 'ch-jihun',
        name: '한지훈',
        role: '이복동생 · 유일한 상속 경쟁자',
        tag: '조연',
        badge: '경쟁자',
        quote: '누나가 그 자리에 앉는 건, 이번 생에도 무리일 텐데요.',
        image: 'images/characters/nv-regress-jihun.jpg',
      },
      {
        id: 'ch-miran',
        name: '오미란',
        role: '회장 비서실장 · 이십 년 근속',
        tag: '조연',
        badge: '비서실장',
        quote: '회장님은 아직, 아무것도 모르고 계십니다.',
        image: 'images/characters/nv-regress-miran.jpg',
      },
    ],
  },
  'nv-academy': {
    cover: 'images/covers/nv-academy.jpg',
    hero: 'images/covers/hero-academy.jpg',
    characters: [
      {
        id: 'ch-ria',
        name: '리아',
        role: '마력 0 판정을 받은 평민 입학생',
        tag: '여주',
        badge: '여주',
        quote: '주문을 못 외우면, 새로 쓰면 되잖아요.',
        image: 'images/characters/nv-academy-ria.jpg',
      },
      {
        id: 'ch-kaiien',
        name: '카이렌',
        role: '수석 졸업생 · 마법 감독관',
        tag: '남주',
        badge: '남주',
        quote: '그 책을 연 순간부터, 당신은 제 관리 대상입니다.',
        image: 'images/characters/nv-academy-kaiien.jpg',
      },
      {
        id: 'ch-serena',
        name: '세레나',
        role: '아르덴 백작가 영애 · 전 학년 수석',
        tag: '조연',
        badge: '라이벌',
        quote: '출신 없는 마법은, 시험에 통하지 않아요.',
        image: 'images/characters/nv-academy-serena.jpg',
      },
      {
        id: 'ch-mumyeong',
        name: '무명',
        role: '4층 서고의 사서 · 이름을 묻지 마세요',
        tag: '조연',
        badge: '사서',
        quote: '네가 이름을 붙이는 순간, 마법이 됩니다.',
        image: 'images/characters/nv-academy-mumyeong.jpg',
      },
    ],
  },
  'nv-cafe': {
    cover: 'images/covers/nv-cafe.jpg',
    hero: 'images/covers/hero-cafe.jpg',
    characters: [
      {
        id: 'ch-soyeon',
        name: '소연',
        role: '새벽 카페 은하수의 주인',
        tag: '여주',
        badge: '여주',
        quote: '오늘은, 그냥 앉아 있어도 돼요.',
        image: 'images/characters/nv-cafe-soyeon.jpg',
      },
      {
        id: 'ch-cafe-dohyeon',
        name: '도현',
        role: '매일 새벽 두 시에 오는 손님',
        tag: '남주',
        badge: '남주',
        quote: '계란 하나 더 넣어 주세요. 오늘은 좀 길었어요.',
        image: 'images/characters/nv-cafe-dohyeon.jpg',
      },
      {
        id: 'ch-myeongsuk',
        name: '명숙',
        role: '새벽 세 시의 단골 할머니',
        tag: '조연',
        badge: '단골',
        quote: '젊은 사람이 밤을 이렇게 새면, 몸이 서운해해.',
        image: 'images/characters/nv-cafe-myeongsuk.jpg',
      },
      {
        id: 'ch-taeo',
        name: '태오',
        role: '카페를 인수하려는 옛 동료',
        tag: '조연',
        badge: '경쟁자',
        quote: '이 가게, 여기 있어야 할 이유가 있습니까?',
        image: 'images/characters/nv-cafe-taeo.jpg',
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
  'ep-office-3b-a': 'images/scenes/story-office-3b.jpg',
  'ep-office-3b-b': 'images/scenes/story-office-3c.jpg',
  'ep-office-3c-a': 'images/scenes/story-office-3c.jpg',
  'ep-office-3c-b': 'images/scenes/story-office-1.jpg',
  'ep-contract-3a-a': 'images/scenes/story-contract-3a.jpg',
  'ep-contract-3a-b': 'images/scenes/story-contract-3b.jpg',
  'ep-contract-3b-a': 'images/scenes/story-contract-3b.jpg',
  'ep-contract-3b-b': 'images/scenes/story-contract-3a.jpg',
  'ep-parcel-2a-a': 'images/scenes/story-parcel-2a.jpg',
  'ep-parcel-2a-b': 'images/scenes/story-parcel-2b.jpg',
  'ep-parcel-2b-a': 'images/scenes/story-parcel-2b.jpg',
  'ep-parcel-2b-b': 'images/scenes/story-parcel-2a.jpg',
  'ep-regress-1-a': 'images/scenes/ep-regress-1-a.jpg',
  'ep-regress-1-b': 'images/scenes/ep-regress-1-b.jpg',
  'ep-regress-2a-a': 'images/scenes/story-regress-2.jpg',
  'ep-regress-2a-b': 'images/scenes/ep-regress-1-a.jpg',
  'ep-regress-2b-a': 'images/scenes/ep-regress-1-b.jpg',
  'ep-regress-2b-b': 'images/scenes/story-regress-1.jpg',
  'ep-regress-3a-a': 'images/covers/hero-regress.jpg',
  'ep-regress-3a-b': 'images/scenes/story-regress-2.jpg',
  'ep-academy-1-a': 'images/scenes/ep-academy-1-a.jpg',
  'ep-academy-1-b': 'images/scenes/ep-academy-1-b.jpg',
  'ep-academy-2a-a': 'images/scenes/story-academy-2.jpg',
  'ep-academy-2a-b': 'images/scenes/ep-academy-1-a.jpg',
  'ep-academy-2b-a': 'images/scenes/story-academy-1.jpg',
  'ep-academy-2b-b': 'images/scenes/ep-academy-1-b.jpg',
  'ep-academy-3a-a': 'images/scenes/story-academy-2.jpg',
  'ep-academy-3a-b': 'images/covers/hero-academy.jpg',
  'ep-cafe-1-a': 'images/scenes/ep-cafe-1-a.jpg',
  'ep-cafe-1-b': 'images/scenes/ep-cafe-1-b.jpg',
  'ep-cafe-2a-a': 'images/scenes/story-cafe-2.jpg',
  'ep-cafe-2a-b': 'images/scenes/ep-cafe-1-b.jpg',
  'ep-cafe-2b-a': 'images/scenes/ep-cafe-1-b.jpg',
  'ep-cafe-2b-b': 'images/scenes/story-cafe-1.jpg',
  'ep-cafe-3a-a': 'images/scenes/story-cafe-2.jpg',
  'ep-cafe-3a-b': 'images/covers/hero-cafe.jpg',
}

export type { InlineScene } from '../types'
import type { InlineScene } from '../types'

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
  'ep-office-3b': [
    {
      image: 'images/scenes/story-office-3b.jpg',
      caption: '회의가 끝난 회의실. 누가 만든 안인지는, 숫자가 기억한다.',
      anchor: '이 안은 하윤 대리가 만든 겁니다',
      fallbackAfter: 10,
    },
  ],
  'ep-office-3c': [
    {
      image: 'images/scenes/story-office-3c.jpg',
      caption: '새벽 세 시, 표는 완성됐다. 손등의 반창고는 아직 붙어 있었다.',
      anchor: '표가 완성됐다',
      fallbackAfter: 22,
    },
  ],
  'ep-contract-3a': [
    {
      image: 'images/scenes/story-contract-3a.jpg',
      caption: '이름을 되찾는 날, 문은 닫힌다. 이름은 남는다.',
      anchor: '이름은 남는다',
      fallbackAfter: 4,
    },
  ],
  'ep-contract-3b': [
    {
      image: 'images/scenes/story-contract-3b.jpg',
      caption: '계약서의 두 번째 서명란은, 백 년 동안 비어 있었다.',
      anchor: '서명란은 두 칸이었다',
      fallbackAfter: 14,
    },
  ],
  'ep-parcel-2a': [
    {
      image: 'images/scenes/story-parcel-2a.jpg',
      caption: '상자 안에는 앨범이 있었다. 다섯 번째 장은 오늘 밤이었다.',
      anchor: '다섯 번째 장. 오늘 밤이었다',
      fallbackAfter: 8,
    },
  ],
  'ep-parcel-2b': [
    {
      image: 'images/scenes/story-parcel-2b.jpg',
      caption: '가로등 아래의 사람은, 얼굴이 아니라 손을 보여 주었다.',
      anchor: '그 사람의 손을 봤다',
      fallbackAfter: 8,
    },
  ],
  'ep-regress-1': [
    {
      image: 'images/scenes/story-regress-1.jpg',
      caption: '오후 다섯 시, 금고에 들어갈 봉투. 서린은 그 전에 손을 대기로 했다.',
      anchor: '유언장 초안이 들어간다',
      fallbackAfter: 12,
    },
  ],
  'ep-regress-2a': [
    {
      image: 'images/scenes/ep-regress-1-a.jpg',
      caption: '책장 뒤의 금고, 세 번째 칸의 봉투. 여덟 장 중 다섯 장째에서 손이 멈췄다.',
      anchor: '봉투는 세 번째 칸에 있었다',
      fallbackAfter: 6,
    },
  ],
  'ep-regress-2b': [
    {
      image: 'images/scenes/ep-regress-1-b.jpg',
      caption: '시장 과일가게. 이십 년 전 비서는 사과 하나를 밀어 주었다.',
      anchor: '사과 하나를 서린 쪽으로 밀었다',
      fallbackAfter: 20,
    },
  ],
  'ep-regress-3a': [
    {
      image: 'images/scenes/story-regress-2.jpg',
      caption: '오전 아홉 시, 회장실. 아무도 읽지 않은 7장이 테이블 위에 놓였다.',
      anchor: '7장을 테이블 위에 밀었다',
      fallbackAfter: 10,
    },
  ],
  'ep-academy-1': [
    {
      image: 'images/scenes/story-academy-1.jpg',
      caption: '4층 서고, 이름이 없는 책. 첫 글자를 쓰기 직전의 밤.',
      anchor: '첫 글자를 쓰려고 손을 댔다',
      fallbackAfter: 26,
    },
  ],
  'ep-academy-2a': [
    {
      image: 'images/scenes/ep-academy-1-a.jpg',
      caption: '이름 두 글자가 빛나자, 서고의 주문이 거꾸로 읽혔다.',
      anchor: '룬이 뒤집혔다',
      fallbackAfter: 4,
    },
  ],
  'ep-academy-2b': [
    {
      image: 'images/scenes/ep-academy-1-b.jpg',
      caption: '사서의 조건은 책이 아니라 이름이었다.',
      anchor: '사서가 리아에게 조건을 제시했다',
      fallbackAfter: 14,
    },
  ],
  'ep-academy-3a': [
    {
      image: 'images/scenes/story-academy-2.jpg',
      caption: '감독관실, 서리로 그린 시험 원. 이름 없이도 마법은 대답했다.',
      anchor: '결계를 건드린 마법사는',
      fallbackAfter: 14,
    },
  ],
  'ep-cafe-1': [
    {
      image: 'images/scenes/story-cafe-1.jpg',
      caption: '새벽 두 시, 계란 두 개가 들어간 라면 한 그릇.',
      anchor: '계란을 하나 더 넣었다',
      fallbackAfter: 18,
    },
  ],
  'ep-cafe-2a': [
    {
      image: 'images/scenes/ep-cafe-1-a.jpg',
      caption: '메뉴판에 치즈가 늘어난 날. 손님은 그걸 기억하지 못했다.',
      anchor: '치즈를 사 둔 것이었다',
      fallbackAfter: 8,
    },
  ],
  'ep-cafe-2b': [
    {
      image: 'images/scenes/ep-cafe-1-b.jpg',
      caption: '서비스의 영수증은, 손글씨 쪽지 한 장이었다.',
      anchor: '오늘 라면값은 다음 손님 라면값으로 갚겠습니다',
      fallbackAfter: 6,
    },
  ],
  'ep-cafe-3a': [
    {
      image: 'images/scenes/story-cafe-2.jpg',
      caption: '20년치 외상 장부. 갚은 이름에만 별이 붙어 있었다.',
      anchor: '2005년 4월, 세 번째 줄',
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
