// lib/supabase-implicit.ts (ARCHIVO NUEVO)
import { createClient } from '@supabase/supabase-js'

export const supabaseImplicit = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      flowType: 'implicit',
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  }
)