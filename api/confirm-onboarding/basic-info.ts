import { corsHeaders } from '@/api/_shared/cors';
import { createClient } from '@supabase/supabase-js';

interface ConfirmOnboardingRequest {
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

interface ConfirmOnboardingResponse {
  success: boolean;
  message: string;
  data?: {
    userId: string;
    onboarding_completed: boolean;
  };
}

export const onRequest = (async (req: Request) => {
  console.log('Edge Function called with method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return new Response('ok', { headers: corsHeaders });
  }

  try {

    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing required environment variables');
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Server configuration error'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create Supabase client with service role key
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body:', JSON.stringify(requestBody, null, 2));
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid JSON in request body'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { userId, user, basicInfo }: ConfirmOnboardingRequest = requestBody;

    // Validate required fields
    if (!userId || !user || !basicInfo) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Missing required fields: userId, user, or basicInfo'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate user data
    if (typeof user.age !== 'number' || user.age < 13) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid age: must be greater than 13'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!['male', 'female', 'prefer_not_to_say'].includes(user.gender)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid gender: must be male, female, or prefer_not_to_say'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate basic info
    if (!basicInfo.display_name || basicInfo.display_name.trim().length < 2) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid display_name: must be at least 2 characters'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!basicInfo.country_region || basicInfo.country_region.trim().length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Country/region is required'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Inserting user basic info...');
    // Start transaction - insert/update user basic info with onboarding completed
    const { error: basicInfoError } = await supabaseClient
      .from('user_basic_info')
      .upsert({
        user_id: userId,
        display_name: basicInfo.display_name.trim(),
        country_region: basicInfo.country_region.trim(),
        onboarding_completed: true,
        anonymous: basicInfo.anonymous ?? false,
      }, {
        onConflict: 'user_id'
      });

    if (basicInfoError) {
      console.error('Error inserting user basic info:', basicInfoError);
      console.error('Error details:', JSON.stringify(basicInfoError, null, 2));
      return new Response(
        JSON.stringify({
          success: false,
          message: `Failed to save basic information: ${basicInfoError.message} (Code: ${basicInfoError.code})`
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    console.log('User basic info inserted successfully');

    console.log('Inserting user profile...');
    // Get user email from auth
    const { data: authUser, error: authError } = await supabaseClient.auth.admin.getUserById(userId);

    if (authError) {
      console.error('Error getting user from auth:', authError);
    }

    // Insert/update user profile
    const { error: userError } = await supabaseClient
      .from('users')
      .upsert({
        id: userId,
        age: user.age,
        gender: user.gender,
        email: authUser?.user?.email || '',
      }, {
        onConflict: 'id'
      });

    if (userError) {
      console.error('Error inserting user profile:', userError);
      console.error('Error details:', JSON.stringify(userError, null, 2));
      return new Response(
        JSON.stringify({
          success: false,
          message: `Failed to save user profile: ${userError.message} (Code: ${userError.code})`
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    console.log('User profile inserted successfully');

    console.log('Onboarding completed successfully for user:', userId);
    const response: ConfirmOnboardingResponse = {
      success: true,
      message: 'Onboarding completed successfully',
      data: {
        userId,
        onboarding_completed: true
      }
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Internal server error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});