-- Public bucket for the Vision PDF. The site download reads it. The publishable key may upload this one bucket.
insert into storage.buckets (id, name, public, file_size_limit)
values ('whitepaper', 'whitepaper', true, 52428800)
on conflict (id) do update set public = true, file_size_limit = 52428800;

drop policy if exists "whitepaper public read" on storage.objects;
create policy "whitepaper public read"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'whitepaper');

drop policy if exists "whitepaper anon insert" on storage.objects;
create policy "whitepaper anon insert"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'whitepaper');

drop policy if exists "whitepaper anon update" on storage.objects;
create policy "whitepaper anon update"
on storage.objects for update
to anon, authenticated
using (bucket_id = 'whitepaper');
