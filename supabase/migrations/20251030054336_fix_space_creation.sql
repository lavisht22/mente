drop function if exists "public"."insert_space_user"(sid uuid, uid uuid);

alter table "public"."spaces" alter column "user_id" set default auth.uid();

drop policy "SELECT" on "public"."spaces";

create policy "SELECT"
on "public"."spaces"
as permissive
for select
to authenticated
using ((is_space_reader(id, ( SELECT auth.uid() AS uid)) OR (auth.uid() = user_id)));