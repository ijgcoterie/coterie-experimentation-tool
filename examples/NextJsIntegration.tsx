'use client';

import { ExperimentationProvider, useExperimentation } from '@coterie/client-side-experimentation';

/**
 * Example of how to integrate the Experimentation SDK into a Next.js app
 * 
 * This would typically go in your app/layout.tsx file to wrap your entire application
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Wrap your application with the ExperimentationProvider */}
        <ExperimentationProvider
          clientKey={process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY || ''}
          // Optional: Pass user information for targeting
          user={{
            userID: 'user-123', // In practice, you'd get this from your auth system
            email: 'user@example.com',
            custom: {
              isPremium: true,
              // Add any other user attributes for targeting
            },
          }}
          // Optional: Enable debug mode in development
          debug={process.env.NODE_ENV === 'development'}
        >
          {/* Your application */}
          <MainApp>{children}</MainApp>
        </ExperimentationProvider>
      </body>
    </html>
  );
}

/**
 * Example component that updates user data when it changes
 */
function MainApp({ children }: { children: React.ReactNode }) {
  const { updateUser } = useExperimentation();

  // Example of updating user data after login
  const handleLogin = (userData: any) => {
    updateUser({
      userID: userData.id,
      email: userData.email,
      custom: {
        isPremium: userData.subscription === 'premium',
        joinedDate: userData.joinedAt,
        // Any other attributes you want to use for targeting
      },
    });
  };

  return (
    <div>
      {/* Your app's main content */}
      {children}
      
      {/* Login button that would trigger the handleLogin function */}
      <button
        onClick={() => {
          // Simulate a login with user data
          handleLogin({
            id: 'user-456',
            email: 'newuser@example.com',
            subscription: 'premium',
            joinedAt: '2023-01-01',
          });
        }}
      >
        Login
      </button>
    </div>
  );
}