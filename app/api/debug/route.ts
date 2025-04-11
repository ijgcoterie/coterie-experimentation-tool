import { NextRequest, NextResponse } from 'next/server';
import { dumpStorageState, normalizeExperimentIds } from '@/lib/debug';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/debug
 * Get debug information about the storage state
 */
export async function GET(req: NextRequest) {
  try {
    // Get debug mode from query parameter
    const url = new URL(req.url);
    const mode = url.searchParams.get('mode');
    
    // Dump storage state to console
    await dumpStorageState();
    
    if (mode === 'fix-ids') {
      // Run ID normalization
      await normalizeExperimentIds();
      return NextResponse.json({ message: 'ID normalization complete, check console for details' });
    }
    
    if (mode === 'clean-defaults') {
      // Clean up default sample experiments
      if (supabase) {
        const defaultNames = [
          'Homepage Redesign', 
          'Checkout Flow Optimization', 
          'Product Page Enhancements'
        ];
        
        for (const name of defaultNames) {
          const { error } = await supabase
            .from('experiments')
            .delete()
            .eq('name', name);
            
          if (error) {
            console.error(`Error deleting default experiment '${name}':`, error);
          } else {
            console.log(`Successfully removed default experiment: ${name}`);
          }
        }
        
        return NextResponse.json({ 
          message: 'Default experiments cleanup complete, check console for details' 
        });
      } else {
        return NextResponse.json({ 
          error: 'Supabase client not available, cannot clean up default experiments' 
        }, { status: 400 });
      }
    }
    
    // Check supabase connection
    const supabaseInfo = {
      available: !!supabase,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'configured' : 'missing'
    };
    
    return NextResponse.json({ 
      message: 'Debug information printed to console',
      supabase: supabaseInfo,
      help: 'Available modes: fix-ids, clean-defaults'
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({ error: 'Failed to get debug info' }, { status: 500 });
  }
}