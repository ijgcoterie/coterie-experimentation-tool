'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ExperimentAnalytics } from "@/lib/statsig";

export default function ExperimentAnalyticsPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const { id } = React.use(params);
  const [analytics, setAnalytics] = useState<ExperimentAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Fetch analytics data for this experiment
    const fetchAnalytics = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/analytics?id=${id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Analytics data not found for this experiment");
          }
          throw new Error(`Error fetching analytics: ${response.status}`);
        }
        
        const data = await response.json();
        setAnalytics(data);
      } catch (err) {
        console.error('Failed to fetch experiment analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analytics data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAnalytics();
  }, [id]);
  
  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" role="status">
          <span className="sr-only">Loading...</span>
        </div>
        <p className="mt-2 text-gray-500 dark:text-gray-400">Loading analytics data...</p>
      </div>
    );
  }
  
  if (error || !analytics) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
          <Link href="/analytics" className="hover:text-gray-700 dark:hover:text-gray-300">
            Analytics
          </Link>
          <span>→</span>
          <span>Error</span>
        </div>
        
        <div className="bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 p-4 rounded-md mb-6">
          {error || "Failed to load analytics data for this experiment"}
        </div>
        
        <Link href="/analytics" className="text-blue-600 dark:text-blue-400 hover:underline">
          Back to Analytics
        </Link>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
        <Link href="/analytics" className="hover:text-gray-700 dark:hover:text-gray-300">
          Analytics
        </Link>
        <span>→</span>
        <span>{analytics.name}</span>
      </div>
      
      {/* Experiment Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">{analytics.name}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Started {format(new Date(analytics.startDate), "MMM d, yyyy")}
            {analytics.endDate && ` • Ended ${format(new Date(analytics.endDate), "MMM d, yyyy")}`}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            analytics.status === 'running'
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
              : analytics.status === 'completed'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
          }`}>
            {analytics.status.charAt(0).toUpperCase() + analytics.status.slice(1)}
          </span>
          
          <Link 
            href={`/experiments/${analytics.id}`} 
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            View Experiment Details
          </Link>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            Total Users
          </h2>
          <p className="text-2xl font-semibold">
            {analytics.totalUsers.toLocaleString()}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            Duration
          </h2>
          <p className="text-2xl font-semibold">
            {analytics.endDate 
              ? `${Math.round((new Date(analytics.endDate).getTime() - new Date(analytics.startDate).getTime()) / (1000 * 60 * 60 * 24))} days`
              : `${Math.round((new Date().getTime() - new Date(analytics.startDate).getTime()) / (1000 * 60 * 60 * 24))} days (ongoing)`
            }
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            Significant Metrics
          </h2>
          <p className="text-2xl font-semibold">
            {analytics.variants[1].metrics.filter(m => m.isSignificant).length} of {analytics.variants[1].metrics.length}
          </p>
        </div>
      </div>
      
      {/* User Allocation Section */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">User Allocation</h2>
        
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-grow">
            <div className="h-6 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              {analytics.variants.map((variant, index) => {
                // Calculate width percentage
                const percentage = (variant.users / analytics.totalUsers) * 100;
                
                // Assign colors
                const colors = [
                  'bg-blue-500',
                  'bg-green-500',
                  'bg-purple-500',
                  'bg-yellow-500',
                  'bg-red-500',
                ];
                
                return (
                  <div 
                    key={variant.name}
                    className={`h-full ${colors[index % colors.length]}`}
                    style={{ 
                      width: `${percentage}%`, 
                      float: 'left' 
                    }}
                  />
                );
              })}
            </div>
          </div>
          <div className="text-sm font-medium">
            {analytics.totalUsers.toLocaleString()} total users
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analytics.variants.map((variant, index) => {
            // Assign colors
            const colors = [
              'bg-blue-500',
              'bg-green-500',
              'bg-purple-500',
              'bg-yellow-500',
              'bg-red-500',
            ];
            
            // Calculate percentage
            const percentage = ((variant.users / analytics.totalUsers) * 100).toFixed(1);
            
            return (
              <div 
                key={variant.name}
                className="flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className={`w-4 h-4 rounded-full ${colors[index % colors.length]} mr-3`}></div>
                <div>
                  <p className="font-medium">{variant.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {variant.users.toLocaleString()} users ({percentage}%)
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Metrics Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Performance Metrics</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead>
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Metric
                </th>
                {analytics.variants.map(variant => (
                  <th key={variant.name} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {variant.name}
                  </th>
                ))}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Lift
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              {analytics.variants[0].metrics.map((metric, metricIndex) => (
                <tr key={metric.name} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {metric.name}
                  </td>
                  
                  {/* Values for each variant */}
                  {analytics.variants.map(variant => {
                    const variantMetric = variant.metrics[metricIndex];
                    return (
                      <td key={`${variant.name}-${metric.name}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {/* Format based on metric type */}
                        {metric.name.toLowerCase().includes('rate') 
                          ? `${(variantMetric.value * 100).toFixed(2)}%` 
                          : metric.name.toLowerCase().includes('$')
                          ? `$${variantMetric.value.toFixed(2)}`
                          : variantMetric.value.toFixed(2)}
                      </td>
                    );
                  })}
                  
                  {/* Lift column (compare treatment to control) */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {(() => {
                      // Get control and treatment metric
                      const treatment = analytics.variants.find(v => v.name === 'Treatment')?.metrics[metricIndex];
                      const control = analytics.variants.find(v => v.name === 'Control')?.metrics[metricIndex];
                      
                      if (!treatment || !control || treatment.delta === undefined) {
                        return "—";
                      }
                      
                      const lift = treatment.delta * 100;
                      const isPositive = lift > 0;
                      
                      // Format and style the lift value
                      return (
                        <span className={`font-medium ${
                          isPositive 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {isPositive ? '+' : ''}{lift.toFixed(2)}%
                        </span>
                      );
                    })()}
                  </td>
                  
                  {/* Significance status */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {(() => {
                      // Get the treatment metric for this row
                      const treatment = analytics.variants.find(v => v.name === 'Treatment')?.metrics[metricIndex];
                      
                      if (!treatment || treatment.isSignificant === undefined) {
                        return "—";
                      }
                      
                      return treatment.isSignificant ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          Significant
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                          Inconclusive
                        </span>
                      );
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Notes about significance and interpretation */}
        <div className="mt-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-sm font-medium mb-2">Notes on Interpretation</h3>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <li>• <strong>Significant</strong> results indicate that the observed difference is statistically significant (p &lt; 0.05).</li>
            <li>• <strong>Inconclusive</strong> results may become significant with more data or may indicate no real difference exists.</li>
            <li>• Positive lifts indicate the treatment is outperforming the control for that metric.</li>
            <li>• Data is refreshed daily from Statsig.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}