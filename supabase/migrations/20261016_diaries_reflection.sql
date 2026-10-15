-- diaries 테이블에 회고 항목 4개 추가
-- 실행 방법: Supabase 대시보드 → SQL Editor → 붙여넣고 Run (여러 번 실행해도 안전합니다)
alter table diaries add column if not exists good      text not null default '';  -- 좋았던 점
alter table diaries add column if not exists bad       text not null default '';  -- 아쉬운 점
alter table diaries add column if not exists review    text not null default '';  -- 복기할 점
alter table diaries add column if not exists sorry_kid text not null default '';  -- 아이에게 미안한 점
