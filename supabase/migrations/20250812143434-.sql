-- Reset public data for fresh testing
begin;

-- Remove dependent data first
truncate table public.products restart identity cascade;

-- Then establishments and users tables
truncate table public.establishments restart identity cascade;
truncate table public.users restart identity cascade;

commit;