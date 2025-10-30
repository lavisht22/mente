alter table "public"."items" alter column "user_id" set default auth.uid();

alter table "public"."items" alter column "user_id" set not null;



