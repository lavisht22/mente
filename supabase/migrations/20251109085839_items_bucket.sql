
  create policy "INSERT 1numdc_0"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'items'::text) AND is_space_writer(( SELECT i.space_id
   FROM items i
  WHERE (i.id = ((storage.foldername(objects.name))[1])::uuid)), auth.uid())));



  create policy "SELECT 1numdc_0"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'items'::text) AND is_space_reader(( SELECT i.space_id
   FROM items i
  WHERE (i.id = ((storage.foldername(objects.name))[1])::uuid)), auth.uid())));



