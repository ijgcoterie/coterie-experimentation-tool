# Client-Side Experimentation Platform

A platform for managing client-side experiments with Statsig integration. This platform allows you to create, edit, and publish experiments that inject JavaScript code into web pages.

## Features

- Create and manage client-side experiments
- Define targeting conditions and environments
- Edit experiment code with Monaco editor
- Publish experiments to Statsig
- Import experiments from Statsig
- Use existing Statsig targeting gates
- Simple integration SDK for Next.js applications

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Statsig account with API access
- Supabase account for data storage

### Setup

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file with your API keys:

```
# Statsig API Keys
NEXT_PUBLIC_STATSIG_CONSOLE_API_KEY=your-statsig-console-api-key-here
NEXT_PUBLIC_STATSIG_CLIENT_SDK_KEY=client-sdk-key-here

# Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

You can get Statsig keys from your Statsig dashboard under Settings > API Keys.
For Supabase keys, see the instructions below.

4. Set up Supabase:

   a. Create a new Supabase project at https://app.supabase.com/
   b. Once created, go to Project Settings > API to get your project URL and anon key
   c. Create a table in your Supabase database with the following SQL:

```sql
CREATE TABLE experiments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'archived')),
  targeting JSONB NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE,
  statsig_id TEXT,
  statsig_layer TEXT,
  is_from_statsig BOOLEAN DEFAULT FALSE
);
```

5. Run the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## SDK Integration

### Installation

To integrate experiments into your main Next.js application:

```bash
# From npm (when published)
npm install @coterie/client-side-experimentation

# Or directly from the repository
npm install git+https://github.com/your-org/client-side-experimentation.git
```

### Basic Usage

Add the `ExperimentationProvider` to your root layout:

```tsx
// app/layout.tsx
import { ExperimentationProvider } from '@coterie/client-side-experimentation';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ExperimentationProvider 
          clientKey={process.env.NEXT_PUBLIC_STATSIG_CLIENT_SDK_KEY || ''}
          user={{
            // User properties for targeting
            userID: 'user-123', // Replace with actual user ID
          }}
        >
          {children}
        </ExperimentationProvider>
      </body>
    </html>
  );
}
```

### Updating User Data

When user information changes (e.g., after login):

```tsx
import { useExperimentation } from '@coterie/client-side-experimentation';

function UserProfile() {
  const { updateUser } = useExperimentation();
  
  const handleLogin = (userData) => {
    // Update experimentation user data after login
    updateUser({
      userID: userData.id,
      email: userData.email,
      custom: {
        isPremium: userData.isPremium,
      }
    });
  };
  
  // Rest of component...
}
```

### Alternative: Script Tag Integration

For simpler integration without React context:

```tsx
// app/layout.tsx
import { ExperimentationProvider } from '@coterie/client-side-experimentation';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ExperimentationProvider 
          clientKey={process.env.NEXT_PUBLIC_STATSIG_CLIENT_SDK_KEY || ''}
          useScriptTag={true}
        >
          {children}
        </ExperimentationProvider>
      </body>
    </html>
  );
}
```

### Advanced Usage

For more control over the SDK initialization:

```tsx
import { initialize, updateUser, shutdown } from '@coterie/client-side-experimentation';

// Initialize the SDK manually
await initialize({
  statsigClientKey: 'your-client-key',
  user: {
    userID: 'user-123',
    // Other user properties
  },
  debug: true,
  onLog: (event) => {
    // Custom logging
    console.log('[Custom Logger]', event);
  }
});

// Update user information
await updateUser({
  userID: 'user-123',
  email: 'updated@example.com'
});

// Shutdown the SDK when done
shutdown();
```

## Working with Experiments

### Creating a New Experiment

1. Navigate to the Experiments page
2. Click "Create Experiment"
3. Fill in the details, targeting, and experiment code
4. Click "Create" to save as a draft or "Publish" to publish to Statsig

### Importing from Statsig

1. Navigate to the Experiments page
2. Click "Import from Statsig"
3. Select an experiment to edit or view

### Editing Experiment Code

The platform includes a code editor for writing JavaScript that will be injected into your website. This code runs in the context of the page and can modify any aspect of the DOM or JavaScript environment.

### Publishing to Statsig

When you publish an experiment, it will be created or updated in Statsig and become available for use in your application through the Statsig SDK.

## Technology Stack

- Next.js 15 with App Router
- React 19
- TypeScript
- TailwindCSS
- Monaco Editor
- Statsig SDK
- Supabase (PostgreSQL database)

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Statsig Documentation](https://docs.statsig.com)
