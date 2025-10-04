create table "public"."chunks" (
    "id" uuid not null default gen_random_uuid(),
    "item_id" uuid,
    "created_at" timestamp with time zone not null default now(),
    "content" text not null,
    "embedding" extensions.halfvec(1024)
);


alter table "public"."chunks" enable row level security;

alter table "public"."items" add column "is_embed_pending" boolean not null default false;

CREATE INDEX chunks_embedding_idx ON public.chunks USING hnsw (embedding extensions.halfvec_cosine_ops);

CREATE UNIQUE INDEX embeddings_pkey ON public.chunks USING btree (id);

alter table "public"."chunks" add constraint "embeddings_pkey" PRIMARY KEY using index "embeddings_pkey";

alter table "public"."chunks" add constraint "embeddings_item_id_fkey" FOREIGN KEY (item_id) REFERENCES items(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."chunks" validate constraint "embeddings_item_id_fkey";

grant delete on table "public"."chunks" to "anon";

grant insert on table "public"."chunks" to "anon";

grant references on table "public"."chunks" to "anon";

grant select on table "public"."chunks" to "anon";

grant trigger on table "public"."chunks" to "anon";

grant truncate on table "public"."chunks" to "anon";

grant update on table "public"."chunks" to "anon";

grant delete on table "public"."chunks" to "authenticated";

grant insert on table "public"."chunks" to "authenticated";

grant references on table "public"."chunks" to "authenticated";

grant select on table "public"."chunks" to "authenticated";

grant trigger on table "public"."chunks" to "authenticated";

grant truncate on table "public"."chunks" to "authenticated";

grant update on table "public"."chunks" to "authenticated";

grant delete on table "public"."chunks" to "service_role";

grant insert on table "public"."chunks" to "service_role";

grant references on table "public"."chunks" to "service_role";

grant select on table "public"."chunks" to "service_role";

grant trigger on table "public"."chunks" to "service_role";

grant truncate on table "public"."chunks" to "service_role";

grant update on table "public"."chunks" to "service_role";



