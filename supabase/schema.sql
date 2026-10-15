-- Arabic Detective · Supabase schema
-- Run this entire file once in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.teacher_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  client_id text not null unique,
  name text not null check (char_length(name) between 2 and 40),
  class_name text not null default '' check (char_length(class_name) <= 20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  client_attempt_id text not null unique,
  student_id uuid not null references public.students(id) on delete cascade,
  case_id text not null,
  case_number integer not null check (case_number > 0),
  case_title text not null,
  attempt_number integer not null default 1 check (attempt_number > 0),
  score integer not null check (score between 0 and 100),
  accuracy double precision not null check (accuracy between 0 and 1),
  correct_count integer not null default 0 check (correct_count >= 0),
  mistake_count integer not null default 0 check (mistake_count >= 0),
  hint_count integer not null default 0 check (hint_count >= 0),
  xp integer not null default 0 check (xp >= 0),
  stars integer not null default 0 check (stars between 0 and 3),
  evidence_found integer not null default 0 check (evidence_found >= 0),
  evidence_total integer not null default 0 check (evidence_total >= 0),
  duration_ms bigint not null default 0 check (duration_ms >= 0),
  started_at timestamptz not null,
  finished_at timestamptz not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists attempts_student_id_idx on public.attempts(student_id);
create index if not exists attempts_finished_at_idx on public.attempts(finished_at desc);
create index if not exists students_class_name_idx on public.students(class_name);

alter table public.teacher_accounts enable row level security;
alter table public.students enable row level security;
alter table public.attempts enable row level security;

create or replace function public.is_teacher()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.teacher_accounts t where t.user_id = auth.uid()
  );
$$;

revoke all on function public.is_teacher() from public;
grant execute on function public.is_teacher() to authenticated;

drop policy if exists "teachers read students" on public.students;
create policy "teachers read students"
on public.students for select
to authenticated
using (public.is_teacher());

drop policy if exists "teachers read attempts" on public.attempts;
create policy "teachers read attempts"
on public.attempts for select
to authenticated
using (public.is_teacher());

create or replace function public.submit_attempt(
  p_client_attempt_id text,
  p_student_client_id text,
  p_student_name text,
  p_class_name text,
  p_case_id text,
  p_case_number integer,
  p_case_title text,
  p_attempt_number integer,
  p_score integer,
  p_accuracy double precision,
  p_correct_count integer,
  p_mistake_count integer,
  p_hint_count integer,
  p_xp integer,
  p_stars integer,
  p_evidence_found integer,
  p_evidence_total integer,
  p_duration_ms bigint,
  p_started_at timestamptz,
  p_finished_at timestamptz,
  p_details jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id uuid;
  v_attempt_id uuid;
begin
  if p_client_attempt_id is null or char_length(p_client_attempt_id) not between 3 and 200 then
    raise exception 'ID percobaan tidak valid';
  end if;
  if p_student_client_id is null or char_length(p_student_client_id) not between 3 and 100 then
    raise exception 'ID siswa tidak valid';
  end if;
  if p_details is not null and pg_column_size(p_details) > 200000 then
    raise exception 'Detail terlalu besar';
  end if;
  if char_length(trim(coalesce(p_student_name, ''))) < 2 or char_length(trim(coalesce(p_student_name, ''))) > 40 then
    raise exception 'Nama siswa tidak valid';
  end if;
  if char_length(coalesce(p_class_name, '')) > 20 then
    raise exception 'Kelas terlalu panjang';
  end if;
  if p_score is null or p_accuracy is null or p_score < 0 or p_score > 100 or p_accuracy < 0 or p_accuracy > 1 then
    raise exception 'Nilai tidak valid';
  end if;
  if p_started_at is null or p_finished_at is null or p_finished_at < p_started_at then
    raise exception 'Rentang waktu tidak valid';
  end if;

  insert into public.students (client_id, name, class_name, updated_at)
  values (p_student_client_id, trim(p_student_name), trim(coalesce(p_class_name, '')), now())
  on conflict (client_id) do update
    set name = excluded.name,
        class_name = excluded.class_name,
        updated_at = now()
  returning id into v_student_id;

  insert into public.attempts (
    client_attempt_id, student_id, case_id, case_number, case_title, attempt_number,
    score, accuracy, correct_count, mistake_count, hint_count, xp, stars,
    evidence_found, evidence_total, duration_ms, started_at, finished_at, details
  ) values (
    p_client_attempt_id, v_student_id, p_case_id, p_case_number, p_case_title, greatest(1, p_attempt_number),
    p_score, p_accuracy, greatest(0, p_correct_count), greatest(0, p_mistake_count),
    greatest(0, p_hint_count), greatest(0, p_xp), greatest(0, least(3, p_stars)),
    greatest(0, p_evidence_found), greatest(0, p_evidence_total), greatest(0, p_duration_ms),
    p_started_at, p_finished_at, coalesce(p_details, '{}'::jsonb)
  )
  on conflict (client_attempt_id) do update
    set score = excluded.score,
        accuracy = excluded.accuracy,
        correct_count = excluded.correct_count,
        mistake_count = excluded.mistake_count,
        hint_count = excluded.hint_count,
        xp = excluded.xp,
        stars = excluded.stars,
        evidence_found = excluded.evidence_found,
        evidence_total = excluded.evidence_total,
        duration_ms = excluded.duration_ms,
        details = excluded.details
  returning id into v_attempt_id;

  return v_attempt_id;
end;
$$;

revoke all on function public.submit_attempt(
  text,text,text,text,text,integer,text,integer,integer,double precision,integer,integer,integer,integer,integer,integer,integer,bigint,timestamptz,timestamptz,jsonb
) from public;
grant execute on function public.submit_attempt(
  text,text,text,text,text,integer,text,integer,integer,double precision,integer,integer,integer,integer,integer,integer,integer,bigint,timestamptz,timestamptz,jsonb
) to anon, authenticated;

-- Idempotency: submit_attempt is keyed by client_attempt_id, so the app may safely re-send the same
-- result any number of times (offline queue, retries): it updates one row, never duplicates it.

-- After creating the teacher account in Authentication > Users,
-- register it once with:
-- insert into public.teacher_accounts(user_id)
-- values ('PASTE-AUTH-USER-UUID-HERE');
