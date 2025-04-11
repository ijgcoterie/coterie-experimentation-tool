'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ExperimentAnalytics } from "@/lib/statsig";

export default function AnalyticsPage() {
  const [experiments, setExperiments] = useState<ExperimentAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Fetch analytics data
    const fetchAnalytics = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/analytics');
        
        if (!response.ok) {
          throw new Error(`Error fetching analytics: ${response.status}`);
        }
        
        const data = await response.json();
        setExperiments(data);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
        setError('Failed to load analytics data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAnalytics();
  }, []);
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Experiment Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Performance metrics and insights for your Statsig experiments
          </p>
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
          <p className="mt-2 text-gray-500 dark:text-gray-400">Loading analytics data...</p>
        </div>
      ) : (
        <>
          {/* Analytics Dashboard */}
          {experiments.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg text-center">
              <p className="text-gray-500 dark:text-gray-400">No experiment analytics available</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Publish experiments to Statsig to collect analytics data
              </p>
              <Link href="/experiments" className="text-blue-600 dark:text-blue-400 hover:underline mt-4 inline-block">
                Go to Experiments
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {experiments.map((experiment) => (
                <ExperimentAnalyticsCard key={experiment.id} experiment={experiment} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ExperimentAnalyticsCard({ experiment }: { experiment: ExperimentAnalytics }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-medium">{experiment.name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Started {format(new Date(experiment.startDate), "MMM d, yyyy")}
              {experiment.endDate && ` • Ended ${format(new Date(experiment.endDate), "MMM d, yyyy")}`}
            </p>
          </div>
          <div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              experiment.status === 'running'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                : experiment.status === 'completed'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
            }`}>
              {experiment.status.charAt(0).toUpperCase() + experiment.status.slice(1)}
            </span>
          </div>
        </div>
      </div>
      
      {/* User allocation */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <h3 className="text-sm font-medium mb-2">User Allocation</h3>
        <div className="flex items-center space-x-4">
          <div className="flex-grow">
            <div className="h-4 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              {experiment.variants.map((variant, index) => {
                // Calculate width percentage
                const percentage = (variant.users / experiment.totalUsers) * 100;
                
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
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {experiment.totalUsers.toLocaleString()} users
          </div>
        </div>
        
        <div className="mt-2 flex flex-wrap gap-3">
          {experiment.variants.map((variant, index) => {
            // Assign colors
            const colors = [
              'bg-blue-500',
              'bg-green-500',
              'bg-purple-500',
              'bg-yellow-500',
              'bg-red-500',
            ];
            
            // Calculate percentage
            const percentage = ((variant.users / experiment.totalUsers) * 100).toFixed(1);
            
            return (
              <div key={variant.name} className="flex items-center">
                <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]} mr-1`}></div>
                <span className="text-sm font-medium">{variant.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                  ({percentage}% • {variant.users.toLocaleString()} users)
                </span>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Metrics */}
      <div className="p-4">
        <h3 className="text-sm font-medium mb-3">Key Metrics</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Metric
                </th>
                {experiment.variants.map(variant => (
                  <th key={variant.name} className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {variant.name}
                  </th>
                ))}
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Lift
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {experiment.variants[0].metrics.map((metric, metricIndex) => (
                <tr key={metric.name} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-3 py-3 whitespace-nowrap text-sm font-medium">
                    {metric.name}
                  </td>
                  
                  {/* Values for each variant */}
                  {experiment.variants.map(variant => {
                    const variantMetric = variant.metrics[metricIndex];
                    return (
                      <td key={`${variant.name}-${metric.name}`} className="px-3 py-3 whitespace-nowrap text-sm">
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
                  <td className="px-3 py-3 whitespace-nowrap text-sm">
                    {(() => {
                      // Get control and treatment metric
                      const treatment = experiment.variants.find(v => v.name === 'Treatment')?.metrics[metricIndex];
                      const control = experiment.variants.find(v => v.name === 'Control')?.metrics[metricIndex];
                      
                      if (!treatment || !control || treatment.delta === undefined) {
                        return "—";
                      }
                      
                      const lift = treatment.delta * 100;
                      const isPositive = lift > 0;
                      const isSignificant = treatment.isSignificant;
                      
                      // Format and style the lift value
                      return (
                        <span className={`font-medium ${
                          isPositive 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {isPositive ? '+' : ''}{lift.toFixed(2)}%
                          {isSignificant && (
                            <span className="ml-1 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 px-1.5 py-0.5 rounded">
                              Significant
                            </span>
                          )}
                        </span>
                      );
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* View details link */}
        <div className="mt-4 text-right">
          <Link 
            href={`/experiments/${experiment.id}`}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 hover:underline"
          >
            View Experiment Details →
          </Link>
        </div>
      </div>
    </div>
  );
}