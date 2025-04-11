"use client";

import { useState, useEffect } from "react";
import { Experiment } from "@/types/experiment";
import { fetchStatsigExperiments } from "@/lib/statsig";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface StatsigImportProps {
  onImport?: (experiment: Experiment) => void;
}

export default function StatsigImport({ onImport }: StatsigImportProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [statsigExperiments, setStatsigExperiments] = useState<Experiment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const loadStatsigExperiments = async () => {
    setIsLoading(true);
    setError(null);
    
    // Check if API key is configured
    const apiKeyConfigured = !!process.env.NEXT_PUBLIC_STATSIG_CONSOLE_API_KEY;
    
    if (!apiKeyConfigured) {
      setError("Statsig API key is not configured. Please add NEXT_PUBLIC_STATSIG_CONSOLE_API_KEY to your .env.local file.");
      setIsLoading(false);
      return;
    }
    
    try {
      const experiments = await fetchStatsigExperiments();
      
      // Even if we don't get an error, but get an empty array, provide feedback
      if (experiments.length === 0) {
        setError("No experiments found in your Statsig account.");
      }
      
      setStatsigExperiments(experiments);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Failed to load experiments from Statsig. ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Load when modal is opened
  useEffect(() => {
    if (showModal) {
      loadStatsigExperiments();
    }
  }, [showModal]);

  return (
    <>
      <Button 
        variant="outline" 
        onClick={() => setShowModal(true)}
        className="w-full"
      >
        Import from Statsig
      </Button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-xl w-full max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-medium">Import Experiment from Statsig</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                &times;
              </button>
            </div>
            
            <div className="px-6 py-4 flex-1 overflow-auto">
              {isLoading ? (
                <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                  Loading experiments from Statsig...
                </div>
              ) : error ? (
                <div className="py-4 text-red-600 dark:text-red-400">
                  <h4 className="font-medium mb-2">Error Loading Experiments</h4>
                  <p className="mb-3">{error}</p>
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md mb-3 text-sm">
                    <p className="font-medium mb-1">Debugging Tips:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Open your browser console (F12) to see detailed API responses</li>
                      <li>Verify your Statsig API key is correct in your .env.local file</li>
                      <li>Check that you have experiments configured in your Statsig account</li>
                    </ul>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={loadStatsigExperiments} 
                    className="mt-2"
                    size="sm"
                  >
                    Retry
                  </Button>
                </div>
              ) : statsigExperiments.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400 mb-3">
                    No experiments found in your Statsig account.
                  </p>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md text-sm text-left max-w-md mx-auto">
                    <p className="font-medium mb-1 text-blue-800 dark:text-blue-300">Note:</p>
                    <p className="text-gray-600 dark:text-gray-300">
                      Your API call succeeded, but no experiments were returned. This could be because:
                    </p>
                    <ul className="list-disc list-inside mt-2 text-gray-600 dark:text-gray-300">
                      <li>You haven't created any experiments in Statsig</li>
                      <li>Your account doesn't have access to existing experiments</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Select an experiment to import from Statsig. You can edit the code and targeting for experiments that are already defined in Statsig.
                  </p>
                  
                  {statsigExperiments.map((experiment) => (
                    <div 
                      key={experiment.id} 
                      className="border border-gray-200 dark:border-gray-700 rounded-md p-4 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{experiment.name}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {experiment.description || "No description"}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              experiment.status === "published" 
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" 
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                            }`}>
                              {experiment.status.charAt(0).toUpperCase() + experiment.status.slice(1)}
                            </span>
                            
                            {experiment.code ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                Has code
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                                No code
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (onImport) {
                                onImport(experiment);
                                setShowModal(false);
                              }
                            }}
                          >
                            Import
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => {
                              router.push(`/experiments/${experiment.id}`);
                              setShowModal(false);
                            }}
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}