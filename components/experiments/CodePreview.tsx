interface CodePreviewProps {
  code: string;
}

export default function CodePreview({ code }: CodePreviewProps) {
  // Simple validation to check if code is proper JavaScript
  const isValidJs = () => {
    try {
      new Function(code);
      return true;
    } catch (e) {
      return false;
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Code Preview</h3>
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          This is how your code will be injected into the client:
        </p>
        <pre className="bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700 text-sm font-mono overflow-x-auto">
          {`(() => {
  try {
${code.split('\n').map(line => `    ${line}`).join('\n')}
  } catch (error) {
    console.error('Experiment execution error:', error);
  }
})();`}
        </pre>
      </div>
      
      {!isValidJs() && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 p-3 rounded-md text-sm">
          Warning: The code contains syntax errors and may not execute properly.
        </div>
      )}
    </div>
  );
}