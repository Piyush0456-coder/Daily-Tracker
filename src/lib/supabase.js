import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey && !url.includes('YOUR-PROJECT'))

// The app can run in UI-demo mode until Stage 2 environment values are added.
export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null