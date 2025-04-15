import { createClient } from '@supabase/supabase-js';
import { Experiment } from '@/types/experiment';

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if Supabase credentials are properly configured
const isSupabaseConfigured = supabaseUrl && supabaseKey;

// Log the status of Supabase configuration for debugging
console.log('Supabase configuration status:', {
  isConfigured: isSupabaseConfigured,
  // Show partial URL to verify it's loaded correctly without revealing full credentials
  urlPreview: supabaseUrl ? `${supabaseUrl.substring(0, 10)}...` : 'missing',
  keyAvailable: !!supabaseKey
});

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase credentials are missing. Using fallback storage mechanisms only. ' +
    'Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables.'
  );
}

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export const isSupabaseAvailable = !!supabase;

// Test Supabase connection
if (isSupabaseAvailable) {
  (async () => {
    try {
      const { data, error } = await supabase.from('experiments').select('count');
      if (error) {
        console.error('Supabase connection test failed:', error);
      } else {
        console.log('Supabase connection test succeeded:', data);
      }
    } catch (e) {
      console.error('Error testing Supabase connection:', e);
    }
  })();
}

/**
 * Schema for the 'experiments' table in Supabase:
 * 
 * id: string (primary key)
 * name: string
 * description: string
 * status: string (enum: 'draft', 'published', 'archived')
 * targeting: jsonb
 * code: text (legacy field, kept for backward compatibility)
 * variations: jsonb (new field for multi-variate tests) 
 * created_at: timestamp with time zone
 * updated_at: timestamp with time zone
 * published_at: timestamp with time zone (nullable)
 * statsig_id: string (nullable)
 * statsig_layer: string (nullable)
 * is_from_statsig: boolean (default: false)
 */

// Define types for Supabase table row
interface ExperimentRow {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'published' | 'archived';
  targeting: {
    conditions: unknown[];
    environments: string[];
  };
  code?: string; // Legacy field
  variations?: {
    id: string;
    name: string;
    code: string;
    weight: number;
  }[];
  created_at: string;
  updated_at: string;
  published_at: string | null;
  statsig_id: string | null;
  statsig_layer: string | null;
  is_from_statsig: boolean;
}

/**
 * Convert a Supabase row to an Experiment object
 */
export function mapRowToExperiment(row: ExperimentRow): Experiment {
  // Handle legacy data format by creating default variations if needed
  const variations = row.variations || [
    {
      id: `var-${Math.random().toString(36).substring(2, 9)}`,
      name: "Control",
      code: "",
      weight: 50
    },
    {
      id: `var-${Math.random().toString(36).substring(2, 9)}`,
      name: "Treatment",
      code: row.code || "",
      weight: 50
    }
  ];

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    targeting: row.targeting,
    variations,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at || undefined,
    statsigId: row.statsig_id || undefined,
    statsigLayer: row.statsig_layer || undefined,
    isFromStatsig: row.is_from_statsig || false
  };
}

/**
 * Convert an Experiment to a Supabase row format
 */
export function mapExperimentToRow(experiment: Experiment): ExperimentRow {
  // Find treatment variation for legacy code field
  const treatmentVariation = experiment.variations.find(v => 
    v.name.toLowerCase() === 'treatment' || v.name.toLowerCase() === 'variant');
  
  return {
    id: experiment.id,
    name: experiment.name,
    description: experiment.description,
    status: experiment.status,
    targeting: experiment.targeting,
    code: treatmentVariation?.code || '', // For backward compatibility
    variations: experiment.variations,
    created_at: experiment.createdAt,
    updated_at: experiment.updatedAt,
    published_at: experiment.publishedAt || null,
    statsig_id: experiment.statsigId || null,
    statsig_layer: experiment.statsigLayer || null,
    is_from_statsig: experiment.isFromStatsig || false
  };
}