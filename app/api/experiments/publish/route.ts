import { NextRequest, NextResponse } from 'next/server';
import { createExperiment } from '@/lib/experimentStorage';
import { publishExperimentToStatsig } from '@/lib/statsig';

/**
 * POST /api/experiments/publish
 * Creates a new experiment and publishes it to Statsig directly
 * This avoids the need for pre-creating an experiment before publishing
 */
export async function POST(req: NextRequest) {
  try {
    // Get experiment data from request body
    const experimentData = await req.json();
    
    // Add timestamps for when we create the local experiment
    const now = new Date().toISOString();
    
    // Create the minimal experiment object required for Statsig
    // We only need name and description to create a new experiment in Statsig
    const statsigMinimalData = {
      name: experimentData.name,
      description: experimentData.description,
      // Add other required fields for Statsig format conversion
      targeting: experimentData.targeting,
      variations: experimentData.variations, // Add variations for multi-variate tests
      code: experimentData.code, // Keep for backward compatibility
      status: 'published'
    };
    
    console.log("Publishing experiment with variations:", {
      name: experimentData.name,
      variationCount: experimentData.variations?.length || 0,
      variations: experimentData.variations?.map(v => ({name: v.name, weight: v.weight})) || []
    });
    
    // Try to publish to Statsig first to get a Statsig-generated ID
    const statsigResult = await publishExperimentToStatsig(statsigMinimalData);
    
    if (!statsigResult.success) {
      return NextResponse.json({ 
        error: 'Failed to publish to Statsig',
        details: statsigResult.message 
      }, { status: 500 });
    }
    
    // If successfully published to Statsig, save to our database with the Statsig ID as our primary ID
    const finalExperiment = await createExperiment({
      ...experimentData,
      status: 'published',
      statsigId: statsigResult.statsigId, // This will now be used as our primary ID too
      createdAt: now,
      updatedAt: now,
      publishedAt: now,
    });
    
    return NextResponse.json({
      success: true,
      experiment: finalExperiment,
      message: statsigResult.message || "Experiment successfully created and published to Statsig"
    });
  } catch (error) {
    console.error("Failed to publish new experiment:", error);
    return NextResponse.json({ 
      error: 'Failed to publish experiment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}