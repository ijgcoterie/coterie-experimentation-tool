import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllExperimentAnalytics, 
  getExperimentAnalytics
} from '@/lib/statsig';
import { getExperimentById } from '@/lib/experimentStorage';

/**
 * GET /api/analytics
 * Get analytics data for experiments
 */
export async function GET(req: NextRequest) {
  try {
    // Check if this is a request for a specific experiment
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (id) {
      // First check if this experiment exists in our system
      const experiment = await getExperimentById(id);
      
      if (!experiment) {
        return NextResponse.json({ error: 'Experiment not found' }, { status: 404 });
      }
      
      // Determine which ID to use for fetching from Statsig
      const statsigId = experiment.statsigId || experiment.id;
      
      // Get analytics for the specific experiment
      const analytics = await getExperimentAnalytics(statsigId);
      
      if (!analytics) {
        return NextResponse.json({ 
          error: 'Analytics not available for this experiment'
        }, { status: 404 });
      }
      
      return NextResponse.json(analytics);
    }
    
    // Get analytics for all experiments
    const analyticsData = await getAllExperimentAnalytics();
    
    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error('Failed to get analytics data:', error);
    return NextResponse.json({ 
      error: 'Failed to get analytics data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}