import { initialize, updateUser, shutdown, checkAndExecuteExperiments } from '@coterie/client-side-experimentation';

/**
 * Example of manually initializing the Experimentation SDK
 * 
 * This gives you the most control over when and how experiments are loaded and executed
 */

// Function to initialize the SDK
export async function initializeExperiments() {
  try {
    // Initialize the SDK with configuration
    await initialize({
      statsigClientKey: process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY || '',
      user: {
        // Get user information from your auth system
        userID: getUserId(),
        email: getUserEmail(),
        custom: getUserCustomProperties(),
      },
      debug: process.env.NODE_ENV === 'development',
      onLog: handleExperimentLog,
    });
    
    console.log('Experimentation SDK initialized successfully');
    
    // SDK automatically checks and executes experiments on initialization,
    // but you can manually trigger it again if needed
    await checkAndExecuteExperiments();
  } catch (error) {
    console.error('Failed to initialize experimentation SDK:', error);
  }
}

// Function to update user data when it changes
export async function updateExperimentUser(userData: any) {
  try {
    await updateUser({
      userID: userData.id,
      email: userData.email,
      custom: {
        isPremium: userData.isPremium,
        // Other user properties for targeting
      },
    });
    
    // Experiments will be automatically re-evaluated with the new user data
    console.log('Experimentation user updated');
  } catch (error) {
    console.error('Failed to update experimentation user:', error);
  }
}

// Function to clean up when the app is unmounted
export function cleanupExperiments() {
  shutdown();
  console.log('Experimentation SDK shut down');
}

// Example custom log handler
function handleExperimentLog(event: { type: string; message: string; data?: any }) {
  // Send logs to your analytics or monitoring system
  if (event.type === 'error') {
    // Log errors to your error tracking system
    reportError(event.message, event.data);
  }
  
  // You can also log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Experiment ${event.type}]`, event.message, event.data);
  }
}

// Mock functions that would be implemented in your application
function getUserId() {
  // Get the current user ID from your auth system
  return 'user-123'; 
}

function getUserEmail() {
  // Get the current user email from your auth system
  return 'user@example.com';
}

function getUserCustomProperties() {
  // Get custom user properties for targeting from your system
  return {
    isPremium: true,
    userSegment: 'power_user',
    signupDate: '2023-01-01',
  };
}

function reportError(message: string, data?: any) {
  // Send error to your monitoring system (e.g., Sentry, LogRocket, etc.)
  console.error(message, data);
}