
-- 1. 게임 기록을 저장할 테이블 생성
create table public.game_records (
  id bigint primary key generated always as identity,
  name text not null,               -- 도전자 이름
  attempts integer not null,        -- 시도 횟수
  time_seconds float8 not null,     -- 소요 시간 (초)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. 테이블 보안 설정 (Row Level Security)
alter table public.game_records enable row level security;

-- 누구나 읽기 가능 정책
create policy "누구나 기록을 볼 수 있음"
  on public.game_records for select
  to anon
  using (true);

-- 누구나 쓰기 가능 정책
create policy "누구나 기록을 추가할 수 있음"
  on public.game_records for insert
  to anon
  with check (true);

-- 3. 인덱스 생성 (시도 횟수 적은 순 -> 시간 짧은 순 정렬 최적화)
create index idx_game_records_ranking on public.game_records (attempts, time_seconds);
