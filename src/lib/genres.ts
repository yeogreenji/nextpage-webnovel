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
