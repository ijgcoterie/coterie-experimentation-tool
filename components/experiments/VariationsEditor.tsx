import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import { ExperimentVariation } from '@/types/experiment';
import CodeEditor from './CodeEditor';

interface VariationsEditorProps {
  variations: ExperimentVariation[];
  onChange: (variations: ExperimentVariation[]) => void;
  disabled?: boolean;
}

export default function VariationsEditor({ 
  variations, 
  onChange, 
  disabled = false 
}: VariationsEditorProps) {
  const [activeVariation, setActiveVariation] = useState<string | null>(
    variations.length > 0 ? variations[0].id : null
  );
  
  // Default code for new variations
  const DEFAULT_CODE = `// This code will be injected for this variation
console.log('Variation is running!');
`;

  const addVariation = () => {
    const newId = `var-${Math.random().toString(36).substring(2, 9)}`;
    const defaultWeight = calculateDefaultWeight(variations.length + 1);
    
    const newVariation: ExperimentVariation = {
      id: newId,
      name: `Variation ${variations.length + 1}`,
      code: DEFAULT_CODE,
      weight: defaultWeight
    };
    
    // Redistribute weights evenly
    const updatedVariations = [...variations, newVariation].map((v, i, arr) => ({
      ...v,
      weight: Math.floor(100 / arr.length)
    }));
    
    // Adjust the last variation to ensure weights sum to 100
    const totalWeight = updatedVariations.reduce((sum, v) => sum + v.weight, 0);
    if (totalWeight !== 100 && updatedVariations.length > 0) {
      const lastVariation = updatedVariations[updatedVariations.length - 1];
      lastVariation.weight += (100 - totalWeight);
    }
    
    onChange(updatedVariations);
    setActiveVariation(newId);
  };

  const removeVariation = (id: string) => {
    // Prevent removing the last variation
    if (variations.length <= 1) {
      return;
    }
    
    const updatedVariations = variations.filter(v => v.id !== id);
    
    // Redistribute weights evenly
    const adjustedVariations = updatedVariations.map((v, i, arr) => ({
      ...v,
      weight: Math.floor(100 / arr.length)
    }));
    
    // Adjust the last variation to ensure weights sum to 100
    const totalWeight = adjustedVariations.reduce((sum, v) => sum + v.weight, 0);
    if (totalWeight !== 100 && adjustedVariations.length > 0) {
      const lastVariation = adjustedVariations[adjustedVariations.length - 1];
      lastVariation.weight += (100 - totalWeight);
    }
    
    onChange(adjustedVariations);
    setActiveVariation(updatedVariations[0]?.id || null);
  };

  const updateVariation = (id: string, field: keyof ExperimentVariation, value: string | number) => {
    const updatedVariations = variations.map(v => 
      v.id === id ? { ...v, [field]: value } : v
    );
    onChange(updatedVariations);
  };

  const calculateDefaultWeight = (numVariations: number) => {
    return Math.floor(100 / numVariations);
  };

  const validateWeights = (updatedVariations: ExperimentVariation[]) => {
    // Ensure weights are non-negative
    updatedVariations = updatedVariations.map(v => ({
      ...v,
      weight: Math.max(0, v.weight)
    }));
    
    // Ensure weights sum to 100
    const totalWeight = updatedVariations.reduce((sum, v) => sum + v.weight, 0);
    
    if (totalWeight !== 100) {
      // Adjust the weights proportionally
      const factor = 100 / totalWeight;
      updatedVariations = updatedVariations.map((v, i, arr) => {
        if (i === arr.length - 1) {
          // Make sure the last variation ensures total = 100
          const otherWeights = arr.slice(0, -1).reduce((sum, v) => sum + Math.round(v.weight * factor), 0);
          return { ...v, weight: 100 - otherWeights };
        }
        return { ...v, weight: Math.round(v.weight * factor) };
      });
    }
    
    return updatedVariations;
  };

  const handleWeightChange = (id: string, newWeight: number) => {
    const variationIndex = variations.findIndex(v => v.id === id);
    if (variationIndex === -1) return;
    
    // Create a copy of variations
    const updatedVariations = [...variations];
    updatedVariations[variationIndex] = {
      ...updatedVariations[variationIndex],
      weight: newWeight
    };
    
    // Validate and adjust weights
    const validatedVariations = validateWeights(updatedVariations);
    onChange(validatedVariations);
  };

  // Ensure we always have at least one variation
  if (variations.length === 0) {
    const defaultVariation: ExperimentVariation = {
      id: `var-${Math.random().toString(36).substring(2, 9)}`,
      name: 'Control',
      code: '',  // Control usually has no code
      weight: 50
    };
    
    const treatmentVariation: ExperimentVariation = {
      id: `var-${Math.random().toString(36).substring(2, 9)}`,
      name: 'Treatment',
      code: DEFAULT_CODE,
      weight: 50
    };
    
    onChange([defaultVariation, treatmentVariation]);
    setActiveVariation(defaultVariation.id);
    return <div>Initializing variations...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="col-span-1">
          <h3 className="text-lg font-medium mb-4">Variations</h3>
          <div className="space-y-4">
            {variations.map((variation) => (
              <div
                key={variation.id}
                className={`p-4 rounded-md cursor-pointer transition-colors ${
                  activeVariation === variation.id
                    ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800'
                    : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => setActiveVariation(variation.id)}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="font-medium">{variation.name}</div>
                  {variations.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeVariation(variation.id);
                      }}
                      disabled={disabled}
                      className="text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={variation.weight}
                    onChange={(e) => handleWeightChange(variation.id, parseInt(e.target.value))}
                    disabled={disabled}
                    className="w-full"
                  />
                  <span className="text-sm">{variation.weight}%</span>
                </div>
              </div>
            ))}
            
            <Button
              onClick={addVariation}
              variant="outline"
              disabled={disabled}
              className="w-full"
            >
              + Add Variation
            </Button>
          </div>
        </div>
        
        <div className="col-span-1 lg:col-span-2">
          {activeVariation && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium mb-2">
                Edit {variations.find(v => v.id === activeVariation)?.name}
              </h3>
              
              <div>
                <label htmlFor="variationName" className="block text-sm font-medium mb-1">
                  Name
                </label>
                <input
                  id="variationName"
                  type="text"
                  value={variations.find(v => v.id === activeVariation)?.name || ''}
                  onChange={(e) => updateVariation(activeVariation, 'name', e.target.value)}
                  disabled={disabled}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900"
                />
              </div>
              
              <div>
                <label htmlFor="variationWeight" className="block text-sm font-medium mb-1">
                  Traffic Allocation ({variations.find(v => v.id === activeVariation)?.weight || 0}%)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    id="variationWeight"
                    type="range"
                    min="0"
                    max="100"
                    value={variations.find(v => v.id === activeVariation)?.weight || 0}
                    onChange={(e) => handleWeightChange(activeVariation, parseInt(e.target.value))}
                    disabled={disabled}
                    className="w-full"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={variations.find(v => v.id === activeVariation)?.weight || 0}
                    onChange={(e) => handleWeightChange(activeVariation, parseInt(e.target.value))}
                    disabled={disabled}
                    className="w-16 p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  JavaScript Code
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  This code will be injected when a user is assigned to this variation
                </p>
                <CodeEditor
                  code={variations.find(v => v.id === activeVariation)?.code || ''}
                  onChange={(code) => updateVariation(activeVariation, 'code', code)}
                  readOnly={disabled}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}