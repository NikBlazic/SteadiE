import { supabase } from '../lib/supabase';

export class DatabaseService {

  // Check if user has completed onboarding
  static async checkOnboardingCompleted(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('user_basic_info')
      .select('onboarding_completed')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If no record exists, onboarding is not completed
      if (error.code === 'PGRST116') {
        return false;
      }
      throw error;
    }

    return data?.onboarding_completed || false;
  }

  // Get the current onboarding status/stage
  static async getOnboardingStatus(userId: string): Promise<'basic-info' | 'user-reason' | 'addiction-info' | 'mental-health-info' | 'motivation' | 'lifestyle-factors' | 'support-preferences' | 'emergency-contact' | 'confirmation' | 'complete' | ''> {
    const { data, error } = await supabase
      .from('users')
      .select('onboarding_status')
      .eq('id', userId)
      .single();

    if (error) {
      // If no record exists, return empty string (start from beginning)
      if (error.code === 'PGRST116') {
        return '';
      }
      throw error;
    }

    const status = data?.onboarding_status || '';
    // Validate the status is one of our expected values
    const validStatuses = ['complete', 'basic-info', 'user-reason', 'addiction-info', 'mental-health-info', 'motivation', 'lifestyle-factors', 'support-preferences', 'emergency-contact', 'confirmation'];
    if (validStatuses.includes(status)) {
      return status as 'basic-info' | 'user-reason' | 'addiction-info' | 'mental-health-info' | 'motivation' | 'lifestyle-factors' | 'support-preferences' | 'emergency-contact' | 'confirmation' | 'complete';
    }
    return '';
  }

  // Update the onboarding status
  static async updateOnboardingStatus(
    userId: string, 
    status: 'basic-info' | 'user-reason' | 'addiction-info' | 'mental-health-info' | 'motivation' | 'lifestyle-factors' | 'support-preferences' | 'emergency-contact' | 'confirmation' | 'complete'
  ): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ onboarding_status: status })
      .eq('id', userId);

    if (error) {
      throw error;
    }
  }

  // Get user basic info from database
  static async getUserBasicInfo(userId: string) {
    const { data, error } = await supabase
      .from('user_basic_info')
      .select('display_name, country_region')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No record found
      }
      throw error;
    }

    return data;
  }

  // Save/update user basic info in database
  static async saveUserBasicInfo(userId: string, basicInfo: {
    display_name: string;
    country_region: string;
    anonymous?: boolean;
  }) {
    // Check if record exists
    const { data: existing, error: selectError } = await supabase
      .from('user_basic_info')
      .select('id')
      .eq('user_id', userId)
      .single();

    // PGRST116 means no rows found, which is expected for new records
    const recordExists = existing && (!selectError || (selectError as { code?: string })?.code !== 'PGRST116');

    if (recordExists) {
      // Update existing record
      const { error } = await supabase
        .from('user_basic_info')
        .update({
          display_name: basicInfo.display_name,
          country_region: basicInfo.country_region,
          anonymous: basicInfo.anonymous ?? false,
        })
        .eq('user_id', userId);

      if (error) {
        throw error;
      }
    } else {
      // Insert new record
      const { error } = await supabase
        .from('user_basic_info')
        .insert({
          user_id: userId,
          display_name: basicInfo.display_name,
          country_region: basicInfo.country_region,
          anonymous: basicInfo.anonymous ?? false,
        });

      if (error) {
        throw error;
      }
    }
  }

  // Save/update user data in database
  static async saveUserData(userId: string, userData: {
    age: number;
    gender: string;
  }) {
    // Check if record exists
    const { data: existing, error: selectError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    // PGRST116 means no rows found, which is expected for new records
    const recordExists = existing && (!selectError || (selectError as { code?: string })?.code !== 'PGRST116');

    if (recordExists) {
      // Update existing record
      const { error } = await supabase
        .from('users')
        .update({
          age: userData.age,
          gender: userData.gender,
        })
        .eq('id', userId);

      if (error) {
        throw error;
      }
    } else {
      // Insert new record
      const { error } = await supabase
        .from('users')
        .insert({
          id: userId,
          age: userData.age,
          gender: userData.gender,
        });

      if (error) {
        throw error;
      }
    }
  }

  // Mark onboarding as completed
  static async markOnboardingComplete(userId: string) {
    // Update user_basic_info to mark onboarding as complete
    const { error: basicInfoError } = await supabase
      .from('user_basic_info')
      .update({ onboarding_completed: true })
      .eq('user_id', userId);

    if (basicInfoError) {
      throw basicInfoError;
    }

    // Update users table to set onboarding_status to 'complete'
    const { error: userError } = await supabase
      .from('users')
      .update({ onboarding_status: 'complete' })
      .eq('id', userId);

    if (userError) {
      throw userError;
    }
  }

  // Get user data from database
  static async getUserData(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('age, gender')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No record found
      }
      throw error;
    }

    return data;
  }

  // Get user reason from database
  static async getUserReason(userId: string) {
    const { data, error } = await supabase
      .from('user_reasons')
      .select('main_reason')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No record found
      }
      throw error;
    }

    return data;
  }

  // Save/update user reason in database
  static async saveUserReason(userId: string, mainReason: string[]) {
    // Check if record exists
    const { data: existing, error: selectError } = await supabase
      .from('user_reasons')
      .select('id')
      .eq('user_id', userId)
      .single();

    // PGRST116 means no rows found, which is expected for new records
    const recordExists = existing && (!selectError || (selectError as { code?: string })?.code !== 'PGRST116');
    if (recordExists) {
      // Update existing record
      const { error } = await supabase
        .from('user_reasons')
        .update({
          main_reason: mainReason,
        })
        .eq('user_id', userId);

      if (error) {
        throw error;
      }
    } else {
      // Insert new record
      const { error } = await supabase
        .from('user_reasons')
        .insert({
          user_id: userId,
          main_reason: mainReason,
        });

      if (error) {
        throw error;
      }
    }
  }

  // Get user addiction info from database
  static async getUserAddictionInfo(userId: string) {
    const { data, error } = await supabase
      .from('user_addiction_info')
      .select('addiction_type, severity, frequency, goal')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  }

  // Save/update user addiction info in database
  static async saveUserAddictionInfo(userId: string, addictionInfo: {
    addiction_type: string;
    severity: 'mild' | 'moderate' | 'severe' | 'critical';
    frequency: 'daily' | 'weekly' | 'monthly' | 'occasionally';
    goal: string | null;
  }) {
    // Check if record exists
    const { data: existing, error: selectError } = await supabase
      .from('user_addiction_info')
      .select('id')
      .eq('user_id', userId)
      .single();

    // PGRST116 means no rows found, which is expected for new records
    const recordExists = existing && (!selectError || (selectError as { code?: string })?.code !== 'PGRST116');
    if (recordExists) {
      // Update existing record
      const { error } = await supabase
        .from('user_addiction_info')
        .update({
          addiction_type: addictionInfo.addiction_type,
          severity: addictionInfo.severity,
          frequency: addictionInfo.frequency,
          goal: addictionInfo.goal,
        })
        .eq('user_id', userId);

      if (error) {
        throw error;
      }
    } else {
      // Insert new record
      const { error } = await supabase
        .from('user_addiction_info')
        .insert({
          user_id: userId,
          addiction_type: addictionInfo.addiction_type,
          severity: addictionInfo.severity,
          frequency: addictionInfo.frequency,
          goal: addictionInfo.goal,
        });

      if (error) {
        throw error;
      }
    }
  }

  // Get user mental health info from database
  static async getUserMentalHealthInfo(userId: string) {
    const { data, error } = await supabase
      .from('user_mental_health_info')
      .select('struggles, recent_feeling')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  }

  // Save/update user mental health info in database
  static async saveUserMentalHealthInfo(userId: string, mentalHealthInfo: {
    struggles: string | null;
    recent_feeling: 'good' | 'okay' | 'struggling' | 'crisis';
  }) {
    // Check if record exists
    const { data: existing, error: selectError } = await supabase
      .from('user_mental_health_info')
      .select('id')
      .eq('user_id', userId)
      .single();

    // PGRST116 means no rows found, which is expected for new records
    const recordExists = existing && (!selectError || (selectError as { code?: string })?.code !== 'PGRST116');
    if (recordExists) {
      // Update existing record
      const { error } = await supabase
        .from('user_mental_health_info')
        .update({
          struggles: mentalHealthInfo.struggles,
          recent_feeling: mentalHealthInfo.recent_feeling,
        })
        .eq('user_id', userId);

      if (error) {
        throw error;
      }
    } else {
      // Insert new record
      const { error } = await supabase
        .from('user_mental_health_info')
        .insert({
          user_id: userId,
          struggles: mentalHealthInfo.struggles,
          recent_feeling: mentalHealthInfo.recent_feeling,
        });

      if (error) {
        throw error;
      }
    }
  }

  // Get user motivation from database
  static async getUserMotivation(userId: string) {
    const { data, error } = await supabase
      .from('user_motivation')
      .select('readiness')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  }

  // Save/update user motivation in database
  static async saveUserMotivation(userId: string, motivation: {
    readiness: 'not_ready' | 'thinking_about_it' | 'ready' | 'very_ready';
  }) {
    // Check if record exists
    const { data: existing, error: selectError } = await supabase
      .from('user_motivation')
      .select('id')
      .eq('user_id', userId)
      .single();

    // PGRST116 means no rows found, which is expected for new records
    const recordExists = existing && (!selectError || (selectError as { code?: string })?.code !== 'PGRST116');
    if (recordExists) {
      // Update existing record
      const { error } = await supabase
        .from('user_motivation')
        .update({
          readiness: motivation.readiness,
        })
        .eq('user_id', userId);

      if (error) {
        throw error;
      }
    } else {
      // Insert new record
      const { error } = await supabase
        .from('user_motivation')
        .insert({
          user_id: userId,
          readiness: motivation.readiness,
        });

      if (error) {
        throw error;
      }
    }
  }

  // Get user lifestyle factors from database
  static async getUserLifestyleFactors(userId: string) {
    const { data, error } = await supabase
      .from('user_lifestyle_factors')
      .select('sleep_quality, stress_level, routine_stability, relationships')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  }

  // Save/update user lifestyle factors in database
  static async saveUserLifestyleFactors(userId: string, lifestyleFactors: {
    sleep_quality: 'poor' | 'fair' | 'good' | 'excellent';
    stress_level: 'low' | 'moderate' | 'high' | 'extreme';
    routine_stability: 'unstable' | 'somewhat_stable' | 'stable' | 'very_stable';
    relationships: 'poor' | 'fair' | 'good' | 'excellent';
  }) {
    // Check if record exists
    const { data: existing, error: selectError } = await supabase
      .from('user_lifestyle_factors')
      .select('id')
      .eq('user_id', userId)
      .single();

    // PGRST116 means no rows found, which is expected for new records
    const recordExists = existing && (!selectError || (selectError as { code?: string })?.code !== 'PGRST116');
    if (recordExists) {
      // Update existing record
      const { error } = await supabase
        .from('user_lifestyle_factors')
        .update({
          sleep_quality: lifestyleFactors.sleep_quality,
          stress_level: lifestyleFactors.stress_level,
          routine_stability: lifestyleFactors.routine_stability,
          relationships: lifestyleFactors.relationships,
        })
        .eq('user_id', userId);

      if (error) {
        throw error;
      }
    } else {
      // Insert new record
      const { error } = await supabase
        .from('user_lifestyle_factors')
        .insert({
          user_id: userId,
          sleep_quality: lifestyleFactors.sleep_quality,
          stress_level: lifestyleFactors.stress_level,
          routine_stability: lifestyleFactors.routine_stability,
          relationships: lifestyleFactors.relationships,
        });

      if (error) {
        throw error;
      }
    }
  }

  // Get user support preferences from database
  static async getUserSupportPreferences(userId: string) {
    const { data, error } = await supabase
      .from('user_support_preferences')
      .select('support_type, notification_frequency')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  }

  // Save/update user support preferences in database
  static async saveUserSupportPreferences(userId: string, supportPreferences: {
    support_type: ('daily_checkins' | 'habit_tracker' | 'journaling_prompts')[];
    notification_frequency: 'none' | 'daily' | 'weekly' | 'monthly';
  }) {
    // Check if record exists
    const { data: existing, error: selectError } = await supabase
      .from('user_support_preferences')
      .select('id')
      .eq('user_id', userId)
      .single();

    // PGRST116 means no rows found, which is expected for new records
    const recordExists = existing && (!selectError || (selectError as { code?: string })?.code !== 'PGRST116');
    if (recordExists) {
      // Update existing record
      const { error } = await supabase
        .from('user_support_preferences')
        .update({
          support_type: supportPreferences.support_type,
          notification_frequency: supportPreferences.notification_frequency,
        })
        .eq('user_id', userId);

      if (error) {
        throw error;
      }
    } else {
      // Insert new record
      const { error } = await supabase
        .from('user_support_preferences')
        .insert({
          user_id: userId,
          support_type: supportPreferences.support_type,
          notification_frequency: supportPreferences.notification_frequency,
        });

      if (error) {
        throw error;
      }
    }
  }

  // Get user emergency contact from database
  static async getUserEmergencyContact(userId: string) {
    const { data, error } = await supabase
      .from('user_emergency_contacts')
      .select('contact_name, contact_phone, contact_email, relationship')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  }

  // Save/update user emergency contact in database
  static async saveUserEmergencyContact(userId: string, emergencyContact: {
    contact_name: string;
    contact_phone: string | null;
    contact_email: string | null;
    relationship: string | null;
  }) {
    // Check if record exists
    const { data: existing, error: selectError } = await supabase
      .from('user_emergency_contacts')
      .select('id')
      .eq('user_id', userId)
      .single();

    // PGRST116 means no rows found, which is expected for new records
    const recordExists = existing && (!selectError || (selectError as { code?: string })?.code !== 'PGRST116');
    if (recordExists) {
      // Update existing record
      const { error } = await supabase
        .from('user_emergency_contacts')
        .update({
          contact_name: emergencyContact.contact_name,
          contact_phone: emergencyContact.contact_phone,
          contact_email: emergencyContact.contact_email,
          relationship: emergencyContact.relationship,
        })
        .eq('user_id', userId);

      if (error) {
        throw error;
      }
    } else {
      // Insert new record
      const { error } = await supabase
        .from('user_emergency_contacts')
        .insert({
          user_id: userId,
          contact_name: emergencyContact.contact_name,
          contact_phone: emergencyContact.contact_phone,
          contact_email: emergencyContact.contact_email,
          relationship: emergencyContact.relationship,
        });

      if (error) {
        throw error;
      }
    }
  }
}
