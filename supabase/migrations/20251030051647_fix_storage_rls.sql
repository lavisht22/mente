drop function if exists "public"."is_chat_reader"(p_chat_id uuid, p_user_id uuid);

drop function if exists "public"."is_chat_writer"(p_chat_id uuid, p_user_id uuid);

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.insert_space_user(sid uuid, uid uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1
    from public.space_user
    where space_id = sid
      and user_id  = uid
      and (role = 'admin' OR role = 'writer')
  );
$function$
;


drop policy "INSERT 1kc463_0" on "storage"."objects";

drop policy "SELECT 1kc463_0" on "storage"."objects";


  create policy "INSERT 1kc463_0"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'chats'::text) AND is_space_writer(( SELECT c.space_id
   FROM chats c
  WHERE (c.id = ((storage.foldername(objects.name))[1])::uuid)), auth.uid())));



  create policy "SELECT 1kc463_0"
  on "storage"."objects"
  as permissive
  for select
  to authenticated, anon
using (((bucket_id = 'chats'::text) AND is_space_reader(( SELECT c.space_id
   FROM chats c
  WHERE (c.id = ((storage.foldername(objects.name))[1])::uuid)), auth.uid())));



