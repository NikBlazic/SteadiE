export interface User {
  id: string;
  email: string;
  created_at: string;
  age: number;
  gender: string | null;
  onboarding_status: 'basic-info' | 'user-reason' | 'addiction-info' | 'mental-health-info' | 'motivation' | 'lifestyle-factors' | 'support-preferences' | 'emergency-contact' | 'confirmation' | 'complete' | '';
  updated_at: string;
}

export interface UserBasicInfo {
  id: string;
  user_id: string;
  display_name: string | null;
  onboarding_completed: boolean;
  anonymous: boolean;
  country_region: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserReason {
  id: string;
  user_id: string;
  main_reason: string[];
  created_at: string;
  updated_at: string;
}

export interface UserAddictionInfo {
  id: string;
  user_id: string;
  addiction_type: string | null;
  severity: 'mild' | 'moderate' | 'severe' | 'critical' | null;
  frequency: 'daily' | 'weekly' | 'monthly' | 'occasionally' | null;
  goal: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserMentalHealthInfo {
  id: string;
  user_id: string;
  struggles: string | null;
  recent_feeling: 'good' | 'okay' | 'struggling' | 'crisis' | null;
  created_at: string;
  updated_at: string;
}

export interface UserMotivation {
  id: string;
  user_id: string;
  readiness: 'not_ready' | 'thinking_about_it' | 'ready' | 'very_ready' | null;
  created_at: string;
  updated_at: string;
}

export interface UserLifestyleFactors {
  id: string;
  user_id: string;
  sleep_quality: 'poor' | 'fair' | 'good' | 'excellent' | null;
  stress_level: 'low' | 'moderate' | 'high' | 'extreme' | null;
  routine_stability: 'unstable' | 'somewhat_stable' | 'stable' | 'very_stable' | null;
  relationships: 'poor' | 'fair' | 'good' | 'excellent' | null;
  created_at: string;
  updated_at: string;
}

export interface UserSupportPreferences {
  id: string;
  user_id: string;
  support_type: ('daily_checkins' | 'habit_tracker' | 'journaling_prompts')[] | null;
  notification_frequency: 'none' | 'daily' | 'weekly' | 'monthly' | null;
  created_at: string;
  updated_at: string;
}

export interface UserEmergencyContact {
  id: string;
  user_id: string;
  contact_name: string;
  contact_phone: string | null;
  contact_email: string | null;
  relationship: string | null;
  created_at: string;
  updated_at: string;
}

// API Types
export interface ConfirmOnboardingRequest {
  userId: string;
  user: {
    age: number;
    gender: string;
  };
  basicInfo: {
    display_name: string;
    country_region: string;
    anonymous?: boolean;
  };
}

export interface ConfirmOnboardingResponse {
  success: boolean;
  message: string;
  data?: {
    userId: string;
    onboarding_completed: boolean;
  };
}

export interface ApiError {
  success: false;
  message: string;
}