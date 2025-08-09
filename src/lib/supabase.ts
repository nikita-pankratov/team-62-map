import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable')
}

if (!supabaseKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable')
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Types for our database
export interface UserProfile {
  id: string
  user_id: string
  display_name?: string
  google_maps_api_key_encrypted?: string
  chatgpt_api_key_encrypted?: string
  default_search_radius: number
  default_business_count: number
  default_rating_filter: number
  created_at: string
  updated_at: string
}

export interface SavedAnalysis {
  id: string
  user_id: string
  project_name: string
  city_name?: string
  business_type?: string
  map_center_lat?: number
  map_center_lng?: number
  search_parameters?: any
  analysis_results?: any
  map_screenshot_url?: string
  created_at: string
  updated_at: string
}
