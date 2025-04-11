import { NextRequest, NextResponse } from 'next/server';
import { getExperimentById, archiveExperiment } from '@/lib/experimentStorage';

/**
 * POST /api/experiments/[id]/archive
 * Archive an experiment
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
    
    // Archive the experiment
    const archivedExperiment = await archiveExperiment(id);
    
    if (!archivedExperiment) {
      return NextResponse.json({ error: 'Failed to archive experiment' }, { status: 500 });
    }
    
    return NextResponse.json({
      experiment: archivedExperiment,
      message: 'Experiment archived successfully'
    });
  } catch (error) {
    console.error(`Failed to archive experiment ${params.id}:`, error);
    return NextResponse.json({ 
      error: 'Failed to archive experiment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}