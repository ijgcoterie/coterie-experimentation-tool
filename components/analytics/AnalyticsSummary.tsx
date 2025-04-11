'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ExperimentAnalytics } from "@/lib/statsig";

export default function AnalyticsSummary() {
  const [analytics, setAnalytics] = useState<ExperimentAnalytics[]>([]);
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
        setAnalytics(data);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
        setError('Failed to load analytics data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAnalytics();
  }, []);
  
  // Get running experiments
  const runningExperiments = analytics.filter(exp => exp.status === 'running');
  
  // Get total users across all experiments
  const totalUsers = analytics.reduce((sum, exp) => sum + exp.totalUsers, 0);
  
  // Calculate average metrics
  const calculateAverageMetrics = () => {
    if (analytics.length === 0) return [];
    
    // Get metrics from first experiment
    const metricNames = analytics[0].variants[0].metrics.map(m => m.name);
    
    // Calculate average lifts for each metric
    return metricNames.map(metricName => {
      // Filter to experiments that have this metric
      const relevantExperiments = analytics.filter(exp => 
        exp.variants[0].metrics.some(m => m.name === metricName)
      );
      
      // Calculate average lift
      const treatmentMetrics = relevantExperiments.map(exp => {
        const treatmentVariant = exp.variants.find(v => v.name === 'Treatment');
        const metric = treatmentVariant?.metrics.find(m => m.name === metricName);
        return metric?.delta || 0;
      });
      
      const averageLift = treatmentMetrics.reduce((sum, delta) => sum + delta, 0) / treatmentMetrics.length;
      
      return {
        name: metricName,
        lift: averageLift
      };
    });
  };
  
  const averageMetrics = calculateAverageMetrics();
  
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-[#DCE0E6] dark:border-gray-800 rounded-[8px] p-4 shadow-[0px_4px_16px_0px_rgba(0,0,0,0.04)]">
        <h2 className="text-lg font-medium mb-4">Analytics Overview</h2>
        <div className="flex justify-center py-6">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-[#DCE0E6] dark:border-gray-800 rounded-[8px] p-4 shadow-[0px_4px_16px_0px_rgba(0,0,0,0.04)]">
        <h2 className="text-lg font-medium mb-4">Analytics Overview</h2>
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }
  
  if (analytics.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-[#DCE0E6] dark:border-gray-800 rounded-[8px] p-4 shadow-[0px_4px_16px_0px_rgba(0,0,0,0.04)]">
        <h2 className="text-lg font-medium mb-4">Analytics Overview</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No experiment analytics available yet
        </p>
        <Link href="/experiments" className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block">
          Create and publish experiments to see analytics
        </Link>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-900 border border-[#DCE0E6] dark:border-gray-800 rounded-[8px] p-4 shadow-[0px_4px_16px_0px_rgba(0,0,0,0.04)]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Analytics Overview</h2>
        <Link 
          href="/analytics"
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 hover:underline"
        >
          View All Analytics →
        </Link>
      </div>
      
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-[6px] border border-[#DCE0E6] dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">Active Experiments</p>
          <p className="text-xl font-semibold">{runningExperiments.length}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-[6px] border border-[#DCE0E6] dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Experiments</p>
          <p className="text-xl font-semibold">{analytics.length}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-[6px] border border-[#DCE0E6] dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Users</p>
          <p className="text-xl font-semibold">{totalUsers.toLocaleString()}</p>
        </div>
      </div>
      
      {/* Top experiments */}
      <div className="mb-4">
        <h3 className="text-sm font-medium mb-2">Active Experiments</h3>
        {runningExperiments.length > 0 ? (
          <div className="space-y-2">
            {runningExperiments.slice(0, 3).map(exp => (
              <Link 
                key={exp.id}
                href={`/analytics/${exp.id}`}
                className="block p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md border border-[#DCE0E6] dark:border-gray-700"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm">{exp.name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {exp.totalUsers.toLocaleString()} users
                  </span>
                </div>
              </Link>
            ))}
            {runningExperiments.length > 3 && (
              <Link 
                href="/analytics"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                +{runningExperiments.length - 3} more active experiments
              </Link>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No active experiments
          </p>
        )}
      </div>
      
      {/* Top metrics */}
      {averageMetrics.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Average Metric Performance</h3>
          <div className="space-y-2">
            {averageMetrics.slice(0, 3).map(metric => {
              const lift = metric.lift * 100;
              const isPositive = lift > 0;
              
              return (
                <div key={metric.name} className="flex justify-between items-center p-2 border border-[#DCE0E6] dark:border-gray-700 rounded-md">
                  <span className="text-sm">{metric.name}</span>
                  <span className={`text-sm font-medium ${
                    isPositive 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {isPositive ? '+' : ''}{lift.toFixed(2)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}