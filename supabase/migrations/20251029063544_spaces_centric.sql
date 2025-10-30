create type "public"."space_user_role" as enum ('admin', 'writer', 'reader');

drop policy "DELETE" on "public"."spaces";

drop policy "DELETE" on "public"."chats";

drop policy "INSERT" on "public"."chats";

drop policy "SELECT" on "public"."chats";

drop policy "UPDATE" on "public"."chats";

drop policy "DELETE" on "public"."items";

drop policy "INSERT" on "public"."items";

drop policy "SELECT" on "public"."items";

drop policy "UPDATE" on "public"."items";

drop policy "DELETE" on "public"."messages";

drop policy "INSERT" on "public"."messages";

drop policy "SELECT" on "public"."messages";

drop policy "UPDATE" on "public"."messages";

drop policy "SELECT" on "public"."spaces";

drop policy "UPDATE" on "public"."spaces";

alter table "public"."chats" drop constraint "chats_user_id_fkey";

alter table "public"."spaces" drop constraint "spaces_user_id_fkey";

create table "public"."space_user" (
    "space_id" uuid not null,
    "user_id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "role" space_user_role not null default 'reader'::space_user_role
);


alter table "public"."space_user" enable row level security;

create table "public"."users" (
    "id" uuid not null,
    "name" text,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."users" enable row level security;

alter table "public"."chats" add column "space_id" uuid not null;

alter table "public"."items" add column "user_id" uuid;

alter table "public"."items" alter column "space_id" set not null;

CREATE UNIQUE INDEX profiles_pkey ON public.users USING btree (id);

CREATE UNIQUE INDEX space_user_pkey ON public.space_user USING btree (space_id, user_id);

alter table "public"."space_user" add constraint "space_user_pkey" PRIMARY KEY using index "space_user_pkey";

alter table "public"."users" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."chats" add constraint "chats_space_id_fkey" FOREIGN KEY (space_id) REFERENCES spaces(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."chats" validate constraint "chats_space_id_fkey";

alter table "public"."chats" add constraint "chats_user_id_fkey1" FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."chats" validate constraint "chats_user_id_fkey1";

alter table "public"."items" add constraint "items_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."items" validate constraint "items_user_id_fkey";

alter table "public"."space_user" add constraint "space_user_space_id_fkey" FOREIGN KEY (space_id) REFERENCES spaces(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."space_user" validate constraint "space_user_space_id_fkey";

alter table "public"."space_user" add constraint "space_user_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."space_user" validate constraint "space_user_user_id_fkey";

alter table "public"."space_user" add constraint "space_user_user_id_fkey1" FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."space_user" validate constraint "space_user_user_id_fkey1";

alter table "public"."users" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."users" validate constraint "profiles_id_fkey";

alter table "public"."spaces" add constraint "spaces_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."spaces" validate constraint "spaces_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.insert_space_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  -- Insert the creator as an admin member of the new space
  insert into public.space_user (space_id, user_id, role)
  values (new.id, new.user_id, 'admin')
  on conflict (space_id, user_id) do nothing;  -- safety if already present
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.insert_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  insert into public.users (id)
  values (new.id)
  on conflict (id) do nothing;  
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.is_space_admin(sid uuid, uid uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select exists (
    select 1
    from public.space_user
    where space_id = sid
      and user_id  = uid
      and role = 'admin'
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_space_reader(sid uuid, uid uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select exists (
    select 1
    from public.space_user
    where space_id = sid
      and user_id  = uid
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_space_writer(sid uuid, uid uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
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

grant delete on table "public"."space_user" to "anon";

grant insert on table "public"."space_user" to "anon";

grant references on table "public"."space_user" to "anon";

grant select on table "public"."space_user" to "anon";

grant trigger on table "public"."space_user" to "anon";

grant truncate on table "public"."space_user" to "anon";

grant update on table "public"."space_user" to "anon";

grant delete on table "public"."space_user" to "authenticated";

grant insert on table "public"."space_user" to "authenticated";

grant references on table "public"."space_user" to "authenticated";

grant select on table "public"."space_user" to "authenticated";

grant trigger on table "public"."space_user" to "authenticated";

grant truncate on table "public"."space_user" to "authenticated";

grant update on table "public"."space_user" to "authenticated";

grant delete on table "public"."space_user" to "service_role";

grant insert on table "public"."space_user" to "service_role";

grant references on table "public"."space_user" to "service_role";

grant select on table "public"."space_user" to "service_role";

grant trigger on table "public"."space_user" to "service_role";

grant truncate on table "public"."space_user" to "service_role";

grant update on table "public"."space_user" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";

create policy "INSERT"
on "public"."space_user"
as permissive
for insert
to authenticated
with check (is_space_admin(space_id, ( SELECT auth.uid() AS uid)));


create policy "SELECT"
on "public"."space_user"
as permissive
for select
to authenticated
using (is_space_reader(space_id, ( SELECT auth.uid() AS uid)));


create policy "UPDATE"
on "public"."space_user"
as permissive
for update
to authenticated
using (is_space_admin(space_id, ( SELECT auth.uid() AS uid)));


create policy "SELECT"
on "public"."users"
as permissive
for select
to authenticated
using (true);


create policy "UPDATE"
on "public"."users"
as permissive
for update
to authenticated
using ((( SELECT auth.uid() AS uid) = id))
with check ((( SELECT auth.uid() AS uid) = id));


create policy "DELETE"
on "public"."chats"
as permissive
for delete
to authenticated
using (is_space_writer(space_id, ( SELECT auth.uid() AS uid)));


create policy "INSERT"
on "public"."chats"
as permissive
for insert
to authenticated
with check (is_space_writer(space_id, ( SELECT auth.uid() AS uid)));


create policy "SELECT"
on "public"."chats"
as permissive
for select
to authenticated
using (is_space_reader(space_id, ( SELECT auth.uid() AS uid)));


create policy "UPDATE"
on "public"."chats"
as permissive
for update
to authenticated
using (is_space_writer(space_id, ( SELECT auth.uid() AS uid)))
with check (is_space_writer(space_id, ( SELECT auth.uid() AS uid)));


create policy "DELETE"
on "public"."items"
as permissive
for delete
to authenticated
using (is_space_writer(space_id, ( SELECT auth.uid() AS uid)));


create policy "INSERT"
on "public"."items"
as permissive
for insert
to authenticated
with check (is_space_writer(space_id, ( SELECT auth.uid() AS uid)));


create policy "SELECT"
on "public"."items"
as permissive
for select
to authenticated
using (is_space_reader(space_id, ( SELECT auth.uid() AS uid)));


create policy "UPDATE"
on "public"."items"
as permissive
for update
to authenticated
using (is_space_writer(space_id, ( SELECT auth.uid() AS uid)))
with check (is_space_writer(space_id, ( SELECT auth.uid() AS uid)));


create policy "DELETE"
on "public"."messages"
as permissive
for delete
to authenticated
using (is_space_writer(( SELECT chats.space_id
   FROM chats
  WHERE (chats.id = messages.chat_id)), ( SELECT auth.uid() AS uid)));


create policy "INSERT"
on "public"."messages"
as permissive
for insert
to authenticated
with check (is_space_writer(( SELECT chats.space_id
   FROM chats
  WHERE (chats.id = messages.chat_id)), ( SELECT auth.uid() AS uid)));


create policy "SELECT"
on "public"."messages"
as permissive
for select
to authenticated
using (is_space_reader(( SELECT chats.space_id
   FROM chats
  WHERE (chats.id = messages.chat_id)), ( SELECT auth.uid() AS uid)));


create policy "UPDATE"
on "public"."messages"
as permissive
for update
to authenticated
using (is_space_writer(( SELECT chats.space_id
   FROM chats
  WHERE (chats.id = messages.chat_id)), ( SELECT auth.uid() AS uid)))
with check (is_space_writer(( SELECT chats.space_id
   FROM chats
  WHERE (chats.id = messages.chat_id)), ( SELECT auth.uid() AS uid)));


create policy "SELECT"
on "public"."spaces"
as permissive
for select
to authenticated
using (is_space_reader(id, ( SELECT auth.uid() AS uid)));


create policy "UPDATE"
on "public"."spaces"
as permissive
for update
to authenticated
using (is_space_admin(id, ( SELECT auth.uid() AS uid)));


CREATE TRIGGER insert_space_user_after_insert_space AFTER INSERT ON public.spaces FOR EACH ROW EXECUTE FUNCTION insert_space_user();


CREATE TRIGGER create_user_after_insert_user AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION insert_user();


