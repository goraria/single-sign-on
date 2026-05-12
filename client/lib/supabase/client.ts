import { createBrowserClient } from 'gorth-base/cores/supabase-ssr'
import {
  supabaseUrl,
  supabasePublishableKey,
} from "@/lib/environment"

export function createClient() {
  return createBrowserClient(supabaseUrl, supabasePublishableKey)
}
