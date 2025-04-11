'use client';

import React, { useEffect, useState } from 'react';
import Script from 'next/script';
import { initialize, updateUser, createSdkScript } from '@/lib/sdk';

interface ExperimentationProviderProps {
  children: React.ReactNode;
  clientKey: string;
  user?: {
    userID?: string;
    email?: string;
    [key: string]: any;
  };
  debug?: boolean;
  useScriptTag?: boolean;
}

/**
 * ExperimentationProvider
 * 
 * Next.js component that initializes the experimentation SDK and injects it into the page.
 * This should be added near the root of your application, typically in a layout component.
 * 
 * @example
 * // In your root layout.tsx
 * import { ExperimentationProvider } from '@coterie/client-side-experimentation';
 * 
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <ExperimentationProvider 
 *           clientKey={process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY || ''}
 *           user={{
 *             userID: 'user-123',
 *             email: 'user@example.com',
 *           }}
 *         >
 *           {children}
 *         </ExperimentationProvider>
 *       </body>
 *     </html>
 *   );
 * }
 */
export function ExperimentationProvider({
  children,
  clientKey,
  user,
  debug = false,
  useScriptTag = false,
}: ExperimentationProviderProps) {
  const [initialized, setInitialized] = useState(false);

  // Method 1: Using React's useEffect for client-side initialization
  useEffect(() => {
    if (!useScriptTag && typeof window !== 'undefined' && clientKey) {
      initialize({
        statsigClientKey: clientKey,
        user: user || undefined,
        debug,
        onLog: (event) => {
          if (debug) {
            console.log('[Experimentation]', event);
          }
        },
      })
        .then(() => {
          setInitialized(true);
        })
        .catch((error) => {
          console.error('Failed to initialize experimentation:', error);
        });
    }

    // Clean up on unmount
    return () => {
      // SDK provides a shutdown function that will be called on unmount
    };
  }, [clientKey, debug, user, useScriptTag]);

  // Update user when user prop changes
  useEffect(() => {
    if (initialized && !useScriptTag && user) {
      updateUser(user).catch((error) => {
        console.error('Failed to update user:', error);
      });
    }
  }, [user, initialized, useScriptTag]);

  // Method 2: Using Next.js Script component for script tag injection
  if (useScriptTag) {
    return (
      <>
        <Script
          id="coterie-experimentation-sdk"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: createSdkScript(clientKey),
          }}
        />
        {children}
      </>
    );
  }

  // Method 1: Return children directly when using React useEffect approach
  return <>{children}</>;
}

/**
 * Hook to get the current experimentation SDK state
 */
export function useExperimentation() {
  const [user, setUser] = useState<Record<string, any> | undefined>(undefined);

  // Update user in the SDK when the local user state changes
  useEffect(() => {
    if (user) {
      updateUser(user).catch((error) => {
        console.error('Failed to update user:', error);
      });
    }
  }, [user]);

  return {
    updateUser: setUser,
  };
}