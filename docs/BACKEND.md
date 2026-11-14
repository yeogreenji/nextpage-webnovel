# 백엔드 연결 가이드 (Supabase)

넥스트페이지의 화면 코드는 저장소 구현을 알지 못합니다. 모든 읽기·쓰기는
`src/lib/repository.ts`의 `NovelRepository` 인터페이스를 지나가므로, 서버를 붙이는 일은
**구현 하나를 추가하고 `getRepository()`가 그것을 돌려주게 하는 것**으로 끝납니다.

현재 기본값은 `LocalRepository`(이 브라우저의 `localStorage`)입니다. 그래서 지금은 투표가
기기별로 집계됩니다. 여러 독자가 같은 비율을 함께 보려면 아래 스키마로 서버 집계를 붙이세요.

---

## 1. 테이블

```sql
-- 작품
create table public.novels (
  id            text primary key,
  title         text not null,
  tagline       text not null default '',
  synopsis      text not null default '',
  genres        text[] not null default '{}',
  pen_name      text not null,
  cover         jsonb not null default '{}'::jsonb,   -- { from, to, glyph }
  start_episode_id text,
  status        text not null default 'ongoing' check (status in ('ongoing', 'completed')),
  created_at    timestamptz not null default now()
);

-- 회차 = 분기 트리의 노드
create table public.episodes (
  id                text primary key,
  novel_id          text not null references public.novels (id) on delete cascade,
  no                int  not null,
  title             text not null,
  body              text not null default '',
  parent_episode_id text references public.episodes (id) on delete set null,
  branch_label      text,
  status            text not null default 'published' check (status in ('published', 'pending')),
  vote_closes_at    timestamptz,
  published_at      timestamptz not null default now(),
  unique (novel_id, no, branch_label)
);
create index episodes_novel_idx on public.episodes (novel_id, no);

-- 선택지 = 트리의 간선
create table public.choices (
  id                text primary key,
  episode_id        text not null references public.episodes (id) on delete cascade,
  label             text not null,
  hint              text not null default '',
  target_episode_id text references public.episodes (id) on delete set null,
  position          int  not null check (position in (0, 1)),  -- 0 = A, 1 = B
  constraint choices_unique_position unique (episode_id, position)
);

-- 표 (한 사람이 한 회차에 한 번)
create table public.votes (
  id          uuid primary key default gen_random_uuid(),
  episode_id  text not null references public.episodes (id) on delete cascade,
  choice_id   text not null references public.choices (id) on delete cascade,
  voter_key   text not null,                 -- 익명 세션 uid 또는 기기 키
  created_at  timestamptz not null default now(),
  unique (episode_id, voter_key)
);
create index votes_episode_idx on public.votes (episode_id);

-- 한 줄 댓글
create table public.comments (
  id          uuid primary key default gen_random_uuid(),
  novel_id    text not null references public.novels (id) on delete cascade,
  episode_id  text not null references public.episodes (id) on delete cascade,
  author      text not null default '익명 독자',
  body        text not null check (char_length(body) <= 120),
  likes       int  not null default 0,
  created_at  timestamptz not null default now()
);
create index comments_episode_idx on public.comments (episode_id, created_at desc);

-- 집계 뷰: 화면의 VoteTally 와 1:1
create view public.choice_tallies as
select c.id as choice_id,
       c.episode_id,
       count(v.id) as votes
from public.choices c
left join public.votes v on v.choice_id = c.id
group by c.id, c.episode_id;
```

## 2. RLS (익명 독자 허용)

```sql
alter table public.novels   enable row level security;
alter table public.episodes enable row level security;
alter table public.choices  enable row level security;
alter table public.votes    enable row level security;
alter table public.comments enable row level security;

-- 읽기는 모두 공개
create policy read_novels   on public.novels   for select using (true);
create policy read_episodes on public.episodes for select using (true);
create policy read_choices  on public.choices  for select using (true);
create policy read_votes    on public.votes    for select using (true);
create policy read_comments on public.comments for select using (true);

-- 익명 세션도 자기 표만 넣을 수 있다
create policy insert_own_vote on public.votes
  for insert to authenticated
  with check (voter_key = auth.uid()::text);

-- 댓글은 로그인(익명 포함) 사용자만, 120자 제한은 테이블 check 로 이미 보장
create policy insert_comment on public.comments
  for insert to authenticated
  with check (true);

-- 집계는 노출하지 않고 뷰로만 읽는다
grant select on public.choice_tallies to anon, authenticated;
```

Supabase 대시보드에서 **Authentication → Providers → Anonymous sign-ins** 를 켜면, 방문자마다
로그인 없이 `auth.uid()`가 생겨 “기기당 1표”를 서버에서 강제할 수 있습니다.

> 현재 저장소의 `LocalRepository`는 `unique (episode_id, voter_key)` 같은 서버 제약이 없으므로,
> 기기 저장소를 지우면 다시 투표할 수 있습니다. 서버 연결 시 이 제약이 그 구멍을 막습니다.

## 3. 저장소 구현 매핑

| `NovelRepository` | Supabase 호출 |
| --- | --- |
| `load()` | `novels`, `episodes (+choices)`, `comments`, `votes`, `choice_tallies` select |
| `saveEpisode(ep)` | `episodes` upsert + `choices` upsert (`position` 0/1) |
| `saveVote(vote)` | `votes` upsert on `(episode_id, voter_key)` |
| `addComment(c)` | `comments` insert |
| `updateComment(c)` | `comments` update `likes` |
| `saveSettings(s)` | 클라이언트 저장 유지(서버 불필요) — `localStorage` 그대로 |
| `reset()` | 이 기기의 `votes.voter_key` 기준 삭제 요청(또는 로컬 캐시만 비우기) |

스켈레톤:

```ts
// src/lib/supabase-repository.ts
import type { NovelRepository, Snapshot } from './repository'

const headers = (key: string) => ({
  apikey: key,
  Authorization: `Bearer ${key}`,
  'Content-Type': 'application/json',
})

export class SupabaseRepository implements NovelRepository {
  constructor(private url: string, private key: string, private voterKey: string) {}

  private async rest<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${this.url}/rest/v1/${path}`, { ...init, headers: headers(this.key) })
    if (!res.ok) throw new Error(`supabase ${res.status}: ${await res.text()}`)
    return (await res.json()) as T
  }

  async load(): Promise<Snapshot> {
    const [novels, episodes, choices, comments, votes] = await Promise.all([
      this.rest('novels?select=*'),
      this.rest('episodes?select=*&order=novel_id,no'),
      this.rest('choices?select=*&order=position'),
      this.rest('comments?select=*&order=created_at.desc'),
      this.rest(`votes?select=*&voter_key=eq.${this.voterKey}`),
    ])
    // ... 스키마 snake_case → 도메인 타입 매핑, choice.votes 는 집계 뷰에서 채움
    return { /* ... */ } as Snapshot
  }

  // saveEpisode / saveVote / addComment / updateComment / reset 도 같은 방식
}
```

`src/lib/repository.ts`의 팩토리만 바꿉니다.

```ts
export function getRepository(): NovelRepository {
  if (!cached) {
    const url = import.meta.env.VITE_SUPABASE_URL
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY
    cached = url && key
      ? new SupabaseRepository(url, key, voterKey())
      : new LocalRepository()
  }
  return cached
}
```

## 4. 실시간 집계

투표 직후 비율이 다른 독자에게도 반영되게 하려면 `votes` 테이블을 구독합니다.

```ts
supabase
  .channel('votes')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'votes' }, (payload) => {
    // choiceId 별 카운트만 +1 (전체 재조회 없이)
  })
  .subscribe()
```

트래픽이 늘면 `votes` insert마다 집계 테이블(`choice_tallies`)을 갱신하는 트리거나
Edge Function을 두고, 클라이언트는 그 값만 구독하는 편이 안전합니다.

## 5. 마감 처리

회차의 `vote_closes_at`이 지나면

1. `choice_tallies`에서 1위 선택지를 확정하고,
2. 그 선택지의 `target_episode_id` 회차를 `published`로 열고,
3. 나머지 선택지의 루트는 “미채택”으로 남깁니다(읽기는 가능).

이 판정은 클라이언트가 아니라 서버(Edge Function + `pg_cron`)에서 한 번만 수행해야
모든 독자가 같은 루트를 보게 됩니다. 현재 프런트엔드는 마감 시각이 지나면 투표 버튼을 닫고
결과만 보여 주는 상태까지 구현되어 있습니다.
