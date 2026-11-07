-- Reseñas: para mejorar el servicio y, si la clienta lo autoriza, publicarlas.
-- Safe to re-run.

alter table feedback add column if not exists name text not null default '';
alter table feedback add column if not exists email text not null default '';
alter table feedback add column if not exists photo text not null default '';
alter table feedback add column if not exists look_image text not null default '';
alter table feedback add column if not exists consent_data boolean not null default false;
alter table feedback add column if not exists consent_publish boolean not null default false;
