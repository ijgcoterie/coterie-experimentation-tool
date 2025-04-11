# Coterie Client-Side Experimentation SDK Integration Guide

This guide explains how to integrate the Coterie Client-Side Experimentation SDK into your Next.js application to enable code injection experiments.

## Overview

The SDK provides:

1. Seamless integration with Statsig for experiment delivery
2. Automatic code injection for experiments configured in the Coterie platform
3. User targeting support based on various attributes
4. Multiple integration options depending on your application architecture

## Prerequisites

Before integrating the SDK, you need:

1. A Statsig account with client-side API key
2. The Coterie Client-Side Experimentation platform set up and running
3. At least one experiment created and published through the platform

## Installation

```bash
# From npm (when published)
npm install @coterie/client-side-experimentation

# Or directly from the repository
npm install git+https://github.com/your-org/client-side-experimentation.git
```

## Basic Integration

The simplest way to integrate is using the `ExperimentationProvider` component in your Next.js app's root layout:

```tsx
// app/layout.tsx
import { ExperimentationProvider } from '@coterie/client-side-experimentation';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ExperimentationProvider 
          clientKey={process.env.NEXT_PUBLIC_STATSIG_CLIENT_SDK_KEY || ''}
        >
          {children}
        </ExperimentationProvider>
      </body>
    </html>
  );
}
```

This will automatically:

1. Initialize the Statsig SDK on the client side
2. Check for any active experiments the user is part of
3. Execute the experiment code for any experiments in the treatment group

## User Targeting

For proper targeting, you'll want to pass user information to the SDK:

```tsx
<ExperimentationProvider 
  clientKey={process.env.NEXT_PUBLIC_STATSIG_CLIENT_SDK_KEY || ''}
  user={{
    // Required for stable user identity
    userID: 'user-123', // or anonymous ID for non-logged in users
    
    // Optional additional targeting attributes
    email: 'user@example.com',
    country: 'US',
    
    // Custom attributes for targeting
    custom: {
      isPremium: true,
      accountType: 'business',
      featureFlags: ['beta_program'],
    }
  }}
>
  {children}
</ExperimentationProvider>
```

## Updating User Data

When user information changes (e.g., after login), you can update the user data:

```tsx
import { useExperimentation } from '@coterie/client-side-experimentation';

function ProfilePage() {
  const { updateUser } = useExperimentation();
  
  // After user logs in
  function handleLogin(userData) {
    updateUser({
      userID: userData.id,
      email: userData.email,
      custom: {
        isPremium: userData.subscriptionStatus === 'active',
        lastLogin: new Date().toISOString(),
      }
    });
  }
  
  // Component implementation...
}
```

## Script Tag Integration

For projects where you prefer a simpler integration without React context, use the script tag option:

```tsx
<ExperimentationProvider 
  clientKey={process.env.NEXT_PUBLIC_STATSIG_CLIENT_SDK_KEY || ''}
  useScriptTag={true}
>
  {children}
</ExperimentationProvider>
```

This injects Statsig via a script tag and automatically evaluates any experiment code.

## Manual SDK Initialization

For more control, you can manually initialize the SDK:

```tsx
import { initialize, updateUser, shutdown } from '@coterie/client-side-experimentation';

// In your app initialization
async function initializeExperiments() {
  try {
    await initialize({
      statsigClientKey: process.env.NEXT_PUBLIC_STATSIG_CLIENT_SDK_KEY || '',
      user: {
        userID: getUserId(), // Your function to get user ID
        // Other user properties
      },
      debug: process.env.NODE_ENV !== 'production',
      onLog: (event) => {
        // Optional custom logging
        if (event.type === 'error') {
          captureException(event); // Your error tracking
        }
      }
    });
    
    console.log('Experimentation SDK initialized');
  } catch (error) {
    console.error('Failed to initialize experimentation SDK:', error);
  }
}

// When your app is destroyed or for SPA route changes
function cleanupExperiments() {
  shutdown();
}
```

## Force-Executing Experiments

In development, you may want to force an experiment to run:

```tsx
import { forceExecuteExperiment } from '@coterie/client-side-experimentation';

// Force a specific experiment to run (useful for testing)
forceExecuteExperiment('experiment_layer_name', `
  // Custom code to execute
  document.querySelector('header').style.backgroundColor = 'blue';
  console.log('Experiment running in dev mode');
`);
```

## Debugging

Enable debug mode to see detailed logs in the console:

```tsx
<ExperimentationProvider 
  clientKey={process.env.NEXT_PUBLIC_STATSIG_CLIENT_SDK_KEY || ''}
  debug={true}
>
  {children}
</ExperimentationProvider>
```

## Security Considerations

1. Always use environment variables for your Statsig client key
2. Be aware that all experiment code runs on the client side
3. Review experiment code carefully before publishing
4. The SDK creates an anonymous ID for non-logged in users to maintain consistent experiment bucketing

## Performance Impact

The SDK is designed to have minimal impact on your application's performance:

1. Statsig SDK is loaded asynchronously
2. Experiment code is executed after the page has loaded
3. Failed experiments are caught and will not crash your application
4. Console logs are minimal in production mode

## Common Issues

1. **No experiments running**: Verify the user meets targeting criteria
2. **Experiments not updating**: Check that `updateUser` is being called with correct data
3. **Script errors**: Check your experiment code for syntax or runtime errors

## Advanced: Custom SDK Implementation

If you need to create a completely custom integration, you can use these core functions:

```tsx
import {
  initialize,
  updateUser,
  checkAndExecuteExperiments,
  shutdown
} from '@coterie/client-side-experimentation';

// Initialize with custom configuration
await initialize({
  statsigClientKey: 'your-key',
  user: { userID: 'user-123' },
});

// Get updated user info and update
const newUserInfo = await fetchUserInfo();
await updateUser(newUserInfo);

// Force a re-check of all experiments
await checkAndExecuteExperiments();

// Clean up when done
shutdown();
```

## Need Help?

Contact the Coterie Labs team for assistance with SDK integration or experiment configuration.