begin;
alter table public.reviews alter column product_id drop not null;
alter table public.reviews
 add column review_date date,
 add column original_url text,
 add column avatar_url text,
 add column language text,
 add column featured boolean not null default false,
 add column published boolean not null default false,
 add column display_order integer not null default 0 check(display_order between 0 and 100000),
 add column deleted_at timestamptz,
 add column external_id text,
 add column external_author_id text,
 add column sync_source text not null default 'manual',
 add column last_synced_at timestamptz;
alter table public.reviews add constraint review_text_length check(length(body) between 1 and 10000 and length(author) between 1 and 160) not valid;
create unique index reviews_external_identity on public.reviews(operator_id,source,external_id) where external_id is not null;
create index reviews_homepage on public.reviews(operator_id,featured desc,display_order,created_at desc,id) where published and deleted_at is null;
create table public.review_settings (
 operator_id uuid primary key references public.operators(id),
 display_limit integer not null default 3 check(display_limit between 3 and 6),
 google_reviews_url text,
 leave_review_url text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.review_settings enable row level security;
revoke all on public.review_settings from public,anon,authenticated;
grant select,insert,update,delete on public.review_settings to service_role;
commit;
