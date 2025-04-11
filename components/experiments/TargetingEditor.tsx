import { useState } from "react";
import Button from "@/components/ui/Button";
import { TargetingCondition } from "@/types/experiment";

interface TargetingEditorProps {
  conditions: TargetingCondition[];
  environments: string[];
  onChange: (targeting: { conditions: TargetingCondition[]; environments: string[] }) => void;
  disabled?: boolean;
}

const ENVIRONMENTS = ["development", "staging", "production"];
const CONDITION_TYPES = ["user", "device", "location", "custom"];
const OPERATORS = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Not equals" },
  { value: "contains", label: "Contains" },
  { value: "not_contains", label: "Not contains" },
  { value: "in", label: "In list" },
  { value: "not_in", label: "Not in list" },
  { value: "matches", label: "Matches regex" },
];

export default function TargetingEditor({ 
  conditions, 
  environments, 
  onChange,
  disabled = false
}: TargetingEditorProps) {
  
  const addCondition = () => {
    const newCondition: TargetingCondition = {
      type: "user",
      attribute: "",
      operator: "equals",
      value: "",
    };
    
    onChange({
      conditions: [...conditions, newCondition],
      environments,
    });
  };

  const removeCondition = (index: number) => {
    const newConditions = [...conditions];
    newConditions.splice(index, 1);
    
    onChange({
      conditions: newConditions,
      environments,
    });
  };

  const updateCondition = (index: number, field: keyof TargetingCondition, value: any) => {
    const newConditions = [...conditions];
    newConditions[index] = {
      ...newConditions[index],
      [field]: value,
    };
    
    onChange({
      conditions: newConditions,
      environments,
    });
  };

  const toggleEnvironment = (env: string) => {
    const newEnvironments = environments.includes(env)
      ? environments.filter(e => e !== env)
      : [...environments, env];
    
    onChange({
      conditions,
      environments: newEnvironments,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Target Environments</h3>
        <div className="flex flex-wrap gap-3">
          {ENVIRONMENTS.map((env) => (
            <button
              key={env}
              type="button"
              onClick={() => !disabled && toggleEnvironment(env)}
              disabled={disabled}
              className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                environments.includes(env)
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                  : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
              } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            >
              {env.charAt(0).toUpperCase() + env.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Targeting Conditions</h3>
        
        {conditions.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            No conditions added yet. Experiment will be shown to all users.
          </div>
        ) : (
          <div className="space-y-4 mb-4">
            {conditions.map((condition, index) => (
              <div key={index} className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <select
                  value={condition.type}
                  onChange={(e) => updateCondition(index, "type", e.target.value)}
                  className="p-2 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900"
                  disabled={disabled}
                >
                  {CONDITION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
                
                <input
                  type="text"
                  value={condition.attribute}
                  onChange={(e) => updateCondition(index, "attribute", e.target.value)}
                  placeholder="Attribute name"
                  className="p-2 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900"
                  disabled={disabled}
                />
                
                <select
                  value={condition.operator}
                  onChange={(e) => updateCondition(index, "operator", e.target.value)}
                  className="p-2 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900"
                  disabled={disabled}
                >
                  {OPERATORS.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>
                
                <input
                  type="text"
                  value={typeof condition.value === 'object' 
                    ? (condition.value as string[]).join(', ') 
                    : String(condition.value)}
                  onChange={(e) => {
                    const value = e.target.value;
                    const finalValue = condition.operator === 'in' || condition.operator === 'not_in'
                      ? value.split(',').map(v => v.trim())
                      : value;
                    updateCondition(index, "value", finalValue);
                  }}
                  placeholder="Value"
                  className="flex-1 min-w-[150px] p-2 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900"
                  disabled={disabled}
                />
                
                <button
                  type="button"
                  onClick={() => !disabled && removeCondition(index)}
                  disabled={disabled}
                  className={`p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
        
        <Button 
          onClick={addCondition}
          variant="outline"
          size="sm"
          disabled={disabled}
        >
          Add Condition
        </Button>
      </div>
    </div>
  );
}