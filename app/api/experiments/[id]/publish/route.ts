import { NextRequest, NextResponse } from 'next/server';
import { getExperimentById, publishExperiment } from '@/lib/experimentStorage';
import { publishExperimentToStatsig } from '@/lib/statsig';

/**
 * POST /api/experiments/[id]/publish
 * Publish an experiment to Statsig and update its status
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Await params before accessing its properties
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    // Get the current experiment
    const experiment = await getExperimentById(id);
    
    if (!experiment) {
      return NextResponse.json({ error: 'Experiment not found' }, { status: 404 });
    }
    
    // Try to publish to Statsig first
    const statsigResult = await publishExperimentToStatsig(experiment);
    
    if (!statsigResult.success) {
      return NextResponse.json({ 
        error: 'Failed to publish to Statsig',
        details: statsigResult.message 
      }, { status: 500 });
    }
    
    // If successful, update the experiment with the Statsig ID and set to published
    const updatedExperiment = await publishExperiment(id);
    
    if (!updatedExperiment) {
      return NextResponse.json({ error: 'Failed to update experiment status' }, { status: 500 });
    }
    
    // Update with Statsig ID if provided
    if (statsigResult.statsigId) {
      updatedExperiment.statsigId = statsigResult.statsigId;
    }
    
    return NextResponse.json({
      experiment: updatedExperiment,
      message: statsigResult.message
    });
  } catch (error) {
    console.error(`Failed to publish experiment ${resolvedParams.id}:`, error);
    return NextResponse.json({ 
      error: 'Failed to publish experiment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}