alter table "public"."chats" drop column "model";

alter table "public"."chats" add column "config" jsonb not null default '{}'::jsonb;



