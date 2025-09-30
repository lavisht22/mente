


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "extensions";






CREATE TYPE "public"."item_type" AS ENUM (
    'note'
);


ALTER TYPE "public"."item_type" OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "space_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "type" "public"."item_type" NOT NULL,
    "markdown" "text",
    "title" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."spaces" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" NOT NULL
);


ALTER TABLE "public"."spaces" OWNER TO "postgres";


ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."spaces"
    ADD CONSTRAINT "spaces_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."spaces"
    ADD CONSTRAINT "spaces_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



CREATE POLICY "DELETE" ON "public"."items" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IN ( SELECT "spaces"."user_id"
   FROM "public"."spaces"
  WHERE ("spaces"."id" = "items"."space_id"))));



CREATE POLICY "DELETE" ON "public"."spaces" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "INSERT" ON "public"."items" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IN ( SELECT "spaces"."user_id"
   FROM "public"."spaces"
  WHERE ("spaces"."id" = "items"."space_id"))));



CREATE POLICY "INSERT" ON "public"."spaces" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "SELECT" ON "public"."items" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IN ( SELECT "spaces"."user_id"
   FROM "public"."spaces"
  WHERE ("spaces"."id" = "items"."space_id"))));



CREATE POLICY "SELECT" ON "public"."spaces" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "UPDATE" ON "public"."items" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IN ( SELECT "spaces"."user_id"
   FROM "public"."spaces"
  WHERE ("spaces"."id" = "items"."space_id")))) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IN ( SELECT "spaces"."user_id"
   FROM "public"."spaces"
  WHERE ("spaces"."id" = "items"."space_id"))));



CREATE POLICY "UPDATE" ON "public"."spaces" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."spaces" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
















































































































































































































































































































































































































































































































































GRANT ALL ON TABLE "public"."items" TO "anon";
GRANT ALL ON TABLE "public"."items" TO "authenticated";
GRANT ALL ON TABLE "public"."items" TO "service_role";



GRANT ALL ON TABLE "public"."spaces" TO "anon";
GRANT ALL ON TABLE "public"."spaces" TO "authenticated";
GRANT ALL ON TABLE "public"."spaces" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































RESET ALL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   pg_trigger
        WHERE  tgname = 'enforce_bucket_name_length_trigger'
    ) THEN
        CREATE TRIGGER enforce_bucket_name_length_trigger
        BEFORE INSERT OR UPDATE OF name ON storage.buckets
        FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   pg_trigger
        WHERE  tgname = 'objects_delete_cleanup'
    ) THEN
        CREATE TRIGGER objects_delete_cleanup
        AFTER DELETE ON storage.objects
        REFERENCING OLD TABLE AS deleted
        FOR EACH STATEMENT EXECUTE FUNCTION storage.objects_delete_cleanup();
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   pg_trigger
        WHERE  tgname = 'objects_insert_create_prefix'
    ) THEN
        CREATE TRIGGER objects_insert_create_prefix
        BEFORE INSERT ON storage.objects
        FOR EACH ROW EXECUTE FUNCTION storage.objects_insert_prefix_trigger();
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   pg_trigger
        WHERE  tgname = 'objects_update_cleanup'
    ) THEN
        CREATE TRIGGER objects_update_cleanup
        AFTER UPDATE ON storage.objects
        REFERENCING OLD TABLE AS old_rows NEW TABLE AS new_rows
        FOR EACH STATEMENT EXECUTE FUNCTION storage.objects_update_cleanup();
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   pg_trigger
        WHERE  tgname = 'prefixes_create_hierarchy'
    ) THEN
        CREATE TRIGGER prefixes_create_hierarchy
        BEFORE INSERT ON storage.prefixes
        FOR EACH ROW
        WHEN (pg_trigger_depth() < 1)
        EXECUTE FUNCTION storage.prefixes_insert_trigger();
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   pg_trigger
        WHERE  tgname = 'prefixes_delete_cleanup'
    ) THEN
        CREATE TRIGGER prefixes_delete_cleanup
        AFTER DELETE ON storage.prefixes
        REFERENCING OLD TABLE AS deleted
        FOR EACH STATEMENT EXECUTE FUNCTION storage.prefixes_delete_cleanup();
    END IF;
END;
$$;


