import { User } from '@supabase/supabase-js'

export interface AuthUser extends User {
  // Additional user properties if needed
}

export interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  resetPassword: (email: string) => Promise<{ error: any }>
}

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
  search_parameters?: {
    searchRadius: number
    minRating: number
    useRatingFilter: boolean
    businessCount: number
    businessSearchRadius: number
  }
  analysis_results?: any
  map_screenshot_url?: string
  created_at: string
  updated_at: string
}

export interface LoginFormData {
  email: string
  password: string
  rememberMe?: boolean
}

export interface SignupFormData {
  email: string
  password: string
  confirmPassword: string
  displayName?: string
}
