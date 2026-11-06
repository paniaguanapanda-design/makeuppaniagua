-- Las opiniones anteriores siguen siendo privadas y sin consentimiento.
alter table opiniones
  add column if not exists display_name text,
  add column if not exists contact_email text,
  add column if not exists photo_data_url text,
  add column if not exists publication_consent boolean not null default false,
  add column if not exists consent_at timestamptz,
  add column if not exists consent_version text,
  add column if not exists consent_text text,
  add column if not exists publication_status text not null default 'private';

alter table opiniones add constraint opiniones_publication_status_check
  check (publication_status in ('private', 'pending', 'approved', 'rejected'));
alter table opiniones add constraint opiniones_publication_consent_check
  check (
    (publication_status not in ('pending', 'approved') or
      (publication_consent and nullif(trim(display_name), '') is not null
        and nullif(trim(comment), '') is not null and consent_at is not null
        and consent_version is not null and consent_text is not null))
    and (photo_data_url is null or publication_consent)
  );
