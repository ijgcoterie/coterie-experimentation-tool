'use client';

import { ExperimentationProvider } from '@coterie/client-side-experimentation';

/**
 * Example of how to integrate the Experimentation SDK using the script tag approach
 * 
 * This is simpler but has fewer features than the full React integration
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Wrap your application with the ExperimentationProvider using script tag mode */}
        <ExperimentationProvider
          clientKey={process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY || ''}
          useScriptTag={true}
        >
          {children}
        </ExperimentationProvider>
      </body>
    </html>
  );
}