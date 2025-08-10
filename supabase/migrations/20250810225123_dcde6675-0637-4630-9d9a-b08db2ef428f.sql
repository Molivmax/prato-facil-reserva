-- Create public storage bucket for product images (idempotent)
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Recreate policies to ensure correct access
-- Public read
drop policy if exists "Public read access for product-images" on storage.objects;
create policy "Public read access for product-images"
on storage.objects for select
using (bucket_id = 'product-images');

-- Authenticated upload
drop policy if exists "Authenticated users can upload to product-images" on storage.objects;
create policy "Authenticated users can upload to product-images"
on storage.objects for insert
with check (
  bucket_id = 'product-images'
  and auth.role() = 'authenticated'
);

-- Owner update
drop policy if exists "Users can update own product-images" on storage.objects;
create policy "Users can update own product-images"
on storage.objects for update
using (
  bucket_id = 'product-images'
  and owner = auth.uid()
);

-- Owner delete
drop policy if exists "Users can delete own product-images" on storage.objects;
create policy "Users can delete own product-images"
on storage.objects for delete
using (
  bucket_id = 'product-images'
  and owner = auth.uid()
);
