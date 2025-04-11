import { Experiment } from '@/types/experiment';

/**
 * CoterieLabs Experimentation SDK
 * 
 * Client-side SDK for integrating with Coterie's experimentation platform.
 * This SDK works with Statsig to inject experiment code into a Next.js application.
 */

interface ExperimentationConfig {
  /** Statsig client API key */
  statsigClientKey: string;
  /** User object to be passed to Statsig */
  user?: StatsigUser;
  /** Optional logging callback */
  onLog?: (event: LogEvent) => void;
  /** Whether to enable verbose logging */
  debug?: boolean;
}

interface StatsigUser {
  userID?: string;
  customIDs?: Record<string, string>;
  email?: string;
  ip?: string;
  userAgent?: string;
  country?: string;
  locale?: string;
  appVersion?: string;
  custom?: Record<string, any>;
  [key: string]: any;
}

interface LogEvent {
  type: 'info' | 'error' | 'debug';
  message: string;
  data?: any;
}

// Global state
let _initialized = false;
let _config: ExperimentationConfig | null = null;
let _activeExperiments: Record<string, Experiment> = {};
let _statsigInstance: any = null; // Will hold the Statsig SDK instance

/**
 * Initialize the experimentation SDK
 * 
 * @param config Configuration options
 * @returns Promise that resolves when initialization is complete
 */
export async function initialize(config: ExperimentationConfig): Promise<void> {
  if (_initialized) {
    log('debug', 'SDK already initialized, skipping', config);
    return;
  }

  _config = config;
  log('info', 'Initializing Coterie Experimentation SDK', { clientKey: maskKey(config.statsigClientKey) });
  
  try {
    // Dynamically import Statsig to avoid SSR issues
    const statsig = await import('statsig-js');
    
    // Initialize Statsig with user info
    await statsig.initialize(
      config.statsigClientKey,
      config.user || { userID: generateAnonymousId() },
      { environment: { tier: process.env.NODE_ENV } }
    );
    
    _statsigInstance = statsig;
    _initialized = true;
    log('info', 'SDK initialized successfully');
    
    // Execute any active experiments
    await checkAndExecuteExperiments();
  } catch (error) {
    log('error', 'Failed to initialize SDK', error);
    throw error;
  }
}

/**
 * Update the user information in the SDK and re-evaluate experiments
 * 
 * @param user Updated user information
 * @returns Promise that resolves when updates are complete
 */
export async function updateUser(user: StatsigUser): Promise<void> {
  if (!_initialized) {
    log('error', 'SDK not initialized, call initialize() first');
    throw new Error('SDK not initialized, call initialize() first');
  }

  log('info', 'Updating user information', { user });

  try {
    await _statsigInstance.updateUser(user);
    // Re-evaluate experiments with updated user
    await checkAndExecuteExperiments();
  } catch (error) {
    log('error', 'Failed to update user', error);
    throw error;
  }
}

/**
 * Shutdown the experimentation SDK, use when unmounting the app
 */
export function shutdown(): void {
  if (!_initialized) return;
  
  _statsigInstance?.shutdown();
  _initialized = false;
  _statsigInstance = null;
  _activeExperiments = {};
  log('info', 'SDK shut down');
}

/**
 * Check if user is in experiment and execute experiment code if in treatment group
 * This is automatically called after initialization and user updates
 * but can be manually called if needed
 */
export async function checkAndExecuteExperiments(): Promise<void> {
  if (!_initialized || !_statsigInstance) {
    log('error', 'SDK not initialized, call initialize() first');
    throw new Error('SDK not initialized, call initialize() first');
  }

  try {
    // Get all layers from Statsig
    const allLayers = _statsigInstance.getAllLayers();
    
    // Loop through each layer to check for experiments
    for (const layerName of Object.keys(allLayers)) {
      const layer = _statsigInstance.getLayer(layerName);
      
      // Check if this layer has a treatment with jsCode
      const jsCode = layer.get('jsCode', '');
      
      if (jsCode) {
        log('debug', `Found experiment code in layer: ${layerName}`, { jsCode });
        
        // Execute the experiment code within a try/catch block
        try {
          executeCode(jsCode, layerName);
          log('info', `Successfully executed experiment: ${layerName}`);
        } catch (execError) {
          log('error', `Error executing experiment code for ${layerName}`, execError);
        }
      }
    }
  } catch (error) {
    log('error', 'Failed to check and execute experiments', error);
  }
}

/**
 * Force execution of a specific experiment by ID
 * Useful for development and testing
 * 
 * @param experimentId The experiment ID to execute
 * @param code Optional code to execute (if not provided, will use code from Statsig)
 */
export function forceExecuteExperiment(experimentId: string, code?: string): void {
  if (!code) {
    if (!_statsigInstance) {
      log('error', 'SDK not initialized, call initialize() first');
      throw new Error('SDK not initialized, call initialize() first');
    }
    
    // Try to get experiment code from Statsig layer
    try {
      const layer = _statsigInstance.getLayer(experimentId);
      code = layer.get('jsCode', '');
      
      if (!code) {
        log('error', `No code found for experiment: ${experimentId}`);
        return;
      }
    } catch (error) {
      log('error', `Failed to get experiment: ${experimentId}`, error);
      return;
    }
  }
  
  try {
    executeCode(code, experimentId);
    log('info', `Force executed experiment: ${experimentId}`);
  } catch (error) {
    log('error', `Error force executing experiment: ${experimentId}`, error);
  }
}

/**
 * Helper function to safely execute experiment code
 */
function executeCode(code: string, experimentId: string): void {
  // Execute the code in an IIFE with a try/catch block
  const execFunc = new Function(
    'experimentId',
    `
    (() => {
      try {
        ${code}
      } catch (error) {
        console.error('Experiment execution error:', error);
      }
    })();
    `
  );
  
  execFunc(experimentId);
}

/**
 * Generate a random anonymous ID for users who aren't logged in
 */
function generateAnonymousId(): string {
  // Use existing ID from localStorage if available
  if (typeof window !== 'undefined') {
    const storedId = localStorage.getItem('coterie_anonymous_id');
    if (storedId) return storedId;
    
    // Generate and store a new ID
    const newId = `anon_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('coterie_anonymous_id', newId);
    return newId;
  }
  
  // Fallback for SSR
  return `anon_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Internal logging function
 */
function log(type: LogEvent['type'], message: string, data?: any): void {
  if (type === 'debug' && !_config?.debug) return;
  
  const event: LogEvent = { type, message, data };
  
  // Send to custom logger if provided
  _config?.onLog?.(event);
  
  // Also log to console
  if (type === 'error') {
    console.error(`[CoterieLabs] ${message}`, data);
  } else if (type === 'debug' && _config?.debug) {
    console.debug(`[CoterieLabs] ${message}`, data);
  } else if (type === 'info') {
    console.info(`[CoterieLabs] ${message}`, data);
  }
}

/**
 * Utility to mask API keys in logs
 */
function maskKey(key: string): string {
  if (!key) return '';
  if (key.length <= 8) return '****';
  return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
}

/**
 * React hook for using the experimentation SDK in a component
 */
export function createExperimentationProvider() {
  if (typeof React === 'undefined') {
    throw new Error('React is required to use experimentation provider');
  }
  
  // Create a React context
  const ExperimentContext = React.createContext<{
    initialized: boolean;
    updateUser: (user: StatsigUser) => Promise<void>;
  }>({
    initialized: false,
    updateUser: async () => {},
  });
  
  // Provider component
  function ExperimentProvider({ 
    children, 
    statsigClientKey, 
    initialUser = {},
    debug = false,
    onLog,
  }: { 
    children: React.ReactNode;
    statsigClientKey: string;
    initialUser?: StatsigUser;
    debug?: boolean;
    onLog?: (event: LogEvent) => void;
  }) {
    const [initialized, setInitialized] = React.useState(false);
    
    React.useEffect(() => {
      // Initialize the SDK when component mounts
      initialize({
        statsigClientKey,
        user: initialUser,
        debug,
        onLog,
      }).then(() => {
        setInitialized(true);
      }).catch(error => {
        console.error('Failed to initialize experimentation SDK:', error);
      });
      
      // Cleanup when component unmounts
      return () => {
        shutdown();
      };
    }, [statsigClientKey, debug]); // Re-initialize if these change
    
    const value = React.useMemo(() => ({
      initialized,
      updateUser,
    }), [initialized]);
    
    return (
      <ExperimentContext.Provider value={value}>
        {children}
      </ExperimentContext.Provider>
    );
  }
  
  // Hook to use the experiment context
  function useExperimentation() {
    return React.useContext(ExperimentContext);
  }
  
  return {
    ExperimentProvider,
    useExperimentation,
  };
}

// Export a default configuration object
export const createSdkScript = (clientKey: string): string => {
  return `
<script>
  (function() {
    // Coterie Experimentation SDK Loader
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/statsig-js@4.36.0/build/statsig-prod-web-sdk.min.js';
    s.async = true;
    s.onload = function() {
      if (typeof statsig !== 'undefined') {
        statsig.initialize('${clientKey}', {
          userID: localStorage.getItem('coterie_anonymous_id') || 'anon_' + Math.random().toString(36).substring(2, 15)
        }, {
          environment: { tier: '${process.env.NODE_ENV || 'production'}' }
        }).then(function() {
          // Check all layers for experiment code
          var allLayers = statsig.getAllLayers();
          Object.keys(allLayers).forEach(function(layerName) {
            var layer = statsig.getLayer(layerName);
            var jsCode = layer.get('jsCode', '');
            if (jsCode) {
              try {
                (new Function(jsCode))();
                console.info('[CoterieLabs] Executed experiment: ' + layerName);
              } catch (error) {
                console.error('[CoterieLabs] Error executing experiment: ' + layerName, error);
              }
            }
          });
        });
      }
    };
    document.head.appendChild(s);
  })();
</script>
`;
};