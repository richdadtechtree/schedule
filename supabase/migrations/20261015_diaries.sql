-- diaries table: 하루에 일기 한 편 (사용자별 날짜 1개)
-- 실행 방법: Supabase 대시보드 → SQL Editor → 이 파일 내용을 붙여넣고 Run
create table if not exists diaries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  entry_date  date not null,                 -- 일기 날짜 (예: 2026-10-15)
  title       text not null default '',
  mood        text not null default '',      -- happy / calm / soso / sad / angry / tired
  content     text not null default '',
  -- 2단계(노션 동기화)에서 사용: 노션 페이지 ID와 마지막 동기화 시각
  notion_page_id  text,
  notion_synced_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- 같은 사용자가 같은 날짜에 일기를 두 편 만들지 못하게 막고, upsert의 기준이 됨
  unique (user_id, entry_date)
);

create index if not exists diaries_user_date_idx on diaries(user_id, entry_date desc);

-- 행 단위 보안(RLS): 내 일기는 나만 읽고 쓸 수 있음
alter table diaries enable row level security;

create policy "own diaries" on diaries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
