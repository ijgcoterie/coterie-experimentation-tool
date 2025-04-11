import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllExperiments, 
  getExperimentById, 
  createExperiment, 
  updateExperiment,
  deleteExperiment,
  archiveExperiment,
  publishExperiment,
  initializeStorage
} from '@/lib/experimentStorage';
import { publishExperimentToStatsig } from '@/lib/statsig';
import { Experiment } from '@/types/experiment';

// Initialize the storage
initializeStorage();

/**
 * GET /api/experiments
 * Get all experiments
 */
export async function GET(req: NextRequest) {
  try {
    // Check if we're getting a specific experiment by ID from the query
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (id) {
      const experiment = await getExperimentById(id);
      
      if (!experiment) {
        return NextResponse.json({ error: 'Experiment not found' }, { status: 404 });
      }
      
      return NextResponse.json(experiment);
    }
    
    // Otherwise, get all experiments
    const experiments = await getAllExperiments();
    return NextResponse.json(experiments);
  } catch (error) {
    console.error('Failed to get experiments:', error);
    return NextResponse.json({ error: 'Failed to get experiments' }, { status: 500 });
  }
}

/**
 * POST /api/experiments
 * Create a new experiment
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const now = new Date().toISOString();
    const newExperiment = await createExperiment({
      ...body,
      createdAt: now,
      updatedAt: now,
      status: body.status || 'draft'
    });
    
    return NextResponse.json(newExperiment, { status: 201 });
  } catch (error) {
    console.error('Failed to create experiment:', error);
    return NextResponse.json({ error: 'Failed to create experiment' }, { status: 500 });
  }
}

/**
 * PUT /api/experiments?id=exp-123
 * Update an existing experiment
 */
export async function PUT(req: NextRequest) {
  try {
    const url = new URL(req.url);
    let id = url.searchParams.get('id');
    
    if (!id) {
      console.log('PUT request missing experiment ID');
      return NextResponse.json({ error: 'Missing experiment ID' }, { status: 400 });
    }
    
    // Log the raw ID for debugging
    console.log(`Initial experiment ID from URL: ${id}`);
    
    // Normalize ID format if needed
    // This handles potential inconsistencies in how IDs are stored
    if (id.startsWith('exp-statsig-')) {
      const statsigId = id.replace('exp-statsig-', '');
      console.log(`Converting exp-statsig prefix to direct statsigId: ${statsigId}`);
      id = statsigId;
    }
    
    console.log(`Normalized ID for update: ${id}`);
    
    // First check if the experiment exists
    const existingExperiment = await getExperimentById(id);
    if (!existingExperiment) {
      console.log(`Experiment with ID ${id} not found`);
      return NextResponse.json({ 
        error: 'Experiment not found',
        message: `No experiment found with ID ${id}`
      }, { status: 404 });
    }
    
    const body = await req.json();
    console.log(`Updating experiment ${id} with data:`, JSON.stringify(body).substring(0, 100) + '...');
    
    const updatedExperiment = await updateExperiment(id, body);
    
    if (!updatedExperiment) {
      console.error(`Failed to update experiment ${id}, returned null`);
      return NextResponse.json({ 
        error: 'Failed to update experiment',
        message: 'Update operation failed'
      }, { status: 500 });
    }
    
    console.log(`Successfully updated experiment ${id}`);
    return NextResponse.json(updatedExperiment);
  } catch (error) {
    console.error('Failed to update experiment:', error);
    return NextResponse.json({ 
      error: 'Failed to update experiment',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/experiments?id=exp-123
 * Delete an experiment
 */
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Missing experiment ID' }, { status: 400 });
    }
    
    const success = await deleteExperiment(id);
    
    if (!success) {
      return NextResponse.json({ error: 'Experiment not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete experiment:', error);
    return NextResponse.json({ error: 'Failed to delete experiment' }, { status: 500 });
  }
}