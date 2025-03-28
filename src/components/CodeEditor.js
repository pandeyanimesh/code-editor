// src/components/CodeEditor.js
import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';

function CodeEditor() {
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [isCompiling, setIsCompiling] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('idle'); // idle, compiling, success, error
  const [editorReady, setEditorReady] = useState(false);

  // Default code sample
  const defaultCode = `#include <iostream>

int main() {
  std::cout << "Hello, World!" << std::endl;
  return 0;
}`;

  useEffect(() => {
    setCode(defaultCode);
  }, []);

  const handleEditorChange = (value) => {
    setCode(value);
  };

  const handleEditorDidMount = () => {
    setEditorReady(true);
  };

  const handleCompile = async () => {
    setIsCompiling(true);
    setStatus('compiling');
    setError('');
    setOutput('');
    
    try {
      // With proxy in package.json, use relative URL
      const response = await axios.post('/api/compile', { code });
      
      if (response.data.success) {
        setOutput(response.data.output || 'Program executed successfully but produced no output.');
        setStatus('success');
      } else {
        setError(response.data.message || 'Compilation or execution failed');
        setOutput(response.data.output || '');
        setStatus('error');
        console.error('Compilation failed:', response.data);
      }
    } catch (err) {
      console.error('Error details:', err);
      setError(err.response?.data?.message || 'Failed to compile code');
      setOutput(err.response?.data?.output || '');
      setStatus('error');
    } finally {
      setIsCompiling(false);
    }
  };

  const handleKeyDown = (e) => {
    // Add Ctrl+Enter / Cmd+Enter shortcut for compiling
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isCompiling) {
        handleCompile();
      }
    }
  };

  const handleClearOutput = () => {
    setOutput('');
    setError('');
    setStatus('idle');
  };

  return (
    <div className="code-editor-container" onKeyDown={handleKeyDown}>
      <div className="editor-header">
        <h1>C++ Code Editor</h1>
        <div className="status-indicator">
          {status === 'compiling' && <span className="status compiling">Compiling...</span>}
          {status === 'success' && <span className="status success">Compilation Successful</span>}
          {status === 'error' && <span className="status error">Compilation Failed</span>}
        </div>
      </div>
      
      <div className="editor-output-container">
        <div className="editor-wrapper">
          <div className="editor-toolbar">
            <span className="toolbar-label">Code Editor</span>
            <span className="toolbar-info">Press Ctrl+Enter to compile</span>
          </div>
          <Editor
            height="500px"
            defaultLanguage="cpp"
            value={code}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            theme="vs-dark"
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              lineNumbers: 'on',
              wordWrap: 'on',
              folding: true,
              tabSize: 2,
            }}
            loading={<div className="editor-loading">Loading editor...</div>}
          />
        </div>
        
        <div className="output-section">
          <div className="button-container">
            <button 
              onClick={handleClearOutput} 
              disabled={isCompiling || (!output && !error)}
              className="clear-button"
            >
              Clear Output
            </button>
            <button 
              onClick={handleCompile} 
              disabled={isCompiling || !editorReady}
              className="compile-button"
            >
              {isCompiling ? 'Compiling...' : 'Compile & Run'}
            </button>
          </div>
          
          <div className={`output-container ${error ? 'has-error' : ''}`}>
            <div className="output-header">
              {error ? (
                <h3>Error</h3>
              ) : (
                <h3>Output</h3>
              )}
            </div>
            <div className="output-content">
              {error && <pre className="error-message">{error}</pre>}
              {output && <pre className="output-text">{output}</pre>}
              {!error && !output && status !== 'compiling' && (
                <div className="empty-output">
                  <p>No output to display yet. Click "Compile & Run" to execute your code.</p>
                </div>
              )}
              {status === 'compiling' && <div className="compiling-indicator">Compiling and running your code...</div>}
            </div>
          </div>
        </div>
      </div>
      
      <div className="editor-footer">
        <p>C++ Compiler provided by <strong>Spring Boot Backend</strong></p>
      </div>
    </div>
  );
}

export default CodeEditor;