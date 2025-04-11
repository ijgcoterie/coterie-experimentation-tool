'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

export interface AppSettings {
  theme: Theme;
  analyticsEnabled: boolean;
  autoPublish: boolean;
  debugMode: boolean;
  userEmail: string;
  userName: string;
  statsigEnvironment: string;
}

export interface SettingsState extends AppSettings {
  setTheme: (theme: Theme) => void;
  setAnalyticsEnabled: (enabled: boolean) => void;
  setAutoPublish: (enabled: boolean) => void;
  setDebugMode: (enabled: boolean) => void;
  setUserInfo: (email: string, name: string) => void;
  setStatsigEnvironment: (environment: string) => void;
  resetSettings: () => void;
}

// Default settings
const defaultSettings: AppSettings = {
  theme: 'system',
  analyticsEnabled: true,
  autoPublish: false,
  debugMode: process.env.NODE_ENV === 'development',
  userEmail: '',
  userName: '',
  statsigEnvironment: 'production',
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,
      
      setTheme: (theme) => set({ theme }),
      
      setAnalyticsEnabled: (analyticsEnabled) => set({ analyticsEnabled }),
      
      setAutoPublish: (autoPublish) => set({ autoPublish }),
      
      setDebugMode: (debugMode) => set({ debugMode }),
      
      setUserInfo: (userEmail, userName) => set({ userEmail, userName }),
      
      setStatsigEnvironment: (statsigEnvironment) => set({ statsigEnvironment }),
      
      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'app-settings',
    }
  )
);