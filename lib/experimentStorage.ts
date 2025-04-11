import { Experiment } from "@/types/experiment";
import { supabase, mapRowToExperiment, mapExperimentToRow, isSupabaseAvailable } from "@/lib/supabase";

/**
 * Supabase implementation for experiments storage
 * 
 * This provides a persistent storage solution using Supabase.
 * It includes fallbacks to localStorage for client-side and in-memory for server-side when needed.
 */

// In-memory fallback for server-side usage or when Supabase is unavailable
let inMemoryExperiments: Record<string, Experiment> = {};

/**
 * Initialize the experiments storage
 */
export async function initializeStorage(): Promise<void> {
  // Only do this once to avoid resetting data on hot reloads
  if (Object.keys(inMemoryExperiments).length > 0) {
    return;
  }

  // Initialize empty in-memory store (no defaults)
  inMemoryExperiments = {};
  
  // Skip Supabase if it's not available
  if (!isSupabaseAvailable) {
    console.log('Supabase not available, using only local storage');
    return;
  }

  try {
    // Check if we have any experiments in Supabase
    const { data, error } = await supabase
      .from('experiments')
      .select('count')
      .single();

    if (error) {
      console.error('Failed to check Supabase experiments count:', error);
      return;
    }

    console.log(`Supabase initialized with ${data?.count || 0} experiments`);
  } catch (e) {
    console.error('Failed to initialize Supabase storage:', e);
  }
}

/**
 * Get all experiments
 */
export async function getAllExperiments(): Promise<Experiment[]> {
  // Skip Supabase if it's not available
  if (!isSupabaseAvailable) {
    console.log('Supabase not available, falling back to local storage');
    return getLocalExperiments();
  }

  try {
    const { data, error } = await supabase
      .from('experiments')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return (data || []).map(mapRowToExperiment);
  } catch (e) {
    console.error('Failed to retrieve experiments from Supabase:', e);
    return getLocalExperiments();
  }
}

/**
 * Helper to get experiments from local storage sources
 */
function getLocalExperiments(): Experiment[] {
  // Try localStorage first if in browser
  if (typeof window !== 'undefined') {
    try {
      const storageData = localStorage.getItem('coterie_experiments');
      if (storageData) {
        const parsed = JSON.parse(storageData);
        return Object.values(parsed);
      }
    } catch (localError) {
      console.error('Failed to retrieve from localStorage:', localError);
    }
  }
  
  // Fall back to in-memory store
  return Object.values(inMemoryExperiments);
}

/**
 * Get a single experiment by ID
 */
export async function getExperimentById(id: string): Promise<Experiment | null> {
  console.log(`[getExperimentById] Fetching experiment with ID: ${id}`);
  
  // Skip Supabase if it's not available
  if (!isSupabaseAvailable) {
    console.log(`[getExperimentById] Supabase not available, checking local storage for ID: ${id}`);
    return getLocalExperimentById(id);
  }

  try {
    console.log(`[getExperimentById] Querying Supabase for experiment with ID: ${id}`);
    
    // First list all experiment IDs in Supabase to see if there might be format issues
    const { data: allExps, error: listError } = await supabase
      .from('experiments')
      .select('id')
      .limit(10);
      
    if (!listError && allExps) {
      console.log(`[getExperimentById] Available experiment IDs in Supabase:`, 
        allExps.map(exp => exp.id));
    }
    
    // Now try to get the specific experiment
    const { data, error } = await supabase
      .from('experiments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found error
        console.log(`[getExperimentById] Experiment ${id} not found in Supabase, trying local storage`);
        return getLocalExperimentById(id);
      }
      console.error(`[getExperimentById] Supabase error for experiment ${id}:`, error);
      throw error;
    }

    console.log(`[getExperimentById] Successfully found experiment ${id} in Supabase`);
    return mapRowToExperiment(data);
  } catch (e) {
    console.error(`[getExperimentById] Failed to retrieve experiment ${id} from Supabase:`, e);
    return getLocalExperimentById(id);
  }
}

/**
 * Helper to get an experiment by ID from local storage
 */
function getLocalExperimentById(id: string): Experiment | null {
  // Try different ID formats to handle potential mismatches
  const idVariations = [
    id,                                // Original ID
    id.startsWith('exp-statsig-') ? id.replace('exp-statsig-', '') : id,  // Remove prefix
    id.startsWith('exp-') ? id : `exp-${id}`,  // Add prefix
    !id.startsWith('exp-') && !id.startsWith('statsig-') ? `statsig-${id}` : id  // Add statsig prefix
  ];
  
  console.log(`[getLocalExperimentById] Trying ID variations:`, idVariations);
  
  // Try localStorage first if in browser
  if (typeof window !== 'undefined') {
    try {
      const storageData = localStorage.getItem('coterie_experiments');
      if (storageData) {
        const parsed = JSON.parse(storageData);
        console.log(`[getLocalExperimentById] Available local IDs:`, Object.keys(parsed));
        
        // Try all ID variations
        for (const variation of idVariations) {
          if (parsed[variation]) {
            console.log(`[getLocalExperimentById] Found experiment with ID variation: ${variation}`);
            return parsed[variation];
          }
        }
        
        // Also check if any experiment has matching statsigId
        const matchByStatsigId = Object.values(parsed).find(
          (exp: any) => exp.statsigId === id
        );
        
        if (matchByStatsigId) {
          console.log(`[getLocalExperimentById] Found experiment by matching statsigId: ${id}`);
          return matchByStatsigId;
        }
      }
    } catch (localError) {
      console.error(`[getLocalExperimentById] Failed to retrieve experiment ${id} from localStorage:`, localError);
    }
  }
  
  // Try in-memory store with all variations
  for (const variation of idVariations) {
    if (inMemoryExperiments[variation]) {
      console.log(`[getLocalExperimentById] Found experiment in memory with ID variation: ${variation}`);
      return inMemoryExperiments[variation];
    }
  }
  
  // Also check in-memory by statsigId
  const matchByStatsigId = Object.values(inMemoryExperiments).find(
    exp => exp.statsigId === id
  );
  
  if (matchByStatsigId) {
    console.log(`[getLocalExperimentById] Found experiment in memory by matching statsigId: ${id}`);
    return matchByStatsigId;
  }
  
  console.log(`[getLocalExperimentById] No experiment found for ID ${id} or any variations`);
  return null;
}

/**
 * Create a new experiment
 */
export async function createExperiment(experiment: Omit<Experiment, 'id'>): Promise<Experiment> {
  // Use the Statsig ID directly if available, otherwise generate a local ID
  const id = experiment.statsigId || `exp-${Math.floor(Math.random() * 10000)}`;
  
  const newExperiment: Experiment = {
    ...experiment,
    id
  };

  // Always update fallback stores
  updateFallbackStores(newExperiment);

  // Skip Supabase if it's not available
  if (!isSupabaseAvailable) {
    console.log('Supabase not available, creating experiment in local storage only');
    return newExperiment;
  }

  try {
    const row = mapExperimentToRow(newExperiment);
    const { error } = await supabase
      .from('experiments')
      .insert(row);

    if (error) {
      console.error('Supabase error creating experiment:', error);
      throw error;
    }
    
    return newExperiment;
  } catch (e) {
    console.error('Failed to save experiment to Supabase:', e);
    
    // Since we already updated the fallback stores, we can return the experiment
    // even though the Supabase insert failed
    return newExperiment;
  }
}

/**
 * Update an existing experiment
 */
export async function updateExperiment(id: string, experiment: Partial<Experiment>): Promise<Experiment | null> {
  // Get the current experiment first
  const currentExperiment = await getExperimentById(id);
  
  if (!currentExperiment) {
    console.warn(`Experiment ${id} not found, cannot update`);
    return null;
  }
  
  // Update the experiment with new data
  const updatedExperiment = {
    ...currentExperiment,
    ...experiment,
    updatedAt: new Date().toISOString()
  };

  // Always update fallback stores
  updateFallbackStores(updatedExperiment);

  // Skip Supabase if it's not available
  if (!isSupabaseAvailable) {
    console.log(`Supabase not available, updating experiment ${id} in local storage only`);
    return updatedExperiment;
  }

  try {
    const row = mapExperimentToRow(updatedExperiment);
    const { error } = await supabase
      .from('experiments')
      .update(row)
      .eq('id', id);

    if (error) {
      console.error(`Supabase error updating experiment ${id}:`, error);
      throw error;
    }
    
    return updatedExperiment;
  } catch (e) {
    console.error(`Failed to update experiment ${id} in Supabase:`, e);
    
    // Since we already updated the fallback stores and have the updated experiment,
    // we can return it even though the Supabase update failed
    return updatedExperiment;
  }
}

/**
 * Delete an experiment
 */
export async function deleteExperiment(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('experiments')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    // Also delete from fallback stores
    deleteFallbackStores(id);
    
    return true;
  } catch (e) {
    console.error(`Failed to delete experiment ${id} from Supabase:`, e);
    
    // Fallback to localStorage or in-memory store
    deleteFallbackStores(id);
    
    return true;
  }
}

/**
 * Archive an experiment
 */
export async function archiveExperiment(id: string): Promise<Experiment | null> {
  return updateExperiment(id, { 
    status: "archived", 
    updatedAt: new Date().toISOString()
  });
}

/**
 * Publish an experiment
 */
export async function publishExperiment(id: string): Promise<Experiment | null> {
  const now = new Date().toISOString();
  return updateExperiment(id, { 
    status: "published", 
    updatedAt: now,
    publishedAt: now
  });
}

// Helper functions for fallback storage

function updateFallbackStores(experiment: Experiment): void {
  // Update in-memory store
  inMemoryExperiments[experiment.id] = experiment;
  
  // Update localStorage if available
  if (typeof window !== 'undefined') {
    try {
      const data = localStorage.getItem('coterie_experiments');
      const experiments = data ? JSON.parse(data) : {};
      experiments[experiment.id] = experiment;
      localStorage.setItem('coterie_experiments', JSON.stringify(experiments));
    } catch (e) {
      console.error('Failed to update localStorage:', e);
    }
  }
}

function deleteFallbackStores(id: string): void {
  // Delete from in-memory store
  delete inMemoryExperiments[id];
  
  // Delete from localStorage if available
  if (typeof window !== 'undefined') {
    try {
      const data = localStorage.getItem('coterie_experiments');
      if (data) {
        const experiments = JSON.parse(data);
        delete experiments[id];
        localStorage.setItem('coterie_experiments', JSON.stringify(experiments));
      }
    } catch (e) {
      console.error('Failed to update localStorage:', e);
    }
  }
}

// Removed the default experiments and loading functions
// since we no longer need sample data for production