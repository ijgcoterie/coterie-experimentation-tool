'use client';

import { useState, useEffect } from 'react';
import { 
  Theme, 
  useSettingsStore 
} from '@/lib/settings';
import { getStatsigEnvironments } from '@/lib/statsig';

export default function SettingsPage() {
  const {
    theme,
    analyticsEnabled,
    autoPublish,
    debugMode,
    userEmail,
    userName,
    statsigEnvironment,
    setTheme,
    setAnalyticsEnabled,
    setAutoPublish,
    setDebugMode,
    setUserInfo,
    setStatsigEnvironment,
    resetSettings,
  } = useSettingsStore();

  const [emailInput, setEmailInput] = useState(userEmail);
  const [nameInput, setNameInput] = useState(userName);
  const [environments, setEnvironments] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  // Fetch available Statsig environments
  useEffect(() => {
    const fetchEnvironments = async () => {
      try {
        // Use default environments immediately to prevent UI delay
        setEnvironments(['development', 'staging', 'production']);
        
        // Then try to fetch from API
        const envs = await getStatsigEnvironments();
        if (envs && envs.length > 0) {
          setEnvironments(envs);
        }
      } catch (err) {
        console.error('Failed to fetch environments:', err);
        // Already using fallback environments
      }
    };
    
    fetchEnvironments();
  }, []);

  const handleSaveUserInfo = () => {
    setSaving(true);
    
    // Simulating a delay to show loading state
    setTimeout(() => {
      setUserInfo(emailInput, nameInput);
      setSaving(false);
    }, 500);
  };

  const handleResetSettings = () => {
    resetSettings();
    setEmailInput('');
    setNameInput('');
    setResetConfirmOpen(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure application preferences and integrations
          </p>
        </div>
      </div>

      {/* Settings sections */}
      <div className="space-y-10">
        {/* User Profile Section */}
        <section className="bg-white dark:bg-gray-900 border border-[#DCE0E6] dark:border-gray-800 rounded-[8px] p-6 shadow-[0px_4px_16px_0px_rgba(0,0,0,0.04)]">
          <h2 className="text-lg font-medium mb-4">User Profile</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="userName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name
              </label>
              <input
                type="text"
                id="userName"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800"
                placeholder="Your name"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="userEmail"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800"
                placeholder="you@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Used for change tracking and notifications
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSaveUserInfo}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </section>

        {/* Appearance Settings */}
        <section className="bg-white dark:bg-gray-900 border border-[#DCE0E6] dark:border-gray-800 rounded-[8px] p-6 shadow-[0px_4px_16px_0px_rgba(0,0,0,0.04)]">
          <h2 className="text-lg font-medium mb-4">Appearance</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Theme
              </label>
              <div className="flex space-x-4">
                {(["light", "dark", "system"] as Theme[]).map((themeOption) => (
                  <div 
                    key={themeOption}
                    className={`
                      flex-1 border rounded-md p-4 cursor-pointer transition-colors
                      ${theme === themeOption 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }
                    `}
                    onClick={() => setTheme(themeOption)}
                  >
                    <div className="flex items-center justify-center mb-2">
                      {themeOption === 'light' && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      )}
                      {themeOption === 'dark' && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                      )}
                      {themeOption === 'system' && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    <div className="text-center text-sm capitalize">{themeOption}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Integration Settings */}
        <section className="bg-white dark:bg-gray-900 border border-[#DCE0E6] dark:border-gray-800 rounded-[8px] p-6 shadow-[0px_4px_16px_0px_rgba(0,0,0,0.04)]">
          <h2 className="text-lg font-medium mb-4">Statsig Integration</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="statsigEnvironment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Default Environment
              </label>
              <select
                id="statsigEnvironment"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800"
                value={statsigEnvironment}
                onChange={(e) => setStatsigEnvironment(e.target.value)}
              >
                {environments.map((env) => (
                  <option key={env} value={env}>
                    {env.charAt(0).toUpperCase() + env.slice(1)}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                The default environment for new experiments
              </p>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <label htmlFor="autoPublish" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Auto-publish experiments
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Automatically publish experiments to Statsig when saved
                </p>
              </div>
              <div className="ml-4">
                <button
                  type="button"
                  role="switch"
                  aria-checked={autoPublish}
                  className={`${
                    autoPublish ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                  onClick={() => setAutoPublish(!autoPublish)}
                >
                  <span
                    className={`${
                      autoPublish ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Advanced Settings */}
        <section className="bg-white dark:bg-gray-900 border border-[#DCE0E6] dark:border-gray-800 rounded-[8px] p-6 shadow-[0px_4px_16px_0px_rgba(0,0,0,0.04)]">
          <h2 className="text-lg font-medium mb-4">Advanced Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <label htmlFor="analyticsEnabled" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable analytics
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Collect anonymous usage data to improve the application
                </p>
              </div>
              <div className="ml-4">
                <button
                  type="button"
                  role="switch"
                  aria-checked={analyticsEnabled}
                  className={`${
                    analyticsEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                  onClick={() => setAnalyticsEnabled(!analyticsEnabled)}
                >
                  <span
                    className={`${
                      analyticsEnabled ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <label htmlFor="debugMode" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Debug mode
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Show additional debugging information in the UI
                </p>
              </div>
              <div className="ml-4">
                <button
                  type="button"
                  role="switch"
                  aria-checked={debugMode}
                  className={`${
                    debugMode ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                  onClick={() => setDebugMode(!debugMode)}
                >
                  <span
                    className={`${
                      debugMode ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
              <button
                type="button"
                className="px-4 py-2 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                onClick={() => setResetConfirmOpen(true)}
              >
                Reset all settings
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Reset Confirmation Dialog */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Reset settings?</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              This will reset all settings to their default values. This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
                onClick={() => setResetConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                onClick={handleResetSettings}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}