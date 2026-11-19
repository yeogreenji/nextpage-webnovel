import type { InlineScene } from '../types'

/**
 * 2026 리뉴얼 신작 10편의 일러스트 인덱스.
 * — 표지(3:4·2:3) · 히어로 와이드 · 인물 카드 · 장면 컷 · 첫 화 선택지 컷.
 * — 파일은 모두 `public/images/` 아래에 있고, 화면에서는 `imageUrl()` 을 거쳐 씁니다.
 */

/** 작품별 표지·히어로 아트 */
export const WAVE_NOVEL_ART: Record<string, { cover: string; hero: string }> = {
  'nv-secretary': { cover: 'images/covers/nv-secretary.jpg', hero: 'images/covers/hero-secretary.jpg' },
  'nv-nextdoor': { cover: 'images/covers/nv-nextdoor.jpg', hero: 'images/covers/hero-nextdoor.jpg' },
  'nv-younger': { cover: 'images/covers/nv-younger.jpg', hero: 'images/covers/hero-younger.jpg' },
  'nv-villainess': { cover: 'images/covers/nv-villainess.jpg', hero: 'images/covers/hero-villainess.jpg' },
  'nv-duchess': { cover: 'images/covers/nv-duchess.jpg', hero: 'images/covers/hero-duchess.jpg' },
  'nv-magetower': { cover: 'images/covers/nv-magetower.jpg', hero: 'images/covers/hero-magetower.jpg' },
  'nv-ex': { cover: 'images/covers/nv-ex.jpg', hero: 'images/covers/hero-ex.jpg' },
  'nv-ramen': { cover: 'images/covers/nv-ramen.jpg', hero: 'images/covers/hero-ramen.jpg' },
  'nv-ceo': { cover: 'images/covers/nv-ceo.jpg', hero: 'images/covers/hero-ceo.jpg' },
  'nv-academy-ta': { cover: 'images/covers/nv-academy-ta.jpg', hero: 'images/covers/hero-academy-ta.jpg' },
}

/** 인물 id → 인물 일러스트 (신작 40인) */
export const CHARACTER_ART: Record<string, string> = {
  // 대표님, 퇴사는 제가 결정합니다
  'ch-sec-seoa': 'images/characters/nv-secretary-seoa.jpg',
  'ch-sec-iden': 'images/characters/nv-secretary-iden.jpg',
  'ch-sec-jeonghu': 'images/characters/nv-secretary-jeonghu.jpg',
  'ch-sec-harin': 'images/characters/nv-secretary-harin.jpg',
  // 이혼 3년 차, 전남편이 옆집에 삽니다
  'ch-nd-hayun': 'images/characters/nv-nextdoor-hayun.jpg',
  'ch-nd-hangyeol': 'images/characters/nv-nextdoor-hangyeol.jpg',
  'ch-nd-sori': 'images/characters/nv-nextdoor-sori.jpg',
  'ch-nd-taesik': 'images/characters/nv-nextdoor-taesik.jpg',
  // 마흔의 봄, 스물여덟의 너
  'ch-yg-harin': 'images/characters/nv-younger-harin.jpg',
  'ch-yg-taeo': 'images/characters/nv-younger-taeo.jpg',
  'ch-yg-dodam': 'images/characters/nv-younger-dodam.jpg',
  'ch-yg-sehun': 'images/characters/nv-younger-sehun.jpg',
  // 악녀는 오늘도 야근을 한다
  'ch-vl-riana': 'images/characters/nv-villainess-riana.jpg',
  'ch-vl-kaien': 'images/characters/nv-villainess-kaien.jpg',
  'ch-vl-mari': 'images/characters/nv-villainess-mari.jpg',
  'ch-vl-lian': 'images/characters/nv-villainess-lian.jpg',
  // 버려진 공작부인은 온실을 가꾼다
  'ch-du-irea': 'images/characters/nv-duchess-irea.jpg',
  'ch-du-aston': 'images/characters/nv-duchess-kyle.jpg',
  'ch-du-tom': 'images/characters/nv-duchess-tom.jpg',
  'ch-du-anna': 'images/characters/nv-duchess-anna.jpg',
  // 마탑의 계약서에 사인했습니다
  'ch-mg-sera': 'images/characters/nv-magetower-sera.jpg',
  'ch-mg-ethan': 'images/characters/nv-magetower-ethan.jpg',
  'ch-mg-bell': 'images/characters/nv-magetower-bell.jpg',
  'ch-mg-noa': 'images/characters/nv-magetower-noa.jpg',
  // 우리 다시, 연애부터 할까요
  'ch-ex-sua': 'images/characters/nv-ex-sua.jpg',
  'ch-ex-dohyeon': 'images/characters/nv-ex-dohyeon.jpg',
  'ch-ex-yujin': 'images/characters/nv-ex-yujin.jpg',
  'ch-ex-jeongmin': 'images/characters/nv-ex-jeongmin.jpg',
  // 옆집 남자는 새벽 두 시에 라면을 끓인다
  'ch-rm-hana': 'images/characters/nv-ramen-hana.jpg',
  'ch-rm-mino': 'images/characters/nv-ramen-mino.jpg',
  'ch-rm-misuk': 'images/characters/nv-ramen-misuk.jpg',
  'ch-rm-dubu': 'images/characters/nv-ramen-dubu.jpg',
  // 사장님, 그 계약 제가 다시 씁니다
  'ch-cc-yujin': 'images/characters/nv-ceo-yujin.jpg',
  'ch-cc-jaei': 'images/characters/nv-ceo-jaei.jpg',
  'ch-cc-hyeonu': 'images/characters/nv-ceo-hyeonu.jpg',
  'ch-cc-seoah': 'images/characters/nv-ceo-seoah.jpg',
  // 마법학교 조교는 퇴근하고 싶다
  'ch-ac-rize': 'images/characters/nv-academy-ta-rize.jpg',
  'ch-ac-kail': 'images/characters/nv-academy-ta-kail.jpg',
  'ch-ac-tia': 'images/characters/nv-academy-ta-tia.jpg',
  'ch-ac-dean': 'images/characters/nv-academy-ta-hart.jpg',
}

/** 첫 화 선택지 컷 (신작 20컷) */
export const WAVE_CHOICE_ART: Record<string, string> = {
  'ep-secretary-1-a': 'images/scenes/ep-secretary-1-a.jpg',
  'ep-secretary-1-b': 'images/scenes/ep-secretary-1-b.jpg',
  'ep-nextdoor-1-a': 'images/scenes/ep-nextdoor-1-a.jpg',
  'ep-nextdoor-1-b': 'images/scenes/ep-nextdoor-1-b.jpg',
  'ep-younger-1-a': 'images/scenes/ep-younger-1-a.jpg',
  'ep-younger-1-b': 'images/scenes/ep-younger-1-b.jpg',
  'ep-villainess-1-a': 'images/scenes/ep-villainess-1-a.jpg',
  'ep-villainess-1-b': 'images/scenes/ep-villainess-1-b.jpg',
  'ep-duchess-1-a': 'images/scenes/ep-duchess-1-a.jpg',
  'ep-duchess-1-b': 'images/scenes/ep-duchess-1-b.jpg',
  'ep-magetower-1-a': 'images/scenes/ep-magetower-1-a.jpg',
  'ep-magetower-1-b': 'images/scenes/ep-magetower-1-b.jpg',
  'ep-ex-1-a': 'images/scenes/ep-ex-1-a.jpg',
  'ep-ex-1-b': 'images/scenes/ep-ex-1-b.jpg',
  'ep-ramen-1-a': 'images/scenes/ep-ramen-1-a.jpg',
  'ep-ramen-1-b': 'images/scenes/ep-ramen-1-b.jpg',
  'ep-ceo-1-a': 'images/scenes/ep-ceo-1-a.jpg',
  'ep-ceo-1-b': 'images/scenes/ep-ceo-1-b.jpg',
  'ep-academy-ta-1-a': 'images/scenes/ep-academy-ta-1-a.jpg',
  'ep-academy-ta-1-b': 'images/scenes/ep-academy-ta-1-b.jpg',
}

/** 선택 장면(PlayScene) id → 장면 일러스트. 신작 60컷 + 기존 작품 세 번째 갈래 46컷 */
export const SCENE_ART: Record<string, string> = {
  'wf-secretary-1': 'images/scenes/wf-secretary-1.jpg',
  'wf-secretary-2': 'images/scenes/wf-secretary-2.jpg',
  'wf-secretary-3': 'images/scenes/wf-secretary-3.jpg',
  'wf-secretary-4': 'images/scenes/wf-secretary-4.jpg',
  'wf-secretary-5': 'images/scenes/wf-secretary-5.jpg',
  'wf-secretary-6': 'images/scenes/wf-secretary-6.jpg',
  'wf-nextdoor-1': 'images/scenes/wf-nextdoor-1.jpg',
  'wf-nextdoor-2': 'images/scenes/wf-nextdoor-2.jpg',
  'wf-nextdoor-3': 'images/scenes/wf-nextdoor-3.jpg',
  'wf-nextdoor-4': 'images/scenes/wf-nextdoor-4.jpg',
  'wf-nextdoor-5': 'images/scenes/wf-nextdoor-5.jpg',
  'wf-nextdoor-6': 'images/scenes/wf-nextdoor-6.jpg',
  'wf-younger-1': 'images/scenes/wf-younger-1.jpg',
  'wf-younger-2': 'images/scenes/wf-younger-2.jpg',
  'wf-younger-3': 'images/scenes/wf-younger-3.jpg',
  'wf-younger-4': 'images/scenes/wf-younger-4.jpg',
  'wf-younger-5': 'images/scenes/wf-younger-5.jpg',
  'wf-younger-6': 'images/scenes/wf-younger-6.jpg',
  'wf-villainess-1': 'images/scenes/wf-villainess-1.jpg',
  'wf-villainess-2': 'images/scenes/wf-villainess-2.jpg',
  'wf-villainess-3': 'images/scenes/wf-villainess-3.jpg',
  'wf-villainess-4': 'images/scenes/wf-villainess-4.jpg',
  'wf-villainess-5': 'images/scenes/wf-villainess-5.jpg',
  'wf-villainess-6': 'images/scenes/wf-villainess-6.jpg',
  'wf-duchess-1': 'images/scenes/wf-duchess-1.jpg',
  'wf-duchess-2': 'images/scenes/wf-duchess-2.jpg',
  'wf-duchess-3': 'images/scenes/wf-duchess-3.jpg',
  'wf-duchess-4': 'images/scenes/wf-duchess-4.jpg',
  'wf-duchess-5': 'images/scenes/wf-duchess-5.jpg',
  'wf-duchess-6': 'images/scenes/wf-duchess-6.jpg',
  'wf-magetower-1': 'images/scenes/wf-magetower-1.jpg',
  'wf-magetower-2': 'images/scenes/wf-magetower-2.jpg',
  'wf-magetower-3': 'images/scenes/wf-magetower-3.jpg',
  'wf-magetower-4': 'images/scenes/wf-magetower-4.jpg',
  'wf-magetower-5': 'images/scenes/wf-magetower-5.jpg',
  'wf-magetower-6': 'images/scenes/wf-magetower-6.jpg',
  'wf-ex-1': 'images/scenes/wf-ex-1.jpg',
  'wf-ex-2': 'images/scenes/wf-ex-2.jpg',
  'wf-ex-3': 'images/scenes/wf-ex-3.jpg',
  'wf-ex-4': 'images/scenes/wf-ex-4.jpg',
  'wf-ex-5': 'images/scenes/wf-ex-5.jpg',
  'wf-ex-6': 'images/scenes/wf-ex-6.jpg',
  'wf-ramen-1': 'images/scenes/wf-ramen-1.jpg',
  'wf-ramen-2': 'images/scenes/wf-ramen-2.jpg',
  'wf-ramen-3': 'images/scenes/wf-ramen-3.jpg',
  'wf-ramen-4': 'images/scenes/wf-ramen-4.jpg',
  'wf-ramen-5': 'images/scenes/wf-ramen-5.jpg',
  'wf-ramen-6': 'images/scenes/wf-ramen-6.jpg',
  'wf-ceo-1': 'images/scenes/wf-ceo-1.jpg',
  'wf-ceo-2': 'images/scenes/wf-ceo-2.jpg',
  'wf-ceo-3': 'images/scenes/wf-ceo-3.jpg',
  'wf-ceo-4': 'images/scenes/wf-ceo-4.jpg',
  'wf-ceo-5': 'images/scenes/wf-ceo-5.jpg',
  'wf-ceo-6': 'images/scenes/wf-ceo-6.jpg',
  'wf-academy-ta-1': 'images/scenes/wf-academy-ta-1.jpg',
  'wf-academy-ta-2': 'images/scenes/wf-academy-ta-2.jpg',
  'wf-academy-ta-3': 'images/scenes/wf-academy-ta-3.jpg',
  'wf-academy-ta-4': 'images/scenes/wf-academy-ta-4.jpg',
  'wf-academy-ta-5': 'images/scenes/wf-academy-ta-5.jpg',
  'wf-academy-ta-6': 'images/scenes/wf-academy-ta-6.jpg',
  // 기존 15작품 — 세 번째 갈래 장면
  'pf-office-2': 'images/scenes/pf-office-2.jpg',
  'pf-office-4': 'images/scenes/pf-office-4.jpg',
  'pf-office-6': 'images/scenes/pf-office-6.jpg',
  'pf-campus-2': 'images/scenes/pf-campus-2.jpg',
  'pf-campus-4': 'images/scenes/pf-campus-4.jpg',
  'pf-campus-6': 'images/scenes/pf-campus-6.jpg',
  'pf-marry-2': 'images/scenes/pf-marry-2.jpg',
  'pf-marry-4': 'images/scenes/pf-marry-4.jpg',
  'pf-marry-6': 'images/scenes/pf-marry-6.jpg',
  'pf-idol-2': 'images/scenes/pf-idol-2.jpg',
  'pf-idol-3': 'images/scenes/pf-idol-3.jpg',
  'pf-idol-4': 'images/scenes/pf-idol-4.jpg',
  'pf-palace-2': 'images/scenes/pf-palace-2.jpg',
  'pf-palace-3': 'images/scenes/pf-palace-3.jpg',
  'pf-palace-5': 'images/scenes/pf-palace-5.jpg',
  'pf-rival-2': 'images/scenes/pf-rival-2.jpg',
  'pf-rival-3': 'images/scenes/pf-rival-3.jpg',
  'pf-rival-5': 'images/scenes/pf-rival-5.jpg',
  'pf-contract-2': 'images/scenes/pf-contract-2.jpg',
  'pf-contract-3': 'images/scenes/pf-contract-3.jpg',
  'pf-contract-6': 'images/scenes/pf-contract-6.jpg',
  'pf-academy-2': 'images/scenes/pf-academy-2.jpg',
  'pf-academy-3': 'images/scenes/pf-academy-3.jpg',
  'pf-academy-5': 'images/scenes/pf-academy-5.jpg',
  'pf-regress-2': 'images/scenes/pf-regress-2.jpg',
  'pf-regress-4': 'images/scenes/pf-regress-4.jpg',
  'pf-regress-5': 'images/scenes/pf-regress-5.jpg',
  'pf-cafe-2': 'images/scenes/pf-cafe-2.jpg',
  'pf-cafe-5': 'images/scenes/pf-cafe-5.jpg',
  'pf-cafe-6': 'images/scenes/pf-cafe-6.jpg',
  'pf-murim-2': 'images/scenes/pf-murim-2.jpg',
  'pf-murim-5': 'images/scenes/pf-murim-5.jpg',
  'pf-murim-6': 'images/scenes/pf-murim-6.jpg',
  'pf-memory-2': 'images/scenes/pf-memory-2.jpg',
  'pf-memory-5': 'images/scenes/pf-memory-5.jpg',
  'pf-memory-6': 'images/scenes/pf-memory-6.jpg',
  'pf-parcel-2': 'images/scenes/pf-parcel-2.jpg',
  'pf-parcel-3': 'images/scenes/pf-parcel-3.jpg',
  'pf-parcel-4': 'images/scenes/pf-parcel-4.jpg',
  'pf-parcel-6': 'images/scenes/pf-parcel-6.jpg',
  'pf-lodge-2': 'images/scenes/pf-lodge-2.jpg',
  'pf-lodge-3': 'images/scenes/pf-lodge-3.jpg',
  'pf-lodge-5': 'images/scenes/pf-lodge-5.jpg',
  'pf-occult-2': 'images/scenes/pf-occult-2.jpg',
  'pf-occult-3': 'images/scenes/pf-occult-3.jpg',
  'pf-occult-6': 'images/scenes/pf-occult-6.jpg',
}

/** 신작 1화 본문 삽화 — 읽는 동안 화면을 채우는 한 컷 */
export const WAVE_EPISODE_SCENES: Record<string, InlineScene[]> = {
  'ep-secretary-1': [
    {
      image: 'images/scenes/wf-secretary-1.jpg',
      caption: '8시 54분, 엘리베이터가 열리고 그가 나왔다. 봉투는 아직 뜯기지 않았다.',
      anchor: '8시 54분, 엘리베이터가 열리고',
      fallbackAfter: 2,
    },
  ],
  'ep-nextdoor-1': [
    {
      image: 'images/scenes/wf-nextdoor-1.jpg',
      caption: '문 하나 건너, 3년 만에 마주친 얼굴.',
      anchor: '나온 사람은 검은 셔츠에 슬리퍼',
      fallbackAfter: 2,
    },
  ],
  'ep-younger-1': [
    {
      image: 'images/scenes/wf-younger-1.jpg',
      caption: '받는 사람 ‘봄날 편집부’. 보내는 사람은 비어 있었다.',
      anchor: '카페 카운터에 봉투 하나가',
      fallbackAfter: 1,
    },
  ],
  'ep-villainess-1': [
    {
      image: 'images/scenes/wf-villainess-1.jpg',
      caption: '3년 전의 서기실. 이번 생의 첫 업무가 시작됐다.',
      anchor: '문이 열리고 황태자 카이엔이',
      fallbackAfter: 3,
    },
  ],
  'ep-duchess-1': [
    {
      image: 'images/scenes/wf-duchess-1.jpg',
      caption: '눈을 뚫고, 아주 작은 초록이 올라오고 있었다.',
      anchor: '창문을 열자 유리 지붕이',
      fallbackAfter: 3,
    },
  ],
  'ep-magetower-1': [
    {
      image: 'images/scenes/wf-magetower-1.jpg',
      caption: '대가 조항을 지우겠다는 탑주. 세라는 그 말을 이해하지 못했다.',
      anchor: '마탑 1층에서 기다린 사람은',
      fallbackAfter: 3,
    },
  ],
  'ep-ex-1': [
    {
      image: 'images/scenes/wf-ex-1.jpg',
      caption: '2년 만에, 같은 회의실에서.',
      anchor: '문이 열렸다. 검은 후드에 캡 모자',
      fallbackAfter: 2,
    },
  ],
  'ep-ramen-1': [
    {
      image: 'images/scenes/wf-ramen-1.jpg',
      caption: '새벽 두 시, 복도에서 마주친 옆집 남자.',
      anchor: '엘리베이터 앞에서 옆집 문이',
      fallbackAfter: 3,
    },
  ],
  'ep-ceo-1': [
    {
      image: 'images/scenes/wf-ceo-1.jpg',
      caption: '을: 공란. 회장은 그 자리에 유진을 앉히려 했다.',
      anchor: '을이 비어 있군요',
      fallbackAfter: 2,
    },
  ],
  'ep-academy-ta-1': [
    {
      image: 'images/scenes/wf-academy-ta-1.jpg',
      caption: '3년 전 조교 임용 첫날. 노트는 아직 비어 있었다.',
      anchor: '눈을 뜨니 3년 전',
      fallbackAfter: 3,
    },
  ],
}
