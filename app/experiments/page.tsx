'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import Button from "@/components/ui/Button";
import StatsigImport from "@/components/experiments/StatsigImport";
import { Experiment } from "@/types/experiment";

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Fetch experiments from the API
    const fetchExperiments = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/experiments');
        
        if (!response.ok) {
          throw new Error(`Error fetching experiments: ${response.status}`);
        }
        
        const data = await response.json();
        setExperiments(data);
      } catch (err) {
        console.error('Failed to fetch experiments:', err);
        setError('Failed to load experiments. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchExperiments();
  }, []);
  
  // Archives an experiment
  const handleArchive = async (id: string) => {
    if (!confirm('Are you sure you want to archive this experiment?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/experiments/${id}/archive`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`Error archiving experiment: ${response.status}`);
      }
      
      // Update the local state with the archived experiment
      const data = await response.json();
      setExperiments(prevExperiments => 
        prevExperiments.map(exp => 
          exp.id === id ? data.experiment : exp
        )
      );
    } catch (err) {
      console.error('Failed to archive experiment:', err);
      alert('Failed to archive experiment. Please try again.');
    }
  };
  
  // Filter experiments by status
  const draftExperiments = experiments.filter(exp => exp.status === 'draft');
  const publishedExperiments = experiments.filter(exp => exp.status === 'published');
  const archivedExperiments = experiments.filter(exp => exp.status === 'archived');

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Experiments</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create, manage, and analyze client-side experiments
          </p>
        </div>
        <div className="flex gap-3">
          <StatsigImport 
            onImport={(importedExperiment) => {
              // Add the imported experiment to the list
              setExperiments(prev => [importedExperiment, ...prev]);
            }}
          />
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
          <p className="mt-2 text-gray-500 dark:text-gray-400">Loading experiments...</p>
        </div>
      ) : (
        <>
          {/* Draft experiments */}
          <div className="mb-8">
            <h2 className="text-lg font-medium mb-4">Draft Experiments</h2>
            {draftExperiments.length === 0 ? (
              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg text-center">
                <p className="text-gray-500 dark:text-gray-400">No draft experiments</p>
                <Link href="/experiments/new" className="text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block">
                  Create a new experiment
                </Link>
              </div>
            ) : (
              <div className="border border-border bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Last Updated
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                    {draftExperiments.map((experiment) => (
                      <tr key={experiment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
                              {experiment.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {experiment.description.length > 60 
                                ? `${experiment.description.substring(0, 60)}...` 
                                : experiment.description}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                            Draft
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {format(new Date(experiment.updatedAt), "MMM d, yyyy")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex gap-4 justify-end">
                            <Link 
                              href={`/experiments/${experiment.id}`} 
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleArchive(experiment.id)}
                              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                            >
                              Archive
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* Published experiments */}
          <div className="mb-8">
            <h2 className="text-lg font-medium mb-4">Active Experiments</h2>
            {publishedExperiments.length === 0 ? (
              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg text-center">
                <p className="text-gray-500 dark:text-gray-400">No active experiments</p>
                <span className="text-sm text-gray-400 dark:text-gray-500 block mt-1">
                  Publish an experiment to see it here
                </span>
              </div>
            ) : (
              <div className="border border-border bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Published
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                    {publishedExperiments.map((experiment) => (
                      <tr key={experiment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
                              {experiment.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {experiment.description.length > 60 
                                ? `${experiment.description.substring(0, 60)}...` 
                                : experiment.description}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            Published
                          </span>
                          {experiment.statsigId && (
                            <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                              Statsig
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {experiment.publishedAt 
                            ? format(new Date(experiment.publishedAt), "MMM d, yyyy")
                            : "—"
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex gap-4 justify-end">
                            <Link 
                              href={`/experiments/${experiment.id}`} 
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              View
                            </Link>
                            <button
                              onClick={() => handleArchive(experiment.id)}
                              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                            >
                              Archive
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* Archived experiments (collapsed by default) */}
          {archivedExperiments.length > 0 && (
            <div>
              <details className="group">
                <summary className="cursor-pointer flex items-center text-lg font-medium mb-4">
                  <span>Archived Experiments</span>
                  <svg 
                    className="ml-2 h-5 w-5 text-gray-500 group-open:rotate-180 transition-transform" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                
                <div className="mt-2 border border-border bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Last Updated
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                      {archivedExperiments.map((experiment) => (
                        <tr key={experiment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
                                {experiment.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {experiment.description.length > 60 
                                  ? `${experiment.description.substring(0, 60)}...` 
                                  : experiment.description}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                              Archived
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {format(new Date(experiment.updatedAt), "MMM d, yyyy")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link 
                              href={`/experiments/${experiment.id}`} 
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </div>
          )}
        </>
      )}
    </div>
  );
}