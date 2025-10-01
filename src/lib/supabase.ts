import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../db.types";

const supabase = createClient<Database>(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_API_KEY,
);

export default supabase;
