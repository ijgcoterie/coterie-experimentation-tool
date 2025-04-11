"use client";

import { useState, useEffect } from "react";
import { getStatsigTargetingGates } from "@/lib/statsig";
import Button from "@/components/ui/Button";

interface StatsigTargetingProps {
  selectedGate?: string;
  onSelectGate: (gateId: string | undefined) => void;
  disabled?: boolean;
}

export default function StatsigTargeting({ 
  selectedGate, 
  onSelectGate,
  disabled = false
}: StatsigTargetingProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [targetingGates, setTargetingGates] = useState<Array<{ id: string; name: string }>>([]); 
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTargetingGates = async () => {
      setIsLoading(true);
      setError(null);
      
      // Check if API key is configured
      if (!process.env.NEXT_PUBLIC_STATSIG_CONSOLE_API_KEY) {
        setError("Statsig API key is not configured. Please add NEXT_PUBLIC_STATSIG_CONSOLE_API_KEY to your .env.local file.");
        setIsLoading(false);
        return;
      }
      
      try {
        const gates = await getStatsigTargetingGates();
        setTargetingGates(gates);
      } catch (err) {
        setError("Failed to load targeting gates from Statsig. Please check your API key.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTargetingGates();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Statsig Targeting Gates</h3>
        {selectedGate && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onSelectGate(undefined)}
            disabled={disabled}
          >
            Clear Selection
          </Button>
        )}
      </div>
      
      {isLoading ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Loading targeting gates...
        </div>
      ) : error ? (
        <div className="text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      ) : targetingGates.length === 0 ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          No targeting gates found in Statsig.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {targetingGates.map((gate) => (
            <button
              key={gate.id}
              type="button"
              onClick={() => !disabled && onSelectGate(gate.id)}
              disabled={disabled}
              className={`p-3 rounded border text-left ${
                selectedGate === gate.id
                  ? "bg-blue-50 border-blue-300 dark:bg-blue-900/50 dark:border-blue-700"
                  : "bg-white border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
              } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div className="font-medium">{gate.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Gate ID: {gate.id}
              </div>
            </button>
          ))}
        </div>
      )}
      
      <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
        <p className="font-medium mb-1">Tip</p>
        <p>
          Statsig targeting gates let you control which users see your experiments. 
          Select a gate to quickly apply pre-defined targeting rules from Statsig. 
          These gates are defined in the Statsig console.
        </p>
      </div>
    </div>
  );
}