-- Fase de testeo: opiniones de las usuarias y control de coste de imágenes.
-- Safe to re-run.

create table if not exists feedback (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  rating integer not null check (rating between 1 and 5),
  tags text not null default '',
  comment text not null default '',
  situation text not null default '',
  look text not null default '',
  source text not null default ''
);

create table if not exists image_usage (
  client text not null,
  day date not null default current_date,
  count integer not null default 0,
  primary key (client, day)
);
