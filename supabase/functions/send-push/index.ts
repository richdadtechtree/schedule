import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;

webpush.setVapidDetails('mailto:bbonoyo@gmail.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function sendPushToUser(userId: string, title: string, body: string, tag = 'vibe') {
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', userId);

  if (!subs?.length) return;

  await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title, body, tag, icon: '/icon.png' })
      ).catch(async (err: { statusCode?: number }) => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
        }
      })
    )
  );
}

function kstNow() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const hh = String(kst.getUTCHours()).padStart(2, '0');
  const mm = String(kst.getUTCMinutes()).padStart(2, '0');
  const yyyy = kst.getUTCFullYear();
  const mo = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(kst.getUTCDate()).padStart(2, '0');
  const dow = kst.getUTCDay(); // 0=Sun
  return { time: `${hh}:${mm}`, date: `${yyyy}-${mo}-${dd}`, dow };
}

function addMinutes(timeStr: string, mins: number) {
  const [h, m] = timeStr.split(':').map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

type Task = {
  id: string;
  user_id: string;
  title: string;
  date: string | null;
  time: string | null;
  completed: boolean;
  repeat: string | null;      // 'none' | 'daily' | 'weekly' | 'monthly'
  weekdays: number[] | null;  // [0..6] for weekly repeat
  date_from: string | null;
  date_to: string | null;
};

function isActiveToday(t: Task, date: string, dow: number): boolean {
  if (t.completed) return false;

  if (t.date_from && date < t.date_from) return false;
  if (t.date_to && date > t.date_to) return false;

  const repeat = t.repeat || 'none';
  if (repeat === 'none') return t.date === date;
  if (repeat === 'daily') return true;
  if (repeat === 'weekly') return Array.isArray(t.weekdays) && t.weekdays.includes(dow);
  if (repeat === 'monthly') return t.date?.slice(8, 10) === date.slice(8, 10);
  return false;
}

async function handleMinuteCheck() {
  const { time, date, dow } = kstNow();
  const in15 = addMinutes(time, 15);

  // Fetch all non-completed tasks that have a time set
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, user_id, title, date, time, completed, repeat, weekdays, date_from, date_to')
    .eq('completed', false)
    .not('time', 'is', null)
    .neq('time', '');

  if (!tasks?.length) return;

  // Group by user
  const byUser = new Map<string, { notif15: string[]; notifNow: string[] }>();
  for (const t of tasks as Task[]) {
    if (!isActiveToday(t, date, dow)) continue;
    if (t.time !== in15 && t.time !== time) continue;
    if (!byUser.has(t.user_id)) byUser.set(t.user_id, { notif15: [], notifNow: [] });
    if (t.time === in15) byUser.get(t.user_id)!.notif15.push(t.title);
    if (t.time === time) byUser.get(t.user_id)!.notifNow.push(t.title);
  }

  for (const [userId, { notif15, notifNow }] of byUser) {
    if (notif15.length) await sendPushToUser(userId, '⏰ 15분 후 일정', notif15.join(', '), 'vibe-15min');
    if (notifNow.length) await sendPushToUser(userId, '🔔 지금 일정 시작!', notifNow.join(', '), 'vibe-now');
  }
}

async function handleDailySummary() {
  const { date, dow } = kstNow();

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, user_id, title, date, time, completed, repeat, weekdays, date_from, date_to')
    .eq('completed', false)
    .or('time.is.null,time.eq.');

  if (!tasks?.length) return;

  const byUser = new Map<string, string[]>();
  for (const t of tasks as Task[]) {
    if (!isActiveToday(t, date, dow)) continue;
    if (!byUser.has(t.user_id)) byUser.set(t.user_id, []);
    byUser.get(t.user_id)!.push(t.title);
  }

  for (const [userId, titles] of byUser) {
    const body = titles.slice(0, 5).map(t => `• ${t}`).join('\n') +
      (titles.length > 5 ? `\n외 ${titles.length - 5}개` : '');
    await sendPushToUser(userId, `📋 오늘 일정 ${titles.length}개`, body, 'vibe-daily');
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const trigger = body.trigger || 'minute_check';

    if (trigger === 'minute_check') {
      await handleMinuteCheck();
      return Response.json({ ok: true, trigger });
    }
    if (trigger === 'daily_summary') {
      await handleDailySummary();
      return Response.json({ ok: true, trigger });
    }
    if (trigger === 'direct' && body.user_id) {
      await sendPushToUser(body.user_id, body.title || 'vibe.', body.body || '', body.tag);
      return Response.json({ ok: true, trigger });
    }

    return Response.json({ error: 'unknown trigger' }, { status: 400 });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
});
