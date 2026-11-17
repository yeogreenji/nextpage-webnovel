import type { Character, InlineScene } from '../types'

/**
 * 2026-11 대확충(신작 9편) 일러스트 인덱스.
 * - 표지·히어로·인물 4인·본문 삽화 3컷을 작품별로 묶었습니다.
 * - 모든 인물·작품은 가상이며, 파일은 public/images 아래에 있습니다.
 */
export interface ExpansionArt {
  cover?: string
  hero?: string
  characters?: Character[]
}

export const EXPANSION_ART: Record<string, ExpansionArt> = {
  'nv-marry': {
    cover: 'images/covers/nv-marry.jpg',
    hero: 'images/covers/hero-marry.jpg',
    characters: [
      {
        id: 'ch-marry-jian',
        name: '서지안',
        role: '정헌 법무법인 6년 차 비서',
        tag: '여주',
        badge: '여주',
        quote: '사유는 생존입니다. 그게 제일 중요해요.',
        image: 'images/characters/nv-marry-jian.jpg',
      },
      {
        id: 'ch-marry-jaehyeon',
        name: '한재현',
        role: '변호사 · 대표의 아들',
        tag: '남주',
        badge: '남주',
        quote: '검증된 사람이 필요했습니다. 그 말이 최악인 건 압니다.',
        image: 'images/characters/nv-marry-jaehyeon.jpg',
      },
      {
        id: 'ch-marry-moon',
        name: '문 실장',
        role: '재현의 비서 · 계약 관리인',
        tag: '조연',
        badge: '관리자',
        quote: '제7조는 취향입니다. 제5조는 숫자고요.',
        image: 'images/characters/nv-marry-moon.jpg',
      },
      {
        id: 'ch-marry-sera',
        name: '오세라',
        role: '재현의 오랜 친구 · 갤러리 관장',
        tag: '조연',
        badge: '경쟁자',
        quote: '그 집을 지키는 이유, 본인한테는 말 안 했죠?',
        image: 'images/characters/nv-marry-sera.jpg',
      },
    ],
  },
  'nv-campus': {
    cover: 'images/covers/nv-campus.jpg',
    hero: 'images/covers/hero-campus.jpg',
    characters: [
      {
        id: 'ch-campus-yurim',
        name: '차유림',
        role: '문예창작과 2학년 · 도서관 대출대 알바',
        tag: '여주',
        badge: '여주',
        quote: '이름은 노트 맨 뒤에 쓰는 거예요. 앞장에는 안 써요.',
        image: 'images/characters/nv-campus-yurim.jpg',
      },
      {
        id: 'ch-campus-hangyeol',
        name: '정한결',
        role: '문예창작과 4학년 · 졸업작품 준비',
        tag: '남주',
        badge: '남주',
        quote: '누가 이런 문장을 쓰는 사람인지, 알고 싶었습니다.',
        image: 'images/characters/nv-campus-hangyeol.jpg',
      },
      {
        id: 'ch-campus-sua',
        name: '배수아',
        role: '같은 과 동기 · 유림의 절친',
        tag: '조연',
        badge: '절친',
        quote: '표지 회색이면 우울해 보여. 무슨 일 있어?',
        image: 'images/characters/nv-campus-sua.jpg',
      },
      {
        id: 'ch-campus-jiho',
        name: '문지호',
        role: '문예창작과 교수 · 졸업작품 심사',
        tag: '조연',
        badge: '심사위원',
        quote: '누가 먼저 썼는지보다, 누가 먼저 읽었는지가 소설입니다.',
        image: 'images/characters/nv-campus-jiho.jpg',
      },
    ],
  },
  'nv-idol': {
    cover: 'images/covers/nv-idol.jpg',
    hero: 'images/covers/hero-idol.jpg',
    characters: [
      {
        id: 'ch-idol-dain',
        name: '서다인',
        role: '배우 6년 차 · 첫 주연',
        tag: '여주',
        badge: '여주',
        quote: '주연이 되면 덜 떨릴 줄 알았어요. 떨릴 이유만 늘더라고요.',
        image: 'images/characters/nv-idol-dain.jpg',
      },
      {
        id: 'ch-idol-taegeon',
        name: '강태건',
        role: '새 매니저 · 3년 전 전남친',
        tag: '남주',
        badge: '남주',
        quote: '우산은 두 개입니다. 하나는 다인 씨 것, 하나는 제 것입니다.',
        image: 'images/characters/nv-idol-taegeon.jpg',
      },
      {
        id: 'ch-idol-hana',
        name: '백하나',
        role: '소속사 매니지먼트 팀장',
        tag: '조연',
        badge: '매니지먼트',
        quote: '불편함은 이유가 아니에요. 조건이죠.',
        image: 'images/characters/nv-idol-hana.jpg',
      },
      {
        id: 'ch-idol-yujin',
        name: '도유진',
        role: '같은 드라마 상대역 · 톱배우',
        tag: '조연',
        badge: '경쟁자',
        quote: '첫 주연이면, 카메라 앞에서 숨은 참아야죠.',
        image: 'images/characters/nv-idol-yujin.jpg',
      },
    ],
  },
  'nv-palace': {
    cover: 'images/covers/nv-palace.jpg',
    hero: 'images/covers/hero-palace.jpg',
    characters: [
      {
        id: 'ch-palace-sold',
        name: '이솔드',
        role: '아르넨 황궁 서고 사서 · 두 번째 삶',
        tag: '여주',
        badge: '여주',
        quote: '이번 생의 첫 서명은 사임서로 하겠습니다.',
        image: 'images/characters/nv-palace-sold.jpg',
      },
      {
        id: 'ch-palace-darian',
        name: '다리안',
        role: '아르넨 제국 황제',
        tag: '남주',
        badge: '남주',
        quote: '읽지 않은 계약은, 어긴 계약입니다.',
        image: 'images/characters/nv-palace-darian.jpg',
      },
      {
        id: 'ch-palace-seris',
        name: '세리스',
        role: '황실 근위대장',
        tag: '조연',
        badge: '근위대장',
        quote: '금고에는 계약서 말고도 다른 것이 있습니다.',
        image: 'images/characters/nv-palace-seris.jpg',
      },
      {
        id: 'ch-palace-beatrix',
        name: '베아트리스',
        role: '후작부인 · 궁정의 실권자',
        tag: '조연',
        badge: '정적',
        quote: '사서가 문서를 조작했다고 말하면, 재판은 이틀이면 끝납니다.',
        image: 'images/characters/nv-palace-beatrix.jpg',
      },
    ],
  },
  'nv-rival': {
    cover: 'images/covers/nv-rival.jpg',
    hero: 'images/covers/hero-rival.jpg',
    characters: [
      {
        id: 'ch-rival-seyeong',
        name: '문세영',
        role: '유성백화점 MD팀 과장',
        tag: '여주',
        badge: '여주',
        quote: '이 브랜드는 사람이 유지합니다. 그 사람이 저예요.',
        image: 'images/characters/nv-rival-seyeong.jpg',
      },
      {
        id: 'ch-rival-sian',
        name: '백시안',
        role: '전략MD팀장 · 같은 브랜드의 경쟁자',
        tag: '남주',
        badge: '남주',
        quote: '매출로 싸우면 제가 이깁니다. 객단가로 싸우면 문 과장님이 이깁니다.',
        image: 'images/characters/nv-rival-sian.jpg',
      },
      {
        id: 'ch-rival-gihun',
        name: '노기훈',
        role: 'MD팀 팀장 · 세영의 상사',
        tag: '조연',
        badge: '상사',
        quote: '같이 일하는 사람이랑 되면, 일이 세 배가 돼.',
        image: 'images/characters/nv-rival-gihun.jpg',
      },
      {
        id: 'ch-rival-somi',
        name: '한소미',
        role: '인사팀 · 규정 담당',
        tag: '조연',
        badge: '인사',
        quote: '서약서 네 번째 조항, 읽으셨어요?',
        image: 'images/characters/nv-rival-somi.jpg',
      },
    ],
  },
  'nv-murim': {
    cover: 'images/covers/nv-murim.jpg',
    hero: 'images/covers/hero-murim.jpg',
    characters: [
      {
        id: 'ch-murim-yeonha',
        name: '연하',
        role: '천리표국 막내 배송꾼',
        tag: '여주',
        badge: '여주',
        quote: '표물은 못 내립니다. 표국의 법입니다.',
        image: 'images/characters/nv-murim-yeonha.jpg',
      },
      {
        id: 'ch-murim-mujin',
        name: '무진',
        role: '검을 버린 무인 · 표물로 실려 온 남자',
        tag: '남주',
        badge: '남주',
        quote: '잃은 건 내 검이고, 빌린 검은 쓸 수 있다.',
        image: 'images/characters/nv-murim-mujin.jpg',
      },
      {
        id: 'ch-murim-seolmae',
        name: '설매',
        role: '낙양의 정보상',
        tag: '조연',
        badge: '정보',
        quote: '값을 먼저 말하는 사람이 진짜 값을 압니다.',
        image: 'images/characters/nv-murim-seolmae.jpg',
      },
      {
        id: 'ch-murim-gwak',
        name: '곽대수',
        role: '천리표국 두목',
        tag: '조연',
        badge: '두목',
        quote: '마지막 배송은 막내가 한다. 표국의 법이다.',
        image: 'images/characters/nv-murim-gwak.jpg',
      },
    ],
  },
  'nv-memory': {
    cover: 'images/covers/nv-memory.jpg',
    hero: 'images/covers/hero-memory.jpg',
    characters: [
      {
        id: 'ch-memory-baekro',
        name: '백로',
        role: '세온의 기억 복원사',
        tag: '여주',
        badge: '여주',
        quote: '복원 실패하면 폐기됩니다. 그게 제일 싫은 단어예요.',
        image: 'images/characters/nv-memory-baekro.jpg',
      },
      {
        id: 'ch-memory-ian',
        name: '이안',
        role: '기억 회수인 12년 차',
        tag: '남주',
        badge: '남주',
        quote: '회수인은 칩을 회수하는 사람이지, 폐기하는 사람이 아닙니다.',
        image: 'images/characters/nv-memory-ian.jpg',
      },
      {
        id: 'ch-memory-mei',
        name: '메이',
        role: '세온 하층 해커',
        tag: '조연',
        badge: '해커',
        quote: '언니, 등급 7 뜯으면 관리국이 뜯으러 와.',
        image: 'images/characters/nv-memory-mei.jpg',
      },
      {
        id: 'ch-memory-chief',
        name: '국장',
        role: '기억관리국 세온 지부장',
        tag: '조연',
        badge: '관리국',
        quote: '기억은 재산입니다. 재산은 회수됩니다.',
        image: 'images/characters/nv-memory-chief.jpg',
      },
    ],
  },
  'nv-lodge': {
    cover: 'images/covers/nv-lodge.jpg',
    hero: 'images/covers/hero-lodge.jpg',
    characters: [
      {
        id: 'ch-lodge-jiwoo',
        name: '한지우',
        role: '심리상담사 · 십 년 전 생존자',
        tag: '여주',
        badge: '여주',
        quote: '잊어도 괜찮습니다. 그런데 저는 제 기억에는 그 말을 못 했어요.',
        image: 'images/characters/nv-lodge-jiwoo.jpg',
      },
      {
        id: 'ch-lodge-taeseop',
        name: '윤태섭',
        role: '경찰 · 십 년 전 산악부 부장',
        tag: '남주',
        badge: '남주',
        quote: '여섯 명인데, 왜 일곱 자리죠.',
        image: 'images/characters/nv-lodge-taeseop.jpg',
      },
      {
        id: 'ch-lodge-ina',
        name: '서인아',
        role: '배우 · 십 년 전 산악부',
        tag: '조연',
        badge: '동료',
        quote: '도윤이 목소리야. 나 그 목소리 알아.',
        image: 'images/characters/nv-lodge-ina.jpg',
      },
      {
        id: 'ch-lodge-manseok',
        name: '고만석',
        role: '청솔 산장 관리인 · 도윤의 형',
        tag: '조연',
        badge: '관리인',
        quote: '그날 밤 여기 있었습니다. 제가 마지막으로 본 사람입니다.',
        image: 'images/characters/nv-lodge-manseok.jpg',
      },
    ],
  },
  'nv-occult': {
    cover: 'images/covers/nv-occult.jpg',
    hero: 'images/covers/hero-occult.jpg',
    characters: [
      {
        id: 'ch-occult-mokdan',
        name: '차목단',
        role: '홍보대행사 AE 3년 차 · 퇴마 집안 막내',
        tag: '여주',
        badge: '여주',
        quote: '야근보다 무서운 건 월요일 미팅이에요.',
        image: 'images/characters/nv-occult-mokdan.jpg',
      },
      {
        id: 'ch-occult-haram',
        name: '도하람',
        role: '신입 AE · 입사 3주 차',
        tag: '남주',
        badge: '남주',
        quote: '영원히 야근하는 건 그만둘 수가 없잖아요.',
        image: 'images/characters/nv-occult-haram.jpg',
      },
      {
        id: 'ch-occult-boksil',
        name: '오복실',
        role: '총무팀장 · 이 건물의 규칙을 아는 사람',
        tag: '조연',
        badge: '총무',
        quote: '부적은 사흘치야. 그 안에 이름을 찾아.',
        image: 'images/characters/nv-occult-boksil.jpg',
      },
      {
        id: 'ch-occult-manager',
        name: '3층 과장',
        role: '콘텐츠기획2팀 · 결재 대기 47건',
        tag: '조연',
        badge: '3층',
        quote: '결재 서류가 아직 올라오지 않았습니다.',
        image: 'images/characters/nv-occult-manager.jpg',
      },
    ],
  },
}

/** 신작 선택지 id → 장면 일러스트 */
export const EXPANSION_CHOICE_ART: Record<string, string> = {}

const EXPANSION_KEYS = [
  'marry',
  'campus',
  'idol',
  'palace',
  'rival',
  'murim',
  'memory',
  'lodge',
  'occult',
]

EXPANSION_KEYS.forEach((key) => {
  const n = `ep-${key}`
  const hero = `images/covers/hero-${key}.jpg`
  const cover = `images/covers/nv-${key}.jpg`
  const scene1 = `images/scenes/${n}-1-a.jpg`
  const scene2 = `images/scenes/${n}-2a-a.jpg`
  const scene3 = `images/scenes/${n}-3a-a.jpg`

  EXPANSION_CHOICE_ART[`${n}-1-a`] = scene1
  EXPANSION_CHOICE_ART[`${n}-1-b`] = hero
  EXPANSION_CHOICE_ART[`${n}-2a-a`] = scene2
  EXPANSION_CHOICE_ART[`${n}-2a-b`] = scene1
  EXPANSION_CHOICE_ART[`${n}-2b-a`] = scene1
  EXPANSION_CHOICE_ART[`${n}-2b-b`] = cover
  EXPANSION_CHOICE_ART[`${n}-3a-a`] = scene3
  EXPANSION_CHOICE_ART[`${n}-3a-b`] = hero
})

/** 신작 회차 id → 본문 삽화 */
export const EXPANSION_SCENES: Record<string, InlineScene[]> = {
  'ep-marry-1': [
    {
      image: 'images/scenes/ep-marry-1-a.jpg',
      caption: '새벽 두 시, 계약서 여섯 장. 서명란은 두 칸이었다.',
      anchor: '서명란은 두 칸이었다',
      fallbackAfter: 24,
    },
  ],
  'ep-marry-2a': [
    {
      image: 'images/scenes/ep-marry-2a-a.jpg',
      caption: '벽장 아래 상자에서 나온 십 년 전 사진. 2016년 4월 7일, 청록서점.',
      anchor: '계산대',
      fallbackAfter: 12,
    },
  ],
  'ep-marry-3a': [
    {
      image: 'images/scenes/ep-marry-3a-a.jpg',
      caption: '“감정이 발생했습니다. 그래서 재협상해야 합니다.”',
      anchor: '감정이 발생했습니다',
      fallbackAfter: 20,
    },
  ],
  'ep-campus-1': [
    {
      image: 'images/scenes/ep-campus-1-a.jpg',
      caption: '72번 사물함. 노트 대신 원고 뭉치가 들어 있었다.',
      anchor: '졸업작품_정한결_3고',
      fallbackAfter: 10,
    },
  ],
  'ep-campus-2a': [
    {
      image: 'images/scenes/ep-campus-2a-a.jpg',
      caption: '봄비 내리는 도서관 복도, 원고를 사이에 두고 마주 선 두 사람.',
      anchor: '청록',
      fallbackAfter: 12,
    },
  ],
  'ep-campus-3a': [
    {
      image: 'images/scenes/ep-campus-3a-a.jpg',
      caption: '연구실 창밖으로 비가 그쳤다. 이름이 서류에 적혀 있었다.',
      anchor: '2학년, 차유림',
      fallbackAfter: 16,
    },
  ],
  'ep-idol-1': [
    {
      image: 'images/scenes/ep-idol-1-a.jpg',
      caption: '첫 촬영지, 우산 두 개를 든 새 매니저.',
      anchor: '우산 두 개',
      fallbackAfter: 10,
    },
  ],
  'ep-idol-2b': [
    {
      image: 'images/scenes/ep-idol-2b-a.jpg',
      caption: '리어카 옆, 삼 년 만에 꺼낸 문장.',
      anchor: '내가 낼 수 있었으니까요',
      fallbackAfter: 14,
    },
  ],
  'ep-idol-3a': [
    {
      image: 'images/scenes/ep-idol-3a-a.jpg',
      caption: '새벽 세 시, 우산 두 개가 현관에 세워졌다.',
      anchor: '우산을 들고, 이번에는 두 개',
      fallbackAfter: 16,
    },
  ],
  'ep-palace-1': [
    {
      image: 'images/scenes/ep-palace-1-a.jpg',
      caption: '서고 3층, 눈 내린 마당 같은 냄새. 계약서는 1층 금고에 있었다.',
      anchor: '눈 내린 뒤의 마당 같은 냄새',
      fallbackAfter: 10,
    },
  ],
  'ep-palace-2a': [
    {
      image: 'images/scenes/ep-palace-2a-a.jpg',
      caption: '금고 앞 탁자, 서명 대신 내민 봉인 해제 명령서.',
      anchor: '봉인 해제 명령서',
      fallbackAfter: 22,
    },
  ],
  'ep-palace-3a': [
    {
      image: 'images/scenes/ep-palace-3a-a.jpg',
      caption: '육백 권이 모두 같은 책이었다. 마지막 권은 411년에서 끝났다.',
      anchor: '육백 권이 모두 과거였고',
      fallbackAfter: 8,
    },
  ],
  'ep-rival-1': [
    {
      image: 'images/scenes/ep-rival-1-a.jpg',
      caption: '월요일 아침 9시 40분, 회의실은 언제나 하나뿐이다.',
      anchor: '회의실은 늘 그렇듯 하나뿐이었다',
      fallbackAfter: 4,
    },
  ],
  'ep-rival-2a': [
    {
      image: 'images/scenes/ep-rival-2a-a.jpg',
      caption: '밤 열한 시, 화이트보드에 채워지는 숫자. 삼각김밥 두 개.',
      anchor: '삼각김밥 두 개',
      fallbackAfter: 14,
    },
  ],
  'ep-rival-3a': [
    {
      image: 'images/scenes/ep-rival-3a-a.jpg',
      caption: '사내 연애 금지 규정 네 번째 조항. 6주 뒤에 적용된다.',
      anchor: '동일 부서 및 동일 프로젝트',
      fallbackAfter: 8,
    },
  ],
  'ep-murim-1': [
    {
      image: 'images/scenes/ep-murim-1-a.jpg',
      caption: '마당에 세워진 수레. 그 위에 누운 사람, 검은 옷, 빈손.',
      anchor: '수레 위에는 사람이 누워 있었다',
      fallbackAfter: 26,
    },
  ],
  'ep-murim-2a': [
    {
      image: 'images/scenes/ep-murim-2a-a.jpg',
      caption: '빌린 검을 쥔 무진. 잃은 건 자기 검이었다.',
      anchor: '빌린 검은 쓸 수 있다',
      fallbackAfter: 22,
    },
  ],
  'ep-murim-3a': [
    {
      image: 'images/scenes/ep-murim-3a-a.jpg',
      caption: '바퀴 고정쇠 하나를 쥐고, 처음으로 웃은 무인.',
      anchor: '이거면 된다',
      fallbackAfter: 28,
    },
  ],
  'ep-memory-1': [
    {
      image: 'images/scenes/ep-memory-1-a.jpg',
      caption: '산성비 내리는 세온. 라벨에는 자기 이름이 적혀 있었다.',
      anchor: '소유자: 백로',
      fallbackAfter: 6,
    },
  ],
  'ep-memory-2a': [
    {
      image: 'images/scenes/ep-memory-2a-a.jpg',
      caption: '등급 7 암호를 얼려 여는 새벽. 화면에 47초의 기억.',
      anchor: '복원 시작',
      fallbackAfter: 14,
    },
  ],
  'ep-memory-3a': [
    {
      image: 'images/scenes/ep-memory-3a-a.jpg',
      caption: '3분 12초의 영상. 이름 하나가 남았다. 서연.',
      anchor: '서연. 네가 제일 좋아하는 이름',
      fallbackAfter: 8,
    },
  ],
  'ep-lodge-1': [
    {
      image: 'images/scenes/ep-lodge-1-a.jpg',
      caption: '여섯 명이 앉을 자리, 일곱 개의 의자, 물방울이 맺힌 잔.',
      anchor: '일곱 번째 의자 앞에도 잔이',
      fallbackAfter: 16,
    },
  ],
  'ep-lodge-2a': [
    {
      image: 'images/scenes/ep-lodge-2a-a.jpg',
      caption: '식탁 위에 펼쳐진 명단. 마지막으로 본 시각이 사람마다 달랐다.',
      anchor: '같은 밤을 여섯 명이 다르게 기억하고 있었다',
      fallbackAfter: 14,
    },
  ],
  'ep-lodge-3a': [
    {
      image: 'images/scenes/ep-lodge-3a-a.jpg',
      caption: '눈이 그친 새벽 세 시, 현관 앞의 발자국.',
      anchor: '발자국의 크기가 자기 신발과 같았다',
      fallbackAfter: 26,
    },
  ],
  'ep-occult-1': [
    {
      image: 'images/scenes/ep-occult-1-a.jpg',
      caption: '금요일 밤 열한 시, 내선 3001.',
      anchor: '내선 3001',
      fallbackAfter: 20,
    },
  ],
  'ep-occult-2a': [
    {
      image: 'images/scenes/ep-occult-2a-a.jpg',
      caption: '스무 개의 모니터가 같은 화면을 띄우고 있었다. 결재 대기 47건.',
      anchor: '결재 대기 목록',
      fallbackAfter: 8,
    },
  ],
  'ep-occult-3a': [
    {
      image: 'images/scenes/ep-occult-3a-a.jpg',
      caption: '금요일 자정까지 남은 시간. 복합기 위의 서류 47장.',
      anchor: '47장의 서류를 복합기에서 뽑았다',
      fallbackAfter: 24,
    },
  ],
}
