// src/components/CodeEditor.js
import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';

function CodeEditor() {
  const [code, setCode] = useState('#include <iostream>\n\nint main() {\n  std::cout << "Hello, World!" << std::endl;\n  return 0;\n}');
  const [output, setOutput] = useState('');
  const [isCompiling, setIsCompiling] = useState(false);
  const [error, setError] = useState('');

  const handleEditorChange = (value) => {
    setCode(value);
  };

  const handleCompile = async () => {
    setIsCompiling(true);
    setError('');
    
    try {
      const response = await axios.post('http://localhost:8080/api/compile', 
        { code },
        { 
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          withCredentials: true
        }
      );
      setOutput(response.data.output);
    } catch (err) {
      console.error('Error details:', err);
      setError(err.response?.data?.message || 'Failed to compile code');
      setOutput(err.response?.data?.output || '');
    } finally {
      setIsCompiling(false);
    }
  };

  return (
    <div className="code-editor-container">
      <h1>C++ Code Editor</h1>
      <div className="editor-wrapper">
        <Editor
          height="500px"
          defaultLanguage="cpp"
          defaultValue={code}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </div>
      <div className="button-container">
        <button 
          onClick={handleCompile} 
          disabled={isCompiling}
          className="compile-button"
        >
          {isCompiling ? 'Compiling...' : 'Compile & Run'}
        </button>
      </div>
      
      {error && (
        <div className="error-container">
          <h3>Error:</h3>
          <pre>{error}</pre>
        </div>
      )}
      
      <div className="output-container">
        <h3>Output:</h3>
        <pre>{output}</pre>
      </div>
    </div>
  );
}

export default CodeEditor;