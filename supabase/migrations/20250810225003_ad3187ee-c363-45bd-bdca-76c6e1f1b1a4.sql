-- Create public storage bucket for product images
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Public read access for images
create policy if not exists "Public read access for product-images"
on storage.objects for select
using (bucket_id = 'product-images');

-- Allow authenticated users to upload to the bucket
create policy if not exists "Authenticated users can upload to product-images"
on storage.objects for insert
with check (
  bucket_id = 'product-images'
  and auth.role() = 'authenticated'
);

-- Allow owners to update their own files in the bucket
create policy if not exists "Users can update own product-images"
on storage.objects for update
using (
  bucket_id = 'product-images'
  and owner = auth.uid()
);

-- Allow owners to delete their own files in the bucket
create policy if not exists "Users can delete own product-images"
on storage.objects for delete
using (
  bucket_id = 'product-images'
  and owner = auth.uid()
);
