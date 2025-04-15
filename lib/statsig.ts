import { Experiment, TargetingCondition } from "@/types/experiment";

// Define Statsig API response types
interface StatsigExperiment {
  id: string;
  name: string;
  description?: string;
  status?: string;
  lastModifiedTime?: number;
  lastModifierID?: string;
  creatorID?: string; 
  idType?: string;
  targetingGate?: string;
  targetingGateID?: string;
  
  // For layer API responses
  variants?: {
    name: string;
    weight?: number;
    value?: {
      jsCode?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }[];
  
  // For experiment API responses
  groups?: {
    name: string;
    id?: string;
    size?: number;
    parameterValues?: {
      jsCode?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }[];
  
  layerName?: string;
  layerID?: string;
  
  // Add any other fields that might be in the real API response
  [key: string]: unknown;
}

// Used for typing API responses
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface StatsigExperimentResponse {
  message: string;
  data: StatsigExperiment[];
  pagination?: {
    itemsPerPage: number;
    pageNumber: number;
    totalItems: number;
    nextPage: string | null;
    previousPage: string | null;
  };
}

interface StatsigGatesResponse {
  gates: {
    id: string;
    name: string;
    description?: string;
    lastModifiedTime?: number;
  }[];
}

interface StatsigEnvironmentsResponse {
  environments: string[];
}

// API keys are stored in environment variables
const STATSIG_CONSOLE_API_KEY = process.env.NEXT_PUBLIC_STATSIG_CONSOLE_API_KEY || '';
const STATSIG_API_BASE_URL = 'https://api.statsig.com/console/v1';

/**
 * Fetch all experiments from Statsig
 */
export async function fetchStatsigExperiments(): Promise<Experiment[]> {
  try {
    // Make the actual API call to Statsig
    const response = await fetch(`${STATSIG_API_BASE_URL}/experiments`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'STATSIG-API-KEY': STATSIG_CONSOLE_API_KEY
      }
    });
    
    if (!response.ok) {
      // Try to read error response as JSON
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        // If we can't parse JSON, use the status text
        errorData = { message: response.statusText };
      }
      
      throw new Error(errorData.message || `API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // The actual experiments array is in data.data, not data.experiments
    if (!data || !data.data || !Array.isArray(data.data)) {
      // Return empty array instead of throwing error
      return [];
    }
    
    // Convert Statsig experiments to our application format
    return data.data.map(statsigExp => convertStatsigExperiment(statsigExp));
  } catch (error) {
    console.error("Failed to fetch Statsig experiments:", error);
    
    // If API call fails, fall back to mock data for development purposes
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockExperiments: StatsigExperiment[] = [
        {
          id: "exp-statsig-123",
          name: "Statsig Homepage Test",
          description: "A/B test for homepage layout from Statsig",
          status: "active",
          lastModifiedTime: Date.now() - 86400000, // 1 day ago
          idType: "userID",
          variants: [
            {
              name: "control",
              value: {}
            },
            {
              name: "treatment",
              value: {
                jsCode: `// This code comes from Statsig
document.querySelector('header').style.backgroundColor = '#4338ca';
document.querySelector('header').style.color = 'white';`
              }
            }
          ],
          layerName: "exp_homepage_layer"
        },
        {
          id: "exp-statsig-456",
          name: "Statsig Pricing Page",
          description: "Testing pricing page variants",
          status: "draft",
          lastModifiedTime: Date.now() - 172800000, // 2 days ago
          idType: "userID",
          targetingGate: "is_premium_user",
          variants: [
            { 
              name: "control",
              value: {}
            },
            {
              name: "treatment",
              value: {}
            }
          ]
        }
      ];
      
      return mockExperiments.map(statsigExp => convertStatsigExperiment(statsigExp));
    }
    
    throw error;
  }
}

/**
 * Fetch a single experiment from Statsig by ID
 */
export async function fetchStatsigExperiment(id: string): Promise<Experiment | null> {
  try {
    // Make the actual API call to Statsig
    const response = await fetch(`${STATSIG_API_BASE_URL}/experiments/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'STATSIG-API-KEY': STATSIG_CONSOLE_API_KEY
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      const errorData = await response.json();
      throw new Error(errorData.message || `API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check if response follows the expected format
    const experimentData = data.data || data;
    return convertStatsigExperiment(experimentData);
  } catch (error) {
    console.error(`Failed to fetch Statsig experiment ${id}:`, error);
    
    // If API call fails, fall back to mock data for development purposes
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Mock data for specific experiments
      const mockExperiments: Record<string, StatsigExperiment> = {
        "exp-statsig-123": {
          id: "exp-statsig-123",
          name: "Statsig Homepage Test",
          description: "A/B test for homepage layout from Statsig",
          status: "active",
          lastModifiedTime: Date.now() - 86400000, // 1 day ago
          idType: "userID",
          variants: [
            {
              name: "control",
              value: {}
            },
            {
              name: "treatment",
              value: {
                jsCode: `// This code comes from Statsig
document.querySelector('header').style.backgroundColor = '#4338ca';
document.querySelector('header').style.color = 'white';`
              }
            }
          ],
          layerName: "exp_homepage_layer"
        },
        "exp-statsig-456": {
          id: "exp-statsig-456",
          name: "Statsig Pricing Page",
          description: "Testing pricing page variants",
          status: "draft",
          lastModifiedTime: Date.now() - 172800000, // 2 days ago
          idType: "userID",
          targetingGate: "is_premium_user",
          variants: [
            { 
              name: "control",
              value: {}
            },
            {
              name: "treatment",
              value: {}
            }
          ]
        }
      };
      
      const experiment = mockExperiments[id];
      if (!experiment) return null;
      
      return convertStatsigExperiment(experiment);
    }
    
    return null;
  }
}

/**
 * Publish an experiment to Statsig
 * Note: This function accepts either a full Experiment object or a partial object with minimal required fields
 */
export async function publishExperimentToStatsig(experiment: Partial<Experiment> & { 
  name: string; 
  description: string; 
  targeting: { 
    conditions: TargetingCondition[]; 
    environments: string[] 
  }; 
  variations?: { 
    id: string; 
    name: string; 
    code: string; 
    weight: number 
  }[];
  code?: string; // For backward compatibility
}): Promise<{ success: boolean; message?: string; statsigId?: string }> {
  try {
    // Convert our experiment format to Statsig format
    const statsigExperiment = convertToStatsigFormat(experiment);
    
    // Debug log the experiment to be sent to Statsig
    console.log("Publishing to Statsig with format:", {
      variations: experiment.variations?.map(v => ({name: v.name, weight: v.weight})),
      statsigExperiment: JSON.stringify(statsigExperiment, null, 2)
    });
    
    // Determine if this is a create or update operation
    const method = experiment.statsigId ? 'PUT' : 'POST';
    const url = experiment.statsigId 
      ? `${STATSIG_API_BASE_URL}/experiments/${experiment.statsigId}`
      : `${STATSIG_API_BASE_URL}/experiments`;
    
    // Make the actual API call to Statsig
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'STATSIG-API-KEY': STATSIG_CONSOLE_API_KEY
      },
      body: JSON.stringify(statsigExperiment)
    });
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        // If response isn't valid JSON
        throw new Error(`API error: ${response.status} - ${response.statusText}`);
      }
      
      // Log detailed error information
      console.error("Statsig API error details:", {
        status: response.status,
        statusText: response.statusText,
        errorData: JSON.stringify(errorData, null, 2),
        requestBody: JSON.stringify(statsigExperiment, null, 2),
        url,
        method
      });
      
      throw new Error(errorData.message || `API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract ID from response data
    // Check various places where the ID might be in the Statsig API response
    const statsigId = data.id || (data.data && data.data.id) || experiment.statsigId;
    
    if (!statsigId) {
      console.warn("No statsigId found in Statsig API response:", data);
    }
    
    return {
      success: true,
      message: `Experiment "${experiment.name}" successfully ${experiment.statsigId ? 'updated' : 'created'} in Statsig`,
      statsigId
    };
  } catch (error) {
    console.error("Failed to publish experiment to Statsig:", error);
    
    // If API call fails, simulate success for development purposes
    if (process.env.NODE_ENV === 'development') {
      console.log("Using mock response for development");
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In development, create a mock Statsig ID that looks like a real API-generated ID
      // For consistency, we'll make it clear this is a dev mock ID
      const statsigId = experiment.statsigId || `statsig-dev-${Math.floor(Math.random() * 10000)}`;
      
      // Log what would have been sent to Statsig
      console.log(`[DEV MODE] Would have sent to Statsig:`, {
        method: experiment.statsigId ? 'PUT' : 'POST',
        variations: experiment.variations?.length || 0,
        name: experiment.name
      });
      
      return {
        success: true,
        message: `[DEV MODE] Experiment "${experiment.name}" successfully ${experiment.statsigId ? 'updated' : 'created'} in Statsig with ${(experiment.variations?.length || 0)} variations`,
        statsigId
      };
    }
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to publish experiment to Statsig'
    };
  }
}

/**
 * Get available Statsig environments
 */
export async function getStatsigEnvironments(): Promise<string[]> {
  try {
    // Check if API key is available before making the call
    if (!STATSIG_CONSOLE_API_KEY) {
      console.warn("Statsig API key not found, using default environments");
      return ["development", "staging", "production"];
    }

    // Make the actual API call to Statsig
    const response = await fetch(`${STATSIG_API_BASE_URL}/environments`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'STATSIG-API-KEY': STATSIG_CONSOLE_API_KEY
      }
    });
    
    if (!response.ok) {
      // Don't try to parse JSON if the response isn't OK
      console.warn(`Failed to fetch environments: ${response.status}`);
      return ["development", "staging", "production"];
    }
    
    try {
      const data: StatsigEnvironmentsResponse = await response.json();
      if (data && Array.isArray(data.environments) && data.environments.length > 0) {
        return data.environments;
      } else {
        console.warn("Empty or invalid environments response from Statsig");
        return ["development", "staging", "production"];
      }
    } catch (parseError) {
      console.error("Failed to parse Statsig environments response:", parseError);
      return ["development", "staging", "production"];
    }
  } catch (error) {
    console.error("Failed to fetch Statsig environments:", error);
    
    // If API call fails, fall back to default environments
    return ["development", "staging", "production"];
  }
}

/**
 * Analytics data interfaces
 */
export interface ExperimentMetric {
  name: string;
  value: number;
  delta?: number;
  isSignificant?: boolean;
}

export interface ExperimentVariant {
  name: string;
  users: number;
  metrics: ExperimentMetric[];
}

export interface ExperimentAnalytics {
  id: string;
  name: string;
  totalUsers: number;
  startDate: string;
  endDate?: string;
  status: 'running' | 'completed' | 'stopped';
  variants: ExperimentVariant[];
}

/**
 * Get analytics data for a specific experiment
 * 
 * Note: This is a mock implementation that returns simulated data
 * In a real implementation, this would call the Statsig API
 */
export async function getExperimentAnalytics(experimentId: string): Promise<ExperimentAnalytics | null> {
  try {
    // In a real implementation, this would make a Statsig API call
    // const response = await fetch(`${STATSIG_API_BASE_URL}/experiments/${experimentId}/results`, {
    //   method: 'GET',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'STATSIG-API-KEY': STATSIG_CONSOLE_API_KEY
    //   }
    // });
    
    // First check if the experiment exists
    const experiment = await fetchStatsigExperiment(experimentId);
    
    if (!experiment) {
      return null;
    }
    
    // For now, generate mock data based on the experiment
    // In production, this would parse the actual Statsig response
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
    
    // Generate realistic-looking data
    const startDate = experiment.publishedAt || experiment.createdAt;
    const totalUsers = Math.floor(Math.random() * 5000) + 1000;
    const controlUsers = Math.floor(totalUsers * 0.5);
    const treatmentUsers = totalUsers - controlUsers;
    
    // Generate a few metrics
    const metrics = [
      {
        name: 'Conversion Rate',
        controlValue: (Math.random() * 0.05) + 0.1, // 10-15% conversion rate
        delta: (Math.random() * 0.1) - 0.05 // -5% to +5% change
      },
      {
        name: 'Engagement Time (min)',
        controlValue: (Math.random() * 2) + 5, // 5-7 minutes
        delta: (Math.random() * 0.4) - 0.2 // -0.2 to +0.2 minutes change
      },
      {
        name: 'Revenue per User ($)',
        controlValue: (Math.random() * 10) + 20, // $20-30
        delta: (Math.random() * 4) - 2 // -$2 to +$2 change
      }
    ];
    
    return {
      id: experimentId,
      name: experiment.name,
      totalUsers,
      startDate,
      status: 'running',
      variants: [
        {
          name: 'Control',
          users: controlUsers,
          metrics: metrics.map(m => ({
            name: m.name,
            value: m.controlValue,
            delta: 0,
            isSignificant: false
          }))
        },
        {
          name: 'Treatment',
          users: treatmentUsers,
          metrics: metrics.map(m => ({
            name: m.name,
            value: m.controlValue * (1 + m.delta),
            delta: m.delta,
            isSignificant: Math.abs(m.delta) > 0.03
          }))
        }
      ]
    };
  } catch (error) {
    console.error(`Failed to fetch analytics for experiment ${experimentId}:`, error);
    return null;
  }
}

/**
 * Get analytics data for all experiments
 */
export async function getAllExperimentAnalytics(): Promise<ExperimentAnalytics[]> {
  try {
    // Get all experiments first
    const experiments = await fetchStatsigExperiments();
    
    // Filter to just the published ones with statsigId
    const publishedExperiments = experiments.filter(
      exp => exp.status === 'published' && exp.statsigId
    );
    
    // Fetch analytics for each experiment
    const analyticsPromises = publishedExperiments.map(exp => 
      getExperimentAnalytics(exp.statsigId || exp.id)
    );
    
    // Wait for all analytics to be fetched
    const analyticsResults = await Promise.all(analyticsPromises);
    
    // Filter out any nulls
    return analyticsResults.filter((result): result is ExperimentAnalytics => result !== null);
  } catch (error) {
    console.error("Failed to fetch analytics for all experiments:", error);
    return [];
  }
}

/**
 * Get available Statsig targeting gates
 */
export async function getStatsigTargetingGates(): Promise<{ id: string; name: string }[]> {
  try {
    // Make the actual API call to Statsig
    const response = await fetch(`${STATSIG_API_BASE_URL}/gates`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'STATSIG-API-KEY': STATSIG_CONSOLE_API_KEY
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `API error: ${response.status}`);
    }
    
    const data: StatsigGatesResponse = await response.json();
    
    // Check if gates exists and is an array before mapping
    if (!data || !data.gates || !Array.isArray(data.gates)) {
      console.warn("Statsig API returned no gates or invalid format:", data);
      return [];
    }
    
    return data.gates.map(gate => ({ id: gate.id, name: gate.name }));
  } catch (error) {
    console.error("Failed to fetch Statsig targeting gates:", error);
    
    // If API call fails, fall back to mock data for development purposes
    if (process.env.NODE_ENV === 'development') {
      console.log("Using mock gates for development");
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return [
        { id: "is_premium_user", name: "Is Premium User" },
        { id: "is_beta_tester", name: "Is Beta Tester" },
        { id: "is_internal_user", name: "Is Internal User" },
        { id: "is_mobile_user", name: "Is Mobile User" }
      ];
    }
    
    // Return empty array instead of throwing error
    return [];
  }
}

// Helper function to convert Statsig experiment to our format
function convertStatsigExperiment(statsigExp: StatsigExperiment): Experiment {
  
  // Extract variations from Statsig experiment - check both formats
  let variations = [];
  
  // First check for groups format (experiment API)
  if (statsigExp.groups && Array.isArray(statsigExp.groups) && statsigExp.groups.length > 0) {
    variations = statsigExp.groups.map(group => ({
      id: group.id || `var-${Math.random().toString(36).substring(2, 9)}`,
      name: group.name.charAt(0).toUpperCase() + group.name.slice(1), // Capitalize first letter
      code: group.parameterValues?.jsCode || "",
      weight: group.size || Math.floor(100 / statsigExp.groups.length)
    }));
  } 
  // Then check for variants format (layer API)
  else if (statsigExp.variants && Array.isArray(statsigExp.variants) && statsigExp.variants.length > 0) {
    variations = statsigExp.variants.map(variant => ({
      id: `var-${Math.random().toString(36).substring(2, 9)}`,
      name: variant.name.charAt(0).toUpperCase() + variant.name.slice(1), // Capitalize first letter
      code: variant.value?.jsCode || "",
      weight: variant.weight || Math.floor(100 / statsigExp.variants.length)
    }));
  }
  // Default to standard A/B test if no variations found
  else {
    variations = [
      {
        id: `var-${Math.random().toString(36).substring(2, 9)}`,
        name: "Control",
        code: "",
        weight: 50
      },
      {
        id: `var-${Math.random().toString(36).substring(2, 9)}`,
        name: "Treatment",
        code: "",
        weight: 50
      }
    ];
  }
  
  // Log what we're extracting for debugging
  console.log("Converting Statsig experiment to our format:", {
    id: statsigExp.id,
    name: statsigExp.name,
    groupsCount: statsigExp.groups?.length || 0,
    variantsCount: statsigExp.variants?.length || 0,
    extractedVariationsCount: variations.length
  });
  
  // Extract conditions from targeting gate (handle both field names)
  const targetingGate = statsigExp.targetingGate || statsigExp.targetingGateID;
  
  const conditions: TargetingCondition[] = targetingGate
    ? [{ 
        type: "user", 
        attribute: "gate", 
        operator: "equals", 
        value: targetingGate
      }] 
    : [];
  
  // Get the creation and update times with fallbacks
  const lastModTime = statsigExp.lastModifiedTime || Date.now();
  const createdTime = lastModTime - 86400000; // Default to 1 day before modification
  
  return {
    id: statsigExp.id || `unknown-${Date.now()}`,
    name: statsigExp.name || "Unnamed Experiment",
    description: statsigExp.description || "",
    status: (statsigExp.status === "active") ? "published" : "draft",
    targeting: {
      conditions,
      environments: ["development", "staging", "production"] // Default to all environments
    },
    variations,
    createdAt: new Date(createdTime).toISOString(),
    updatedAt: new Date(lastModTime).toISOString(),
    publishedAt: statsigExp.status === "active" ? new Date(lastModTime).toISOString() : undefined,
    statsigId: statsigExp.id, // Store the Statsig ID for future updates
    statsigLayer: statsigExp.layerName || statsigExp.layerID,
    isFromStatsig: true
  };
}

// Helper function to convert our experiment format to Statsig format
function convertToStatsigFormat(experiment: Partial<Experiment> & { 
  name: string; 
  description: string; 
  targeting: { 
    conditions: TargetingCondition[]; 
    environments: string[] 
  }; 
  variations?: { 
    id: string; 
    name: string; 
    code: string; 
    weight: number 
  }[];
  code?: string; // For backward compatibility
}): Record<string, unknown> {
  // Convert variations to groups format
  const groups = [];
  
  if (experiment.variations && experiment.variations.length > 0) {
    // Map our variations to the groups format
    experiment.variations.forEach(variation => {
      const varName = variation.name.toLowerCase().replace(/\s+/g, '_');
      groups.push({
        name: variation.name,
        id: varName,
        size: variation.weight,
        parameterValues: variation.code ? { jsCode: variation.code } : {}
      });
    });
  } else if (experiment.code) {
    // Legacy format with single treatment
    groups.push(
      {
        name: "Control",
        id: "control",
        size: 50,
        parameterValues: {}
      },
      {
        name: "Treatment",
        id: "treatment",
        size: 50,
        parameterValues: {
          jsCode: experiment.code
        }
      }
    );
  } else {
    // Default if neither is provided
    groups.push({
      name: "Control",
      id: "control",
      size: 100,
      parameterValues: {}
    });
  }
  
  // Find the control group (usually the first one or one named 'control')
  const controlGroup = groups.find(g => g.name.toLowerCase().includes('control')) || groups[0];
  const controlGroupID = controlGroup?.id;
  
  // Find a targeting gate if one exists
  const targetingGateID = experiment.targeting.conditions.length > 0 
    ? experiment.targeting.conditions.find(c => c.type === "user" && c.attribute === "gate")?.value 
    : null;
  
  // Simple approach - just the minimal required fields
  return {
    name: experiment.name,
    description: experiment.description || "",
    idType: "userID",
    groups,
    ...(controlGroupID ? { controlGroupID } : {}),
    allocation: 100
  };
}