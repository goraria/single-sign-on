import { isProduction, supabaseAnonKey, supabaseServiceRoleKey, supabaseUrl } from "@/lib/utils/environment"
import {
  createClient as createBrowserClient,
  SupabaseClient
} from '@gorth/structure/cores/supabase/index'

export function createUpload(): SupabaseClient {
  const supabase = createBrowserClient(
    supabaseUrl!,
    supabaseServiceRoleKey!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  return supabase
}
