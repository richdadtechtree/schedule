-- push_subscriptions table
create table if not exists push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  created_at  timestamptz default now()
);

create index if not exists push_subscriptions_user_id_idx on push_subscriptions(user_id);

alter table push_subscriptions enable row level security;

create policy "own subscriptions" on push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── pg_cron 설정 ──────────────────────────────────────────────────────────────
-- 사전 조건:
--   1. Supabase 대시보드 → Database → Extensions → pg_cron 활성화
--   2. pg_net 활성화 (기본 활성화 상태)
--   3. 아래 SERVICE_ROLE_KEY를 실제 값으로 교체 후 실행
--      (Supabase 대시보드 → Settings → API → service_role key)

-- 1분마다 실행: 15분 전 + 정시 알림
select cron.schedule(
  'vibe-minute-check',
  '* * * * *',
  $cron$
  select net.http_post(
    url     := 'https://phdyeiznernpuywsfcme.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    ),
    body    := '{"trigger":"minute_check"}'::jsonb
  );
  $cron$
);

-- 매일 06:00 KST (= 21:00 UTC 전날) 실행: 시간 없는 일정 묶음 알림
select cron.schedule(
  'vibe-daily-summary',
  '0 21 * * *',
  $cron$
  select net.http_post(
    url     := 'https://phdyeiznernpuywsfcme.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    ),
    body    := '{"trigger":"daily_summary"}'::jsonb
  );
  $cron$
);
