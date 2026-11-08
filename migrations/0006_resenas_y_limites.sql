-- Reseñas con correo, foto y consentimientos; límite diario de imágenes por usuaria.
-- Seguro de repetir.

alter table opiniones add column if not exists email text not null default '';
alter table opiniones add column if not exists name text not null default '';
alter table opiniones add column if not exists photo text not null default '';
alter table opiniones add column if not exists look text not null default '';
alter table opiniones add column if not exists consent_data boolean not null default false;
alter table opiniones add column if not exists consent_publish boolean not null default false;

create table if not exists image_usage (
  client text not null,
  day date not null default current_date,
  count integer not null default 0,
  primary key (client, day)
);
