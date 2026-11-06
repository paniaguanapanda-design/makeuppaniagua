-- No photographs or emails are stored in the trial ledger.
create table makeup_trial_credit (
  user_id text primary key references "user"(id),
  used integer not null check (used between 1 and 3)
);
create table makeup_trial (
  id uuid primary key,
  user_id text not null references "user"(id),
  request_id uuid not null,
  situation text not null,
  photo_hash text not null,
  created_at timestamptz not null default now(),
  unique(user_id, request_id)
);
create table makeup_trial_attempt (
  trial_id uuid not null references makeup_trial(id),
  option_id text not null check (option_id in ('piel', 'natural', 'definido')),
  created_at timestamptz not null default now(),
  primary key(trial_id, option_id)
);
