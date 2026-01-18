-- Add unique constraints on user_id for all user-related tables
-- This is required for upsert operations with onConflict to work properly

-- Add unique constraint on user_reasons.user_id if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_reasons_user_id_key' 
        OR conname = 'user_reasons_pkey'
    ) THEN
        ALTER TABLE user_reasons ADD CONSTRAINT user_reasons_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- Add unique constraint on user_addiction_info.user_id if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_addiction_info_user_id_key' 
        OR conname = 'user_addiction_info_pkey'
    ) THEN
        ALTER TABLE user_addiction_info ADD CONSTRAINT user_addiction_info_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- Add unique constraint on user_mental_health_info.user_id if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_mental_health_info_user_id_key' 
        OR conname = 'user_mental_health_info_pkey'
    ) THEN
        ALTER TABLE user_mental_health_info ADD CONSTRAINT user_mental_health_info_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- Add unique constraint on user_motivation.user_id if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_motivation_user_id_key' 
        OR conname = 'user_motivation_pkey'
    ) THEN
        ALTER TABLE user_motivation ADD CONSTRAINT user_motivation_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- Add unique constraint on user_lifestyle_factors.user_id if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_lifestyle_factors_user_id_key' 
        OR conname = 'user_lifestyle_factors_pkey'
    ) THEN
        ALTER TABLE user_lifestyle_factors ADD CONSTRAINT user_lifestyle_factors_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- Add unique constraint on user_support_preferences.user_id if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_support_preferences_user_id_key' 
        OR conname = 'user_support_preferences_pkey'
    ) THEN
        ALTER TABLE user_support_preferences ADD CONSTRAINT user_support_preferences_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- Add unique constraint on user_emergency_contacts.user_id if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_emergency_contacts_user_id_key' 
        OR conname = 'user_emergency_contacts_pkey'
    ) THEN
        ALTER TABLE user_emergency_contacts ADD CONSTRAINT user_emergency_contacts_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- Ensure user_basic_info has unique constraint on user_id if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_basic_info_user_id_key' 
        OR conname = 'user_basic_info_pkey'
    ) THEN
        ALTER TABLE user_basic_info ADD CONSTRAINT user_basic_info_user_id_key UNIQUE (user_id);
    END IF;
END $$;
