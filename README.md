# 넥스트페이지 (Next Page)

> **다음 화는, 당신이 고른다.**
> 회차 끝에서 독자가 A/B를 고르고, 다수파가 고른 루트로 이야기가 이어지는 **선택형(브랜칭) 웹소설 플랫폼**입니다.

![홈 화면](docs/screenshots/01-home.png)

웹소설을 읽는 일은 원래 일방향입니다. 작가가 쓰고, 독자는 따라갑니다.
넥스트페이지는 그 방향을 한 번 뒤집습니다. 회차가 끝나는 지점마다 두 갈래의 선택지가 열리고,
독자는 **한 표**로 다음 화의 방향을 정합니다. 투표 결과는 즉시 공개되고, 내 선택이 다수파인지
소수파인지 알려 줍니다. 결과는 인스타그램 스토리 규격(1080×1920) 카드로 저장·공유할 수 있습니다.

- 데모 : `npm install && npm run dev`
- 배포 : GitHub Pages 워크플로 포함 (`.github/workflows/deploy.yml`)

---

## 1. 무엇이 들어 있나

### ① 홈 · 작품 피드
진행 중인 작품 카드에 장르 태그, 현재 회차, **투표 마감 카운트다운(1초 갱신)**, 누적 참여자 수가
표시됩니다. 마감이 임박한 투표를 위쪽에 모아 보여 주고, 1위 선택지의 현재 득표율도 함께 노출합니다.

| 홈 (데스크톱) | 홈 (모바일) |
| --- | --- |
| ![home](docs/screenshots/01-home.png) | ![mobile](docs/screenshots/09-mobile.png) |

### ② 몰입형 회차 뷰어 + A/B 실시간 투표
- 본문은 명조 계열 서체, **글자 크기 15~26px** 조절, **라이트 / 세피아 / 다크** 3가지 테마.
  설정은 이 기기에 저장되어 다음 회차에서도 유지됩니다.
- 회차 끝에서 A/B 선택 → **즉시 비율 막대 + “당신은 71% 다수파!” / “소수파!” 배지**.
- 결과 카드 모달: 캔버스로 1080×1920 PNG를 생성해 **이미지 저장 / 클립보드 복사 / 회차 링크 복사**.
- 다수파 루트와 내 루트의 다음 화로 바로 이동하는 링크를 함께 제공합니다.

![리더](docs/screenshots/02-reader.png)

| 투표 전 | 투표 후 |
| --- | --- |
| ![before](docs/screenshots/03-vote-before.png) | ![after](docs/screenshots/04-vote-after.png) |

| 결과 카드 모달 | 다크 테마 |
| --- | --- |
| ![share](docs/screenshots/05-share-modal.png) | ![dark](docs/screenshots/08-dark.png) |

### ③ 분기 트리 시각화
1화 → 2화(채택 루트 / 미채택 루트) → 3화 흐름을 인터랙티브 SVG 노드 트리로 보여 줍니다.
부모 회차가 자식들의 가운데에 놓이도록 배치하고, **채택 루트는 굵은 실선**, 미채택은 가는 선,
아직 쓰이지 않은 회차는 점선 “집필 중”으로 구분합니다. 노드를 누르면 해당 회차로 이동합니다.

![tree](docs/screenshots/06-branch-tree.png)

### ④ 작가 스튜디오
브라우저에서 바로 회차를 씁니다.

- **다음 화 슬롯 채우기** : 독자가 고른 루트에 예약된 빈 회차를 채웁니다(트리 연결 유지).
- **새 회차 추가** : 작품에 새 회차를 덧붙입니다.
- **새 작품 시작** : 작품 정보 + 1화를 한 번에 만듭니다.

발행하면 작품 피드 · 분기 트리 · 회차 목록에 **즉시 반영**되고, 회차 끝에 투표 카드가 열립니다.
오른쪽 미리보기로 읽기 화면을 확인하면서 쓸 수 있습니다.

![studio](docs/screenshots/07-studio.png)

### ⑤ 한 줄 댓글 · 공감
회차마다 한 줄 댓글과 공감(♥)을 남길 수 있습니다. 닉네임은 이 기기에 기억됩니다.

### ⑥ 샘플 콘텐츠 (모두 가상)
바로 플레이할 수 있도록 세 작품을 넣어 두었습니다. 모든 작품·인물·필명은 **가상**입니다.

| 작품 | 필명 | 구성 |
| --- | --- | --- |
| 《월급은 통장을 스칠 뿐, 팀장님은 내 마음을 스친다》 (오피스 로코) | 유채 | 1~3화 + 4화 예약, 2화부터 두 갈래 |
| 《이 계약은 파기 불가입니다》 (로맨스 판타지) | 하루 | 1~2화, 1화에서 두 갈래 |
| 《세 번째 택배는 반송됩니다》 (미스터리) | 윤슬 | 1화 + 2화 두 갈래 집필 중 |

---

## 2. 기술 스택

| 구분 | 사용 |
| --- | --- |
| 코어 | React 19, TypeScript 5.9 (`strict`) |
| 빌드 | Vite 7 |
| 스타일 | Tailwind CSS 4 (`@tailwindcss/vite`) + CSS 변수 기반 3테마 |
| 라우팅 | React Router 7 (`HashRouter` — 정적 호스팅에서 새로고침 안전) |
| 시각화 | 의존성 없는 자체 SVG 트리 레이아웃 |
| 공유 카드 | Canvas 2D (1080×1920 PNG 생성) |
| 저장 | 브라우저 `localStorage` (저장소 인터페이스로 분리) |

외부 UI 라이브러리·아이콘 팩·폰트 CDN 없이 동작합니다.

---

## 3. 시작하기

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 타입 검사 + 프로덕션 빌드 (dist/)
npm run preview  # 빌드 결과 확인
```

- Node 20 이상 권장 (`.nvmrc`: 22)
- `npm run build`는 `tsc --noEmit`을 먼저 실행하므로 타입 오류가 있으면 빌드가 멈춥니다.

## 4. GitHub Pages 배포

1. 이 저장소를 GitHub에 올립니다.
2. **Settings → Pages → Build and deployment → Source: GitHub Actions** 로 설정합니다.
3. `main` 브랜치에 푸시하면 `.github/workflows/deploy.yml`이 빌드·배포합니다.
4. `https://<사용자>.github.io/<저장소>/` 에서 열립니다.

`vite.config.ts`의 `base: './'` 덕분에 프로젝트 페이지 하위 경로에서도 자산 경로가 깨지지 않고,
`HashRouter`라서 상세 회차 URL을 새로고침해도 404가 나지 않습니다.

---

## 5. 데이터 구조

```
Novel ─┬─ Episode ─┬─ Choice ─→ (targetEpisodeId)  ─┐
       │           │                                │  회차 = 트리의 노드
       │           └─ Comment                       │  선택지 = 간선
       └─ genres, penName, cover                     └─ 부모 회차로 역추적
```

- `Episode.parentEpisodeId` 로 트리를 만들고, `Choice.targetEpisodeId` 로 간선을 긋습니다.
- 아직 쓰이지 않은 다음 화는 `status: 'pending'` 회차로 미리 만들어 두고, 스튜디오에서 채웁니다.
- 채택 루트는 별도 저장값이 아니라 **현재 득표 1위**로 계산합니다(투표가 바뀌면 루트 표시도 바뀝니다).

### 저장소 레이어

```ts
// src/lib/repository.ts
export interface NovelRepository {
  load(): Promise<Snapshot>
  saveEpisode(episode: Episode): Promise<void>
  addComment(comment: Comment): Promise<void>
  updateComment(comment: Comment): Promise<void>
  saveVote(vote: VoteRecord): Promise<void>
  saveSettings(settings: ReaderSettings): Promise<void>
  reset(): Promise<void>
}
```

기본 구현은 `LocalRepository`(이 기기 저장)입니다. 서버를 붙일 때는 `getRepository()`가 돌려주는
구현만 바꾸면 화면 코드는 그대로 동작합니다. Supabase 스키마와 RLS 예시는
[docs/BACKEND.md](docs/BACKEND.md)에 정리해 두었습니다.

> 현재 버전은 서버가 없으므로 **투표 집계는 기기별**입니다. 여러 독자가 같은 결과를 함께 보려면
> 백엔드 연결이 필요합니다(README 6번 로드맵 1번).

---

## 6. 폴더 구조

```
src/
├─ components/     Layout, NovelCard, VotePanel, ShareCardModal, BranchTree, CommentSection, ReaderToolbar, Countdown
├─ pages/          Home, Library, Novel, Episode, Tree, Studio, About
├─ store/          StoreProvider (상태 + 저장소 연결)
├─ lib/            repository, vote(집계), tree(레이아웃), format, share-card(캔버스)
├─ data/seed.ts    샘플 작품 3편 (본문·선택지·댓글)
└─ types.ts        도메인 타입
docs/
├─ BACKEND.md      Supabase 스키마 · 저장소 매핑
└─ screenshots/    README 이미지
```

---

## 7. 로드맵

1. **Supabase 연결** — 계정 없는 익명 세션(`auth.signInAnonymously()`)으로 기기당 1표, 실시간 집계 구독.
2. **마감 자동화** — 마감 시각에 1위 루트를 확정하고 다음 화 슬롯을 여는 스케줄러(Edge Function / cron).
3. **작가 인증** — 필명 소유권, 회차 수정 이력, 신고 처리.
4. **투표 알림** — 내가 참여한 회차의 결과 확정 알림.
5. **OG 이미지** — 회차 링크 공유 시 결과 카드가 미리보기로 뜨도록 서버 측 렌더링.

## 8. 라이선스 · 고지

- 코드: [MIT License](LICENSE)
- 수록된 작품·인물·필명은 모두 **가상**이며 실제 인물·단체와 무관합니다.
