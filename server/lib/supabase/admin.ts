import {
  isProduction,
  supabaseAnonKey,
  supabaseServiceRoleKey,
  supabaseUrl,
} from "@/lib/utils/environment"
import {
  createClient as createAdminClient,
  SupabaseClient,
} from "@gorth/structure/cores/supabase/index"

export function createAdmin(): SupabaseClient {
  const supabase = createAdminClient(supabaseUrl!, supabaseServiceRoleKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return supabase
}
