/**
 * Debug utilities to help troubleshoot storage and ID issues
 */
import { supabase } from './supabase';

/**
 * Dump all relevant storage data to console to aid in debugging
 */
export async function dumpStorageState(): Promise<void> {
  console.log('======= STORAGE DEBUGGING INFO =======');
  
  // Check localStorage
  console.log('--- Local Storage Data ---');
  try {
    if (typeof window !== 'undefined') {
      const localData = localStorage.getItem('coterie_experiments');
      if (localData) {
        const parsed = JSON.parse(localData);
        console.log('Local storage experiment IDs:', Object.keys(parsed));
        console.log('Local storage experiment count:', Object.keys(parsed).length);
        console.log('Sample experiment from localStorage:', Object.values(parsed)[0]);
      } else {
        console.log('No experiments found in localStorage');
      }
    } else {
      console.log('Not in browser environment, localStorage not available');
    }
  } catch (e) {
    console.error('Error accessing localStorage:', e);
  }
  
  // Check Supabase
  console.log('--- Supabase Data ---');
  try {
    if (supabase) {
      const { data, error } = await supabase.from('experiments').select('id, name, statsigId').limit(20);
      
      if (error) {
        console.error('Supabase query error:', error);
      } else if (data) {
        console.log('Supabase experiment IDs:', data.map(exp => exp.id));
        console.log('Supabase experiment count:', data.length);
        console.log('Supabase experiments:', data);
      } else {
        console.log('No data returned from Supabase');
      }
    } else {
      console.log('Supabase client not available');
    }
  } catch (e) {
    console.error('Error querying Supabase:', e);
  }
  
  console.log('======= END DEBUGGING INFO =======');
}

/**
 * Debug function to fix ID format issues
 */
export async function normalizeExperimentIds(): Promise<void> {
  console.log('Attempting to normalize experiment IDs...');
  
  if (!supabase) {
    console.error('Supabase client not available, cannot normalize IDs');
    return;
  }
  
  try {
    // Get all experiments from Supabase
    const { data, error } = await supabase.from('experiments').select('*');
    
    if (error) {
      console.error('Failed to fetch experiments for normalization:', error);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log('No experiments found to normalize');
      return;
    }
    
    console.log(`Found ${data.length} experiments to check`);
    
    // Check each experiment for ID format issues
    for (const experiment of data) {
      const originalId = experiment.id;
      let needsUpdate = false;
      let updatedId = originalId;
      
      // Fix common ID format issues
      if (originalId.startsWith('exp-statsig-') && experiment.statsigId) {
        // If it has both exp-statsig- prefix and a statsigId field, use the statsigId directly
        updatedId = experiment.statsigId;
        needsUpdate = true;
      } else if (!experiment.statsigId && originalId.includes('statsig')) {
        // If it has statsig in the ID but no statsigId field, extract it
        const possibleStatsigId = originalId.replace('exp-statsig-', '').replace('statsig-', '');
        experiment.statsigId = possibleStatsigId;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        console.log(`Normalizing ID: ${originalId} -> ${updatedId}`);
        
        // Update the experiment with the normalized ID
        const { error: updateError } = await supabase
          .from('experiments')
          .update({ id: updatedId, statsigId: experiment.statsigId })
          .eq('id', originalId);
        
        if (updateError) {
          console.error(`Failed to update experiment ${originalId}:`, updateError);
        } else {
          console.log(`Successfully normalized experiment ${originalId} to ${updatedId}`);
        }
      }
    }
    
    console.log('ID normalization complete');
  } catch (e) {
    console.error('Error during ID normalization:', e);
  }
}