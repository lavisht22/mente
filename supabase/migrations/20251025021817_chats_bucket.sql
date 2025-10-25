set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.is_chat_reader(p_chat_id uuid, p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM chats
    WHERE id = p_chat_id AND user_id = p_user_id
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_chat_writer(p_chat_id uuid, p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM chats
    WHERE id = p_chat_id AND user_id = p_user_id
  );
END;
$function$
;



  create policy "INSERT 1kc463_0"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'chats'::text) AND is_chat_writer(((storage.foldername(name))[1])::uuid, ( SELECT auth.uid() AS uid))));



  create policy "SELECT 1kc463_0"
  on "storage"."objects"
  as permissive
  for select
  to public
using (((bucket_id = 'chats'::text) AND is_chat_reader(((storage.foldername(name))[1])::uuid, ( SELECT auth.uid() AS uid))));



