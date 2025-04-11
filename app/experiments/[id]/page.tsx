'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import Button from "@/components/ui/Button";
import TargetingEditor from "@/components/experiments/TargetingEditor";
import CodeEditor from "@/components/experiments/CodeEditor";
import CodePreview from "@/components/experiments/CodePreview";
import JsonViewer from "@/components/ui/JsonViewer";
import StatsigTargeting from "@/components/experiments/StatsigTargeting";
import { Experiment, ExperimentFormData } from "@/types/experiment";
import { 
  fetchStatsigExperiment
} from "@/lib/statsig";

// Sample code for new experiments
const DEFAULT_CODE = `// This code will be injected into the client when the experiment is running
// You can use any JavaScript here to modify the page

// Example: Change the color of all buttons to blue
document.querySelectorAll('button').forEach(button => {
  button.style.backgroundColor = '#3b82f6';
  button.style.borderColor = '#2563eb';
});

// Log that the experiment is running
console.log('Experiment is running!');
`;

export default function ExperimentDetailPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const router = useRouter();
  // Unwrap params with React.use() before accessing properties
  const { id } = React.use(params);
  const isNew = id === "new";
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishStatus, setPublishStatus] = useState<{
    success?: boolean;
    message?: string;
  }>({});
  
  // State for the experiment data
  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [formData, setFormData] = useState<ExperimentFormData>({
    name: "",
    description: "",
    targeting: {
      conditions: [],
      environments: ["development"],
    },
    code: DEFAULT_CODE,
  });

  // Load the experiment data if not a new experiment
  useEffect(() => {
    if (isNew) {
      setIsLoading(false);
      return;
    }

    const loadExperiment = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // If the ID might be a Statsig ID (either directly from Statsig or our local reference)
        // Note: We no longer prefix IDs with exp-statsig, we use the actual Statsig ID
        try {
          // Try to get the experiment directly from Statsig API first
          const statsigExperiment = await fetchStatsigExperiment(id);
          if (statsigExperiment) {
            setExperiment({
              ...statsigExperiment,
              isFromStatsig: true
            });
            setFormData({
              name: statsigExperiment.name,
              description: statsigExperiment.description,
              targeting: statsigExperiment.targeting,
              code: statsigExperiment.code,
            });
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error("Failed to fetch Statsig experiment:", error);
        }
        
        // Otherwise, fetch from our API
        const response = await fetch(`/api/experiments?id=${id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError("Experiment not found");
          } else {
            setError(`Error loading experiment: ${response.status}`);
          }
          return;
        }
        
        const data = await response.json();
        setExperiment(data);
        setFormData({
          name: data.name,
          description: data.description,
          targeting: data.targeting,
          code: data.code,
        });
      } catch (err) {
        console.error("Failed to load experiment:", err);
        setError("Failed to load experiment. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadExperiment();
  }, [isNew, id]);

  const handleFormChange = (field: keyof ExperimentFormData, value: any) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert("Please enter a name for the experiment");
      return;
    }
    
    // For new experiments, directly publish to Statsig instead of creating locally
    if (isNew) {
      handlePublish();
      return;
    }
    
    // For existing experiments, just update the local data
    setIsSaving(true);
    setError(null);
    
    try {
      console.log(`Sending update request for experiment with ID: ${id}`);
      
      // For experiments imported from Statsig, we need to use the correct ID format
      let useId = id;
      if (experiment?.statsigId) {
        console.log(`Using statsigId (${experiment.statsigId}) for updates since it's available`);
        useId = experiment.statsigId;
      }
      
      console.log(`Final update ID: ${useId}`);
      
      // First check if the experiment exists to get better debug info
      const checkResponse = await fetch(`/api/experiments?id=${useId}`);
      if (!checkResponse.ok) {
        console.warn(`Experiment check failed: ${useId} not found, status: ${checkResponse.status}`);
      } else {
        console.log(`Experiment ${useId} exists, proceeding with update`);
      }
      
      // Update an existing experiment
      const response = await fetch(`/api/experiments?id=${useId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("API error:", errorData);
        
        // If the experiment was not found, it might be a Statsig ID issue
        if (response.status === 404) {
          console.log("Attempting fallback to local ID as a last resort");
          // Try one more time with the route parameter ID
          const fallbackResponse = await fetch(`/api/experiments?id=${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
          });
          
          if (fallbackResponse.ok) {
            const updatedExperiment = await fallbackResponse.json();
            setExperiment(updatedExperiment);
            alert("Experiment updated successfully (using fallback ID)!");
            return;
          }
        }
        
        // Extract detailed error information if available
        const errorMessage = errorData.message || `Error updating experiment: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      const updatedExperiment = await response.json();
      setExperiment(updatedExperiment);
      
      alert("Experiment updated successfully!");
    } catch (err) {
      console.error("Failed to save experiment:", err);
      setError(err instanceof Error ? err.message : "Failed to save experiment. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!experiment && !isNew) return;
    
    setIsPublishing(true);
    setPublishStatus({});
    setError(null);
    
    try {
      // For new experiments, use the direct publish endpoint
      if (isNew) {
        const response = await fetch('/api/experiments/publish', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Error publishing experiment: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Update the experiment with the published data
        setExperiment(data.experiment);
        setPublishStatus({
          success: true,
          message: data.message || "Experiment created and published successfully",
        });
        
        // Navigate to the new experiment's page
        router.push(`/experiments/${data.experiment.id}`);
      } else {
        // For existing experiments, use the ID-specific publish endpoint
        const response = await fetch(`/api/experiments/${id}/publish`, {
          method: 'POST',
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Error publishing experiment: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Update the experiment with the published data
        setExperiment(data.experiment);
        setPublishStatus({
          success: true,
          message: data.message,
        });
      }
    } catch (err) {
      console.error("Failed to publish experiment:", err);
      setPublishStatus({
        success: false,
        message: err instanceof Error ? err.message : "Failed to publish experiment",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleArchive = async () => {
    if (!experiment) return;
    
    if (!confirm('Are you sure you want to archive this experiment?')) {
      return;
    }
    
    setIsArchiving(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/experiments/${id}/archive`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`Error archiving experiment: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update the experiment with the archived status
      setExperiment(data.experiment);
      alert("Experiment archived successfully");
    } catch (err) {
      console.error("Failed to archive experiment:", err);
      setError("Failed to archive experiment. Please try again.");
    } finally {
      setIsArchiving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" role="status">
          <span className="sr-only">Loading...</span>
        </div>
        <p className="mt-2 text-gray-500 dark:text-gray-400">Loading experiment...</p>
      </div>
    );
  }

  if (error && !isNew) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 p-4 rounded-md mb-6">
          {error}
        </div>
        <Link href="/experiments" className="text-blue-600 dark:text-blue-400 hover:underline">
          Back to experiments
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
            <Link href="/experiments" className="hover:text-gray-700 dark:hover:text-gray-300">
              Experiments
            </Link>
            <span>→</span>
            <span>{isNew ? "New Experiment" : experiment?.name || "Loading..."}</span>
          </div>
          <h1 className="text-2xl font-semibold">
            {isNew ? "New Experiment" : "Edit Experiment"}
          </h1>
        </div>
        
        <div className="flex gap-3">
          {/* Show Publish button for draft experiments or new experiments */}
          {(isNew || (experiment && experiment.status !== "published")) && (
            <Button 
              onClick={handlePublish}
              disabled={isPublishing}
              variant="primary"
            >
              {isPublishing ? "Publishing..." : "Publish to Statsig"}
            </Button>
          )}
          
          {/* Show Archive button only for published experiments */}
          {!isNew && experiment?.status === "published" && (
            <Button 
              variant="outline" 
              onClick={handleArchive}
              disabled={isArchiving}
            >
              {isArchiving ? "Archiving..." : "Archive"}
            </Button>
          )}
        </div>
      </div>

      {(error || publishStatus.message) && (
        <div className={`mb-6 p-4 rounded-md ${
          error || !publishStatus.success 
            ? "bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300" 
            : "bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300"
        }`}>
          {error || publishStatus.message}
        </div>
      )}

      {!isNew && experiment && (
        <div className="mb-6 grid grid-cols-3 gap-4 text-sm">
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
            <p className="text-gray-500 dark:text-gray-400">Status</p>
            <p className="font-medium">
              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                experiment.status === "published" 
                  ? "bg-green-500" 
                  : experiment.status === "draft"
                  ? "bg-yellow-500"
                  : "bg-gray-500"
              }`}></span>
              {experiment.status.charAt(0).toUpperCase() + experiment.status.slice(1)}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
            <p className="text-gray-500 dark:text-gray-400">Created</p>
            <p className="font-medium">
              {format(new Date(experiment.createdAt), "MMM d, yyyy h:mm a")}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
            <p className="text-gray-500 dark:text-gray-400">Last Updated</p>
            <p className="font-medium">
              {format(new Date(experiment.updatedAt), "MMM d, yyyy h:mm a")}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleFormChange("name", e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900"
              required
              disabled={experiment?.status === "archived"}
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleFormChange("description", e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 h-24"
              disabled={experiment?.status === "archived"}
            />
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
          <h2 className="text-xl font-semibold mb-4">Targeting</h2>
          
          {/* Statsig targeting gates section */}
          {(experiment?.isFromStatsig || experiment?.statsigId) && (
            <div className="mb-8">
              <StatsigTargeting
                selectedGate={experiment?.targeting.conditions.find(c => c.type === "user" && c.attribute === "gate")?.value as string}
                onSelectGate={(gateId) => {
                  const newConditions = gateId 
                    ? [
                        {
                          type: "user",
                          attribute: "gate",
                          operator: "equals",
                          value: gateId
                        }
                      ]
                    : [];
                    
                  handleFormChange("targeting", {
                    ...formData.targeting,
                    conditions: newConditions,
                  });
                }}
                disabled={experiment?.status === "archived"}
              />
              
              <div className="mt-4 mb-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-lg font-medium mb-2">Advanced Targeting</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Use the editor below to add additional targeting conditions beyond Statsig gates.
                </p>
              </div>
            </div>
          )}
          
          <TargetingEditor
            conditions={formData.targeting.conditions}
            environments={formData.targeting.environments}
            onChange={(targeting) => handleFormChange("targeting", targeting)}
            disabled={experiment?.status === "archived"}
          />
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
          <h2 className="text-xl font-semibold mb-4">Experiment Code</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Write JavaScript code that will be injected into the client when this experiment is running.
          </p>
          <CodeEditor
            code={formData.code}
            onChange={(code) => handleFormChange("code", code)}
            readOnly={experiment?.status === "archived"}
          />
          
          <div className="mt-6">
            <CodePreview code={formData.code} />
          </div>
        </div>

        {!isNew && experiment?.status === "published" && (
          <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
            <h2 className="text-xl font-semibold mb-4">Statsig Configuration</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {experiment.isFromStatsig || experiment.statsigId 
                ? "This experiment is linked with Statsig. Any changes you publish will be synchronized." 
                : "This is the Statsig configuration that was generated when this experiment was published."}
            </p>
            
            {/* Statsig ID badge */}
            {(experiment.isFromStatsig || experiment.statsigId) && (
              <div className="mb-4 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded text-xs font-medium">
                  Statsig ID: {experiment.statsigId}
                </span>
                {experiment.statsigLayer && (
                  <span className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 px-2 py-1 rounded text-xs font-medium">
                    Layer: {experiment.statsigLayer}
                  </span>
                )}
              </div>
            )}
            
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
              <JsonViewer 
                data={{
                  experimentName: experiment.name,
                  id: experiment.id,
                  statsigId: experiment.statsigId,
                  environments: experiment.targeting.environments,
                  conditions: experiment.targeting.conditions,
                  publishedAt: experiment.publishedAt,
                  statsigConfig: {
                    layerName: experiment.statsigLayer || `exp_${experiment.id.replace(/-/g, '_')}`,
                    rules: experiment.targeting.conditions.map(condition => ({
                      attribute: condition.attribute,
                      operator: condition.operator,
                      value: condition.value
                    })),
                    variants: [
                      {
                        name: "control",
                        weight: 50
                      },
                      {
                        name: "treatment",
                        weight: 50,
                        jsCode: experiment.code
                      }
                    ]
                  }
                }}
                initialExpandLevel={2}
              />
            </div>
            
            {/* Client integration snippet */}
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Client Integration Code</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Use this code snippet to integrate this experiment with the Statsig client SDK.
              </p>
              <pre className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md overflow-x-auto text-sm font-mono">
{`import { Statsig } from 'statsig-js';

// Initialize Statsig
await Statsig.initialize(
  '${process.env.NEXT_PUBLIC_STATSIG_CLIENT_SDK_KEY || 'YOUR_CLIENT_SDK_KEY'}',
  { userID: 'user-123' } // User properties for targeting
);

// Check if user is in experiment
const layer = Statsig.getLayer('${experiment.statsigLayer || `exp_${experiment.id.replace(/-/g, '_')}`}');
const isInExperiment = layer.get('jsCode', false);

// Log an exposure event
Statsig.logEvent('experiment_viewed', { experimentName: '${experiment.name}' });`}
              </pre>
            </div>
          </div>
        )}

        <div className="border-t border-gray-200 dark:border-gray-800 pt-8 flex justify-end gap-3">
          <Link href="/experiments">
            <Button variant="outline">Cancel</Button>
          </Link>
          
          {experiment?.status !== "archived" && (
            <Button 
              type="submit" 
              variant="primary"
              disabled={isNew ? isPublishing : isSaving}
            >
              {isNew 
                ? (isPublishing ? "Publishing..." : "Publish to Statsig") 
                : (isSaving ? "Saving..." : "Save Changes")}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}