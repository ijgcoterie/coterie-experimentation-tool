import { useState } from "react";
import { Editor } from "@monaco-editor/react";

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  readOnly?: boolean;
}

export default function CodeEditor({ code, onChange, readOnly = false }: CodeEditorProps) {
  const [isUsingDarkTheme, setIsUsingDarkTheme] = useState(
    typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  // For SSR compatibility
  if (typeof window !== "undefined") {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (e) => {
        setIsUsingDarkTheme(e.matches);
      });
  }

  return (
    <div className="h-[400px] border border-gray-200 dark:border-gray-800 rounded-md overflow-hidden">
      <Editor
        height="100%"
        defaultLanguage="javascript"
        theme={isUsingDarkTheme ? "vs-dark" : "light"}
        value={code}
        onChange={(value) => onChange(value || "")}
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
          tabSize: 2,
          automaticLayout: true,
          readOnly: readOnly,
          domReadOnly: readOnly,
          renderValidationDecorations: readOnly ? "off" : "on"
        }}
      />
    </div>
  );
}