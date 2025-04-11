'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import AnalyticsSummary from "@/components/analytics/AnalyticsSummary";
import { Experiment } from "@/types/experiment";
import { ExperimentAnalytics } from "@/lib/statsig";

export default function DashboardPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [analytics, setAnalytics] = useState<ExperimentAnalytics[]>([]);
  const [isLoadingExperiments, setIsLoadingExperiments] = useState(true);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Fetch experiments
    const fetchExperiments = async () => {
      setIsLoadingExperiments(true);
      
      try {
        const response = await fetch('/api/experiments');
        
        if (!response.ok) {
          throw new Error(`Error fetching experiments: ${response.status}`);
        }
        
        const data = await response.json();
        setExperiments(data);
      } catch (err) {
        console.error('Failed to fetch experiments:', err);
        setError('Failed to load experiments data');
      } finally {
        setIsLoadingExperiments(false);
      }
    };

    // Fetch analytics data
    const fetchAnalytics = async () => {
      setIsLoadingAnalytics(true);
      
      try {
        const response = await fetch('/api/analytics');
        
        if (!response.ok) {
          throw new Error(`Error fetching analytics: ${response.status}`);
        }
        
        const data = await response.json();
        setAnalytics(data);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
        // Don't set error here to avoid showing error when just analytics fails
      } finally {
        setIsLoadingAnalytics(false);
      }
    };
    
    fetchExperiments();
    fetchAnalytics();
  }, []);

  // Get counts
  const draftCount = experiments.filter(exp => exp.status === 'draft').length;
  const publishedCount = experiments.filter(exp => exp.status === 'published').length;
  const archivedCount = experiments.filter(exp => exp.status === 'archived').length;
  
  // Get recent experiments (up to 5)
  const recentExperiments = [...experiments]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);
  
  // Format relative time
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffDay > 0) {
      return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    } else if (diffHour > 0) {
      return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    } else if (diffMin > 0) {
      return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };
  
  const isLoading = isLoadingExperiments || isLoadingAnalytics;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Overview of your experiments and performance
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/analytics">
            <Button variant="outline" className="whitespace-nowrap">View Analytics</Button>
          </Link>
          <Link href="/experiments/new">
            <Button className="whitespace-nowrap">Create Experiment</Button>
          </Link>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Loading dashboard data...</p>
        </div>
      ) : (
        <>
          {/* Status cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-900 border border-[#DCE0E6] dark:border-gray-800 rounded-[8px] p-4 shadow-[0px_4px_16px_0px_rgba(0,0,0,0.04)]">
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Experiments</h2>
              <p className="text-2xl font-semibold">{experiments.length}</p>
            </div>
            
            <div className="bg-white dark:bg-gray-900 border border-[#DCE0E6] dark:border-gray-800 rounded-[8px] p-4 shadow-[0px_4px_16px_0px_rgba(0,0,0,0.04)]">
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Active Experiments</h2>
              <p className="text-2xl font-semibold">{publishedCount}</p>
            </div>
            
            <div className="bg-white dark:bg-gray-900 border border-[#DCE0E6] dark:border-gray-800 rounded-[8px] p-4 shadow-[0px_4px_16px_0px_rgba(0,0,0,0.04)]">
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Draft Experiments</h2>
              <p className="text-2xl font-semibold">{draftCount}</p>
            </div>
            
            <div className="bg-white dark:bg-gray-900 border border-[#DCE0E6] dark:border-gray-800 rounded-[8px] p-4 shadow-[0px_4px_16px_0px_rgba(0,0,0,0.04)]">
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Archived Experiments</h2>
              <p className="text-2xl font-semibold">{archivedCount}</p>
            </div>
          </div>

          {/* Main content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent experiments */}
            <div className="bg-white dark:bg-gray-900 border border-[#DCE0E6] dark:border-gray-800 rounded-[8px] p-6 shadow-[0px_4px_16px_0px_rgba(0,0,0,0.04)]">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">Recent Experiments</h2>
                <Link 
                  href="/experiments"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 hover:underline"
                >
                  View All →
                </Link>
              </div>
              
              {recentExperiments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">No experiments yet</p>
                  <Link href="/experiments/new" className="text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block">
                    Create your first experiment
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentExperiments.map((experiment) => (
                    <div
                      key={experiment.id}
                      className="flex items-start border-b border-gray-100 dark:border-gray-800 pb-4 last:border-0 last:pb-0"
                    >
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 ${
                        experiment.status === 'published' 
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
                          : experiment.status === 'draft'
                          ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
                      }`}>
                        <span className="text-xs font-medium">
                          {experiment.status === 'published' ? 'P' : experiment.status === 'draft' ? 'D' : 'A'}
                        </span>
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between">
                          <p className="text-sm font-medium">
                            {experiment.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {getRelativeTime(experiment.updatedAt)}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                          {experiment.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {experiments.length > 5 && (
                <div className="mt-4 text-center">
                  <Link 
                    href="/experiments"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View all {experiments.length} experiments
                  </Link>
                </div>
              )}
            </div>

            {/* Analytics Summary */}
            <AnalyticsSummary />
          </div>
          
          {/* Additional metrics and insights section */}
          {analytics.length > 0 && (
            <div className="mt-8 bg-white dark:bg-gray-900 border border-[#DCE0E6] dark:border-gray-800 rounded-[8px] p-6 shadow-[0px_4px_16px_0px_rgba(0,0,0,0.04)]">
              <h2 className="text-lg font-medium mb-6">Experiment Performance</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {analytics.slice(0, 3).map((experiment) => {
                  // Find a metric with significant improvement if possible
                  const treatment = experiment.variants.find(v => v.name === 'Treatment');
                  const significantMetrics = treatment?.metrics.filter(m => m.isSignificant) || [];
                  const bestMetric = significantMetrics.length > 0 
                    ? significantMetrics.reduce((prev, current) => 
                        (current.delta || 0) > (prev.delta || 0) ? current : prev
                      ) 
                    : treatment?.metrics[0];
                    
                  return (
                    <Link 
                      key={experiment.id}
                      href={`/analytics/${experiment.id}`}
                      className="block hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-[8px] p-4 border border-[#DCE0E6] dark:border-gray-800 transition-colors shadow-[0px_4px_16px_0px_rgba(0,0,0,0.04)]"
                    >
                      <h3 className="font-medium mb-2">{experiment.name}</h3>
                      
                      <div className="flex justify-between text-sm mb-3">
                        <span className="text-gray-500 dark:text-gray-400">
                          {experiment.totalUsers.toLocaleString()} users
                        </span>
                        <span className={`${
                          experiment.status === 'running'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-blue-600 dark:text-blue-400'
                        }`}>
                          {experiment.status.charAt(0).toUpperCase() + experiment.status.slice(1)}
                        </span>
                      </div>
                      
                      {bestMetric && (
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">{bestMetric.name}</span>
                            {bestMetric.delta !== undefined && (
                              <span className={`text-sm font-medium ${
                                (bestMetric.delta > 0) 
                                  ? 'text-green-600 dark:text-green-400' 
                                  : 'text-red-600 dark:text-red-400'
                              }`}>
                                {bestMetric.delta > 0 ? '+' : ''}
                                {(bestMetric.delta * 100).toFixed(2)}%
                              </span>
                            )}
                          </div>
                          {bestMetric.isSignificant && (
                            <div className="mt-1">
                              <span className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 px-1.5 py-0.5 rounded">
                                Statistically Significant
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
              
              <div className="mt-6 text-center">
                <Link 
                  href="/analytics"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View detailed analytics →
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}