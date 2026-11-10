-- Looks que cada usuaria elige: su foto maquillada y el tutorial para repetirlo.
-- Seguro de repetir.

create table if not exists saved_looks (
  id text primary key,
  user_id text not null,
  created_at timestamptz not null default now(),
  situation text not null,
  look text not null,
  image text not null,
  steps jsonb not null default '[]'::jsonb
);

create index if not exists saved_looks_user_idx on saved_looks (user_id, created_at desc);
