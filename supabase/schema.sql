-- ════════════════════════════════════════════════════════════════════
--  RoadQuest NSW — Supabase database schema
--  Paste this whole file into Supabase → SQL Editor → New query → Run.
--  Safe to run more than once.
-- ════════════════════════════════════════════════════════════════════
--  Security model
--  • Players sign in with Supabase ANONYMOUS auth (no password).
--  • The browser can only READ public leaderboard data and its OWN private rows.
--  • ALL writes (registration, scores, purchases, progress) go through the
--    Next.js server routes using the service-role key, which re-grade answers
--    on the server. Browsers have NO insert/update/delete permissions.
--  • First name + surname live in `profile_private`, readable only by the owner.
-- ════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ─── Public profile (username + suburb + game stats) ───────────────
create table if not exists public.profiles (
  id                  uuid primary key references auth.users (id) on delete cascade,
  username            text not null,
  username_lowercase  text generated always as (lower(username)) stored,
  suburb              text not null,
  suburb_key          text generated always as (lower(regexp_replace(btrim(suburb), '\s+', ' ', 'g'))) stored,
  level               integer not null default 1,
  xp                  bigint  not null default 0,
  coins               bigint  not null default 0,
  coins_earned        bigint  not null default 0,
  skill_rating        numeric(8,2) not null default 1000,
  weekly_points       bigint  not null default 0,  -- convenience copy; authoritative per-week totals are in weekly_scores
  lifetime_points     bigint  not null default 0,
  questions_answered  integer not null default 0,
  questions_correct   integer not null default 0,
  current_streak      integer not null default 0,
  best_streak         integer not null default 0,
  selected_car_id     text not null default 'zippy',
  car_color           text,
  created_at          timestamptz not null default now(),
  last_seen           timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[A-Za-z0-9_]{3,20}$'),
  constraint profiles_suburb_length check (char_length(suburb) between 2 and 40),
  constraint profiles_username_lowercase_key unique (username_lowercase)
);

create index if not exists profiles_lifetime_idx on public.profiles (lifetime_points desc);
create index if not exists profiles_skill_idx    on public.profiles (skill_rating desc);
create index if not exists profiles_xp_idx       on public.profiles (xp desc);
create index if not exists profiles_suburb_idx   on public.profiles (suburb_key);

-- ─── PRIVATE details (never public) ────────────────────────────────
create table if not exists public.profile_private (
  user_id     uuid primary key references public.profiles (id) on delete cascade,
  first_name  text not null check (char_length(first_name) between 1 and 40),
  surname     text not null check (char_length(surname) between 1 and 40),
  created_at  timestamptz not null default now()
);

-- ─── Non-competitive progress blob (map, garage, mastery, achievements) ─
create table if not exists public.player_progress (
  user_id     uuid primary key references public.profiles (id) on delete cascade,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

-- ─── Server-issued game sessions (anti-cheat) ──────────────────────
create table if not exists public.game_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  mode          text not null,
  question_ids  text[] not null,
  context       jsonb not null default '{}'::jsonb,
  day_key       text not null,
  status        text not null default 'open' check (status in ('open', 'submitted', 'rejected')),
  started_at    timestamptz not null default now(),
  submitted_at  timestamptz,
  result        jsonb
);
create index if not exists game_sessions_user_idx on public.game_sessions (user_id, started_at desc);
create index if not exists game_sessions_day_idx  on public.game_sessions (user_id, day_key);

-- ─── Every graded answer ───────────────────────────────────────────
create table if not exists public.question_attempts (
  id           bigserial primary key,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  session_id   uuid references public.game_sessions (id) on delete set null,
  question_id  text not null,
  correct      boolean not null,
  ms           integer not null,
  mode         text not null,
  created_at   timestamptz not null default now()
);
create index if not exists question_attempts_user_q_idx on public.question_attempts (user_id, question_id, created_at desc);
create index if not exists question_attempts_created_idx on public.question_attempts (created_at desc);

-- ─── Weekly competition points (one row per player per week) ───────
create table if not exists public.weekly_scores (
  user_id     uuid not null references public.profiles (id) on delete cascade,
  week        text not null,             -- Monday date (Australia/Sydney), e.g. '2026-09-21'
  points      bigint not null default 0,
  updated_at  timestamptz not null default now(),
  primary key (user_id, week)
);
create index if not exists weekly_scores_week_idx on public.weekly_scores (week, points desc);

-- ─── Daily & weekly shared challenges ──────────────────────────────
create table if not exists public.daily_challenges (
  day           text primary key,
  question_ids  text[] not null,
  created_at    timestamptz not null default now()
);
create table if not exists public.daily_results (
  user_id      uuid not null references public.profiles (id) on delete cascade,
  day          text not null,
  score        integer not null,
  correct      integer not null,
  total        integer not null,
  duration_ms  integer not null,
  created_at   timestamptz not null default now(),
  primary key (user_id, day)                -- ONE ranked attempt per player per day
);
create index if not exists daily_results_day_idx on public.daily_results (day, score desc, duration_ms asc);

create table if not exists public.weekly_challenges (
  week          text primary key,
  question_ids  text[] not null,
  created_at    timestamptz not null default now()
);
create table if not exists public.weekly_results (
  user_id      uuid not null references public.profiles (id) on delete cascade,
  week         text not null,
  score        integer not null,
  correct      integer not null,
  total        integer not null,
  duration_ms  integer not null,
  created_at   timestamptz not null default now(),
  primary key (user_id, week)
);
create index if not exists weekly_results_week_idx on public.weekly_results (week, score desc);

-- ─── Reference data (optional mirrors of /data JSON) ──────────────
create table if not exists public.achievements (
  id text primary key, name text not null, description text not null, rarity text not null, icon text
);
create table if not exists public.player_achievements (
  user_id         uuid not null references public.profiles (id) on delete cascade,
  achievement_id  text not null,
  unlocked_at     timestamptz not null default now(),
  primary key (user_id, achievement_id)
);
create table if not exists public.cars (
  id text primary key, name text not null, class text not null, price integer not null default 0, rarity text not null
);
create table if not exists public.player_cars (
  user_id      uuid not null references public.profiles (id) on delete cascade,
  car_id       text not null,
  acquired_at  timestamptz not null default now(),
  primary key (user_id, car_id)
);
create table if not exists public.player_cosmetics (
  user_id      uuid not null references public.profiles (id) on delete cascade,
  item_key     text not null,          -- e.g. 'paints:coral'
  acquired_at  timestamptz not null default now(),
  primary key (user_id, item_key)
);

-- ─── Archive of weekly winners ─────────────────────────────────────
create table if not exists public.weekly_winners (
  week        text not null,
  place       integer not null,
  user_id     uuid references public.profiles (id) on delete set null,
  username    text not null,
  suburb      text not null,
  points      bigint not null,
  top_suburb  text,
  primary key (week, place)
);

-- ════════════════════════════════════════════════════════════════════
--  ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════════════════
alter table public.profiles            enable row level security;
alter table public.profile_private     enable row level security;
alter table public.player_progress     enable row level security;
alter table public.game_sessions       enable row level security;
alter table public.question_attempts   enable row level security;
alter table public.weekly_scores       enable row level security;
alter table public.daily_challenges    enable row level security;
alter table public.daily_results       enable row level security;
alter table public.weekly_challenges   enable row level security;
alter table public.weekly_results      enable row level security;
alter table public.achievements        enable row level security;
alter table public.player_achievements enable row level security;
alter table public.cars                enable row level security;
alter table public.player_cars         enable row level security;
alter table public.player_cosmetics    enable row level security;
alter table public.weekly_winners      enable row level security;

-- Public, non-sensitive reads (leaderboards)
drop policy if exists "public read profiles" on public.profiles;
create policy "public read profiles" on public.profiles for select using (true);
drop policy if exists "public read weekly scores" on public.weekly_scores;
create policy "public read weekly scores" on public.weekly_scores for select using (true);
drop policy if exists "public read daily results" on public.daily_results;
create policy "public read daily results" on public.daily_results for select using (true);
drop policy if exists "public read weekly results" on public.weekly_results;
create policy "public read weekly results" on public.weekly_results for select using (true);
drop policy if exists "public read winners" on public.weekly_winners;
create policy "public read winners" on public.weekly_winners for select using (true);
drop policy if exists "public read daily challenges" on public.daily_challenges;
create policy "public read daily challenges" on public.daily_challenges for select using (true);
drop policy if exists "public read weekly challenges" on public.weekly_challenges;
create policy "public read weekly challenges" on public.weekly_challenges for select using (true);
drop policy if exists "public read achievements" on public.achievements;
create policy "public read achievements" on public.achievements for select using (true);
drop policy if exists "public read cars" on public.cars;
create policy "public read cars" on public.cars for select using (true);

-- Owner-only reads (private)
drop policy if exists "owner reads private" on public.profile_private;
create policy "owner reads private" on public.profile_private for select using (auth.uid() = user_id);
drop policy if exists "owner reads progress" on public.player_progress;
create policy "owner reads progress" on public.player_progress for select using (auth.uid() = user_id);
drop policy if exists "owner reads sessions" on public.game_sessions;
create policy "owner reads sessions" on public.game_sessions for select using (auth.uid() = user_id);
drop policy if exists "owner reads attempts" on public.question_attempts;
create policy "owner reads attempts" on public.question_attempts for select using (auth.uid() = user_id);
drop policy if exists "owner reads achievements" on public.player_achievements;
create policy "owner reads achievements" on public.player_achievements for select using (auth.uid() = user_id);
drop policy if exists "owner reads cars" on public.player_cars;
create policy "owner reads cars" on public.player_cars for select using (auth.uid() = user_id);
drop policy if exists "owner reads cosmetics" on public.player_cosmetics;
create policy "owner reads cosmetics" on public.player_cosmetics for select using (auth.uid() = user_id);

-- No insert/update/delete policies exist for anon/authenticated roles, so the
-- browser cannot change ANY data (including another player's score).
-- Belt and braces: remove write privileges from the public API roles.
revoke insert, update, delete on all tables in schema public from anon, authenticated;

-- ════════════════════════════════════════════════════════════════════
--  SERVER-SIDE FUNCTIONS (called by the Next.js API with the service key)
-- ════════════════════════════════════════════════════════════════════

-- Atomically apply a graded session to a player's stats.
create or replace function public.award_session(
  p_user uuid, p_xp bigint, p_coins bigint, p_points bigint, p_skill numeric,
  p_answered integer, p_correct integer, p_streak integer, p_best_streak integer,
  p_level integer, p_week text
) returns public.profiles
language plpgsql security definer set search_path = public as $$
declare
  r public.profiles;
begin
  update public.profiles set
    xp = xp + greatest(p_xp, 0),
    coins = coins + greatest(p_coins, 0),
    coins_earned = coins_earned + greatest(p_coins, 0),
    lifetime_points = lifetime_points + greatest(p_points, 0),
    skill_rating = greatest(100, p_skill),
    questions_answered = questions_answered + greatest(p_answered, 0),
    questions_correct = questions_correct + greatest(p_correct, 0),
    current_streak = greatest(p_streak, 0),
    best_streak = greatest(best_streak, p_best_streak),
    level = greatest(level, p_level),
    last_seen = now()
  where id = p_user
  returning * into r;

  insert into public.weekly_scores (user_id, week, points, updated_at)
  values (p_user, p_week, greatest(p_points, 0), now())
  on conflict (user_id, week) do update set points = weekly_scores.points + excluded.points, updated_at = now();

  update public.profiles p set weekly_points = w.points from public.weekly_scores w
  where p.id = p_user and w.user_id = p_user and w.week = p_week;

  select * into r from public.profiles where id = p_user;
  return r;
end $$;

-- Atomically spend coins (returns new balance, or -1 if not enough).
create or replace function public.spend_coins(p_user uuid, p_amount bigint)
returns bigint language plpgsql security definer set search_path = public as $$
declare
  bal bigint;
begin
  update public.profiles set coins = coins - p_amount
  where id = p_user and coins >= p_amount and p_amount >= 0
  returning coins into bal;
  return coalesce(bal, -1);
end $$;

-- Weekly leaderboard.
create or replace function public.get_weekly_board(p_week text, p_limit integer default 100)
returns table (user_id uuid, username text, suburb text, level integer, points bigint, car_color text)
language sql stable security definer set search_path = public as $$
  select p.id, p.username, p.suburb, p.level, w.points, p.car_color
  from public.weekly_scores w join public.profiles p on p.id = w.user_id
  where w.week = p_week and w.points > 0
  order by w.points desc, w.updated_at asc
  limit p_limit;
$$;

-- Fair suburb championship: average of the top-N active players' capped weekly
-- points × a small participation bonus. Suburbs below the minimum player count
-- are marked unofficial.
create or replace function public.get_suburb_board(
  p_week text, p_min integer default 3, p_topn integer default 10, p_cap bigint default 3000,
  p_bonus numeric default 0.05, p_maxbonus numeric default 0.5
) returns table (
  suburb text, active_players integer, total_xp bigint, avg_skill integer,
  weekly_points bigint, championship_score integer, official boolean
) language sql stable security definer set search_path = public as $$
  with players as (
    select p.suburb_key, p.suburb, p.xp, p.skill_rating, coalesce(w.points, 0) as pts
    from public.profiles p
    left join public.weekly_scores w on w.user_id = p.id and w.week = p_week
  ),
  ranked as (
    select suburb_key, least(pts, p_cap) as capped,
           row_number() over (partition by suburb_key order by pts desc) as rn
    from players where pts > 0
  ),
  agg as (
    select suburb_key, avg(capped) filter (where rn <= p_topn) as avg_top, count(*) as active
    from ranked group by suburb_key
  ),
  totals as (
    select suburb_key, min(suburb) as suburb, sum(xp)::bigint as total_xp,
           round(avg(skill_rating))::int as avg_skill, sum(pts)::bigint as weekly_points
    from players group by suburb_key
  )
  select t.suburb,
         coalesce(a.active, 0)::int,
         t.total_xp,
         t.avg_skill,
         t.weekly_points,
         round(coalesce(a.avg_top, 0) * (1 + least(p_maxbonus, p_bonus * least(coalesce(a.active, 0), p_topn))))::int,
         coalesce(a.active, 0) >= p_min
  from totals t left join agg a on a.suburb_key = t.suburb_key
  order by (coalesce(a.active, 0) >= p_min) desc, 6 desc, t.weekly_points desc
  limit 300;
$$;

-- A player's global (lifetime points) and suburb rank.
create or replace function public.get_player_ranks(p_user uuid)
returns table (global_rank bigint, suburb_rank bigint)
language sql stable security definer set search_path = public as $$
  with me as (select lifetime_points, suburb_key, created_at from public.profiles where id = p_user)
  select
    (select count(*) + 1 from public.profiles p, me where p.lifetime_points > me.lifetime_points),
    (select count(*) + 1 from public.profiles p, me where p.suburb_key = me.suburb_key and p.lifetime_points > me.lifetime_points)
  from me;
$$;

-- Homepage live statistics.
create or replace function public.get_site_stats(p_day text, p_week text)
returns table (players bigint, answered bigint, daily_players bigint, top_suburb text)
language sql stable security definer set search_path = public as $$
  select
    (select count(*) from public.profiles),
    (select coalesce(sum(questions_answered), 0) from public.profiles),
    (select count(*) from public.daily_results where day = p_day),
    (select s.suburb from public.get_suburb_board(p_week) s where s.official limit 1);
$$;

-- Archive the top 3 players + top suburb of a finished week (idempotent).
create or replace function public.archive_week(p_week text)
returns void language plpgsql security definer set search_path = public as $$
declare
  top_sub text;
begin
  if exists (select 1 from public.weekly_winners where week = p_week) then return; end if;
  select s.suburb into top_sub from public.get_suburb_board(p_week) s where s.official limit 1;
  insert into public.weekly_winners (week, place, user_id, username, suburb, points, top_suburb)
  select p_week, row_number() over (order by b.points desc), b.user_id, b.username, b.suburb, b.points, top_sub
  from public.get_weekly_board(p_week, 3) b
  on conflict do nothing;
end $$;

-- Only the server (service role) may execute these functions.
revoke all on function public.award_session(uuid, bigint, bigint, bigint, numeric, integer, integer, integer, integer, integer, text) from public, anon, authenticated;
revoke all on function public.spend_coins(uuid, bigint) from public, anon, authenticated;
revoke all on function public.archive_week(text) from public, anon, authenticated;
revoke all on function public.get_player_ranks(uuid) from public, anon, authenticated;
grant execute on function public.award_session(uuid, bigint, bigint, bigint, numeric, integer, integer, integer, integer, integer, text) to service_role;
grant execute on function public.spend_coins(uuid, bigint) to service_role;
grant execute on function public.archive_week(text) to service_role;
grant execute on function public.get_player_ranks(uuid) to service_role;
grant execute on function public.get_weekly_board(text, integer) to service_role, anon, authenticated;
grant execute on function public.get_suburb_board(text, integer, integer, bigint, numeric, numeric) to service_role, anon, authenticated;
grant execute on function public.get_site_stats(text, text) to service_role, anon, authenticated;

-- Done! ✔
