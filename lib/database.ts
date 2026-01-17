import { supabase } from './supabase';

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
}