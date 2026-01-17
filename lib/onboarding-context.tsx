import React, { createContext, useContext, useState } from 'react';
import {
  User,
  UserBasicInfo,
} from './database-types';

interface OnboardingData {
  user?: Partial<User>;
  basicInfo?: Partial<UserBasicInfo>;
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