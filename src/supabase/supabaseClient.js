import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  "https://remlzqxniobtijqylbcp.supabase.co";

const supabaseKey =
  "sb_publishable_aCiQpy8__lbpaAIk7bJ3jA__tEHX9Nw";

export const supabase =
  createClient(
    supabaseUrl,
    supabaseKey
  );