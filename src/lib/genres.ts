import type { Novel } from '../types'

/**
 * 장르 분류.
 * - 작품 수가 15편을 넘어서면서 세부 태그만으로는 목록이 답답해져,
 *   '대표 장르(그룹)' → '세부 태그' 두 단계로 탐색할 수 있게 했습니다.
 * - 작품의 genres 중 하나라도 그룹에 속하면 그 그룹에 노출됩니다.
 */
export interface GenreGroup {
  name: string
  genres: string[]
}

export const GENRE_GROUPS: GenreGroup[] = [
  {
    name: '로맨스',
    genres: [
      '로맨스',
      '계약 결혼',
      '캠퍼스 로맨스',
      '연예계 로맨스',
      '사내 연애',
      '오피스 로코',
      '로맨틱 코미디',
      '청춘',
    ],
  },
  { name: '로맨스 판타지', genres: ['로맨스 판타지', '궁중 로맨스', '회귀'] },
  { name: '판타지', genres: ['판타지', '이세계', '마법 아카데미', '성장'] },
  { name: '무협', genres: ['무협', '정통 무협', '액션'] },
  { name: 'SF', genres: ['SF', '사이버펑크', '디스토피아'] },
  { name: '미스터리·스릴러', genres: ['미스터리', '스릴러', '심리 스릴러', '밀실 추리', '단편'] },
  { name: '오컬트', genres: ['오컬트', '현대 오컬트', '코미디'] },
  {
    name: '드라마·힐링',
    genres: ['힐링', '감성', '현대물', '드라마', '회귀물', '재벌', '사이다'],
  },
]

/** 작품이 속한 대표 장르 그룹 (첫 번째로 매칭되는 그룹) */
export function novelGroup(novel: Novel): string {
  for (const group of GENRE_GROUPS) {
    if (novel.genres.some((genre) => group.genres.includes(genre))) return group.name
  }
  return '기타'
}

/** 작품에 붙은 세부 태그 */
export function novelTags(novel: Novel): string[] {
  return novel.genres
}

/** 작품이 해당 대표 장르에 속하는지 (세부 태그 중 하나라도 걸리면 소속) */
export function inGroup(novel: Novel, group: string): boolean {
  if (group === '전체') return true
  const target = GENRE_GROUPS.find((item) => item.name === group)
  if (!target) return false
  return novel.genres.some((genre) => target.genres.includes(genre))
}

/** 그룹 안의 세부 태그 목록 (작품 수 많은 순) */
export function tagsOfGroup(novels: Novel[], group: string): string[] {
  const pool = novels.filter((novel) => inGroup(novel, group))

  const counts = new Map<string, number>()
  pool.forEach((novel) => {
    novel.genres.forEach((genre) => counts.set(genre, (counts.get(genre) ?? 0) + 1))
  })
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ko'))
    .map(([genre]) => genre)
}

/** 검색어 매칭 — 제목·필명·태그·한 줄 소개 */
export function matchesQuery(novel: Novel, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [novel.title, novel.penName, novel.tagline, ...novel.genres]
    .join(' ')
    .toLowerCase()
    .includes(q)
}

/* ───────────────────────── 무드(분위기) 탐색 ───────────────────────── */

export interface Mood {
  name: string
  glyph: string
  /** 이 무드에 걸리는 장르 */
  genres: string[]
  /** 장르가 없어도 걸리는 문장 키워드 */
  keywords: string[]
}

/**
 * 상용 플랫폼의 '무드' 큐레이션.
 * — 장르만으로는 잡히지 않는 취향(설렘·찌릿·먹먹·웃음·긴장·힐링)으로 작품을 고릅니다.
 * — 장르 또는 시놉시스·한 줄 소개의 키워드로 판정합니다.
 */
export const MOODS: Mood[] = [
  {
    name: '설렘 폭발',
    glyph: '💗',
    genres: ['로맨스', '로맨틱 코미디', '캠퍼스 로맨스', '연하 로맨스', '재회 로맨스', '사내 연애'],
    keywords: ['설렘', '심장', '고백', '첫사랑'],
  },
  {
    name: '심장 찌릿',
    glyph: '🫀',
    genres: ['계약 결혼', '오피스 로맨스', '로맨스 판타지', '궁중 로맨스'],
    keywords: ['계약', '이혼', '거리', '온도'],
  },
  {
    name: '눈물 한 방울',
    glyph: '💧',
    genres: ['드라마', '감성', '힐링'],
    keywords: ['마지막', '기억', '그리움', '빚'],
  },
  {
    name: '웃음 보장',
    glyph: '😆',
    genres: ['로맨틱 코미디', '오피스 로코', '코미디'],
    keywords: ['야근', '식빵', '라면', '말실수'],
  },
  {
    name: '숨죽인 긴장',
    glyph: '🕯️',
    genres: ['미스터리', '스릴러', '심리 스릴러', '밀실 추리', '오컬트'],
    keywords: ['택배', '의자', '3층', '기록'],
  },
  {
    name: '밤의 힐링',
    glyph: '🌙',
    genres: ['힐링', '감성', '현대물', '드라마'],
    keywords: ['새벽', '온실', '라면', '고양이', '차'],
  },
]

/** 작품에 걸리는 무드 이름들 */
export function moodsOf(novel: Novel): string[] {
  const text = [novel.title, novel.tagline, novel.synopsis].join(' ')
  return MOODS.filter(
    (mood) =>
      novel.genres.some((genre) => mood.genres.includes(genre)) ||
      mood.keywords.some((keyword) => text.includes(keyword)),
  ).map((mood) => mood.name)
}

export function inMood(novel: Novel, moodName: string): boolean {
  if (moodName === '전체') return true
  return moodsOf(novel).includes(moodName)
}

/** 상용 플랫폼형 빠른 기획전 — 대표 장르·세부 태그·무드를 묶은 입구 */
export interface Curation {
  id: string
  title: string
  desc: string
  /** 대표 장르 그룹 */
  group?: string
  /** 세부 태그 (하나라도 걸리면 포함) */
  tags?: string[]
  /** 무드 (하나라도 걸리면 포함) */
  mood?: string
}

/** 기획전은 '걸리는 조건 중 하나'면 노출합니다 (넓게 잡아 빈 목록을 만들지 않습니다). */
export function inCuration(novel: Novel, curation: Curation): boolean {
  const byGroup = curation.group ? inGroup(novel, curation.group) : false
  const byTag = curation.tags ? novel.genres.some((genre) => curation.tags?.includes(genre)) : false
  const byMood = curation.mood ? inMood(novel, curation.mood) : false
  return byGroup || byTag || byMood
}

export const CURATIONS: Curation[] = [
  {
    id: 'romance',
    title: '로맨스',
    desc: '설렘부터 재회까지, 오늘의 심장',
    group: '로맨스',
    tags: ['재회 로맨스', '연하 로맨스', '연예계 로맨스'],
  },
  {
    id: 'fantasy-romance',
    title: '로판',
    desc: '계약·회귀·궁중, 세계관 로맨스',
    group: '로맨스 판타지',
  },
  {
    id: 'office',
    title: '오피스·현대물',
    desc: '회의실과 퇴근길의 로맨스',
    tags: ['오피스 로맨스', '오피스 로코', '사내 연애', '현대 로맨스', '재벌', '계약 결혼'],
  },
  {
    id: 'thriller',
    title: '미스터리·스릴러',
    desc: '한 장면씩 숨을 죽이는 이야기',
    group: '미스터리·스릴러',
  },
]
