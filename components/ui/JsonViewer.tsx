"use client";

import { useState } from "react";

interface JsonViewerProps {
  data: any;
  initialExpandLevel?: number;
}

export default function JsonViewer({ data, initialExpandLevel = 1 }: JsonViewerProps) {
  return (
    <div className="font-mono text-sm overflow-auto">
      <JsonNode 
        data={data} 
        name="root" 
        isRoot={true} 
        level={0} 
        initialExpandLevel={initialExpandLevel}
      />
    </div>
  );
}

interface JsonNodeProps {
  data: any;
  name: string;
  isRoot?: boolean;
  level: number;
  initialExpandLevel: number;
}

function JsonNode({ data, name, isRoot = false, level, initialExpandLevel }: JsonNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < initialExpandLevel);
  
  const getType = (value: any): string => {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  };
  
  const renderValue = (value: any): JSX.Element => {
    const type = getType(value);
    
    switch (type) {
      case 'string':
        return <span className="text-green-600 dark:text-green-400">"{value}"</span>;
      case 'number':
        return <span className="text-blue-600 dark:text-blue-400">{value}</span>;
      case 'boolean':
        return <span className="text-purple-600 dark:text-purple-400">{value ? 'true' : 'false'}</span>;
      case 'null':
        return <span className="text-gray-500 dark:text-gray-400">null</span>;
      case 'object':
      case 'array':
        return (
          <div className="pl-4 border-l border-gray-300 dark:border-gray-700">
            {Object.keys(value).map(key => (
              <JsonNode
                key={key}
                data={value[key]}
                name={key}
                level={level + 1}
                initialExpandLevel={initialExpandLevel}
              />
            ))}
          </div>
        );
      default:
        return <span>{String(value)}</span>;
    }
  };
  
  const isExpandable = ['object', 'array'].includes(getType(data)) && data !== null;
  const displayName = isRoot ? '' : name;

  return (
    <div className="my-1">
      {isExpandable ? (
        <>
          <div 
            className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 py-1 px-2 rounded flex items-start"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <span className="mr-2 text-gray-500 dark:text-gray-400 inline-block w-4">
              {isExpanded ? '▼' : '▶'}
            </span>
            {displayName && (
              <span className="text-gray-800 dark:text-gray-200 mr-1">
                {displayName}:
              </span>
            )}
            <span className="text-gray-500 dark:text-gray-400">
              {Array.isArray(data) ? `Array(${data.length})` : 'Object'}
            </span>
          </div>
          {isExpanded && renderValue(data)}
        </>
      ) : (
        <div className="py-1 px-2 pl-6 flex">
          {displayName && (
            <span className="text-gray-800 dark:text-gray-200 mr-1">
              {displayName}:
            </span>
          )}
          {renderValue(data)}
        </div>
      )}
    </div>
  );
}