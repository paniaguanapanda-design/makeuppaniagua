-- Opiniones anónimas de las usuarias para mejorar NEUSTA. Seguro de repetir.
create table if not exists opiniones (
  id bigserial primary key,
  rating integer check (rating between 1 and 5),
  comment text not null default '',
  situation text,
  created_at timestamptz not null default now()
);
