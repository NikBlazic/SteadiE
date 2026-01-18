import React, { createContext, useContext, useState } from 'react';
import {
  User,
  UserAddictionInfo,
  UserBasicInfo,
  UserEmergencyContact,
  UserLifestyleFactors,
  UserMentalHealthInfo,
  UserMotivation,
  UserReason,
  UserSupportPreferences,
} from './database-types';

interface OnboardingData {
  user?: Partial<User>;
  basicInfo?: Partial<UserBasicInfo>;
  userReason?: Partial<UserReason>;
  addictionInfo?: Partial<UserAddictionInfo>;
  mentalHealthInfo?: Partial<UserMentalHealthInfo>;
  motivation?: Partial<UserMotivation>;
  lifestyleFactors?: Partial<UserLifestyleFactors>;
  supportPreferences?: Partial<UserSupportPreferences>;
  emergencyContact?: Partial<UserEmergencyContact>;
}

interface OnboardingContextType {
  data: OnboardingData;
  updateData: (step: keyof OnboardingData, data: any) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<OnboardingData>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const updateData = (step: keyof OnboardingData, newData: any) => {
    setData(prev => ({
      ...prev,
      [step]: { ...prev[step], ...newData }
    }));
  };

  const value = {
    data,
    updateData,
    currentStep,
    setCurrentStep,
    isLoading,
    setIsLoading,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}