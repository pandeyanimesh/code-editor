// src/components/CodeEditor.js
import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';

function CodeEditor({ theme = 'light', setTheme }) {
  // Tabs state
  const [tabs, setTabs] = useState([
    { 
      id: 1, 
      name: 'Tab 1', 
      code: '', 
      input: '', 
      output: '', 
      error: '', 
      status: 'idle', 
      showInput: false 
    }
  ]);
  
  const [activeTabId, setActiveTabId] = useState(1);
  const [isCompiling, setIsCompiling] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  
  // Create a ref to store editor instances for each tab
  const editorsRef = useRef({});
  
  // Default code sample
  const defaultCode = `#include<bits/stdc++.h>
#include <iostream>
using namespace std;

int main() {
  cout << "Hello, World!" << endl;
  return 0;
}`;

  // Code sample with input
  const inputCode = `#include<bits/stdc++.h>
#include <iostream>
using namespace std;

int main() {
  string name;
  cout << "What is your name? ";
  cin>>name;
  cout << "Hello, " << name << "!" << endl;
  return 0;
}`;

  useEffect(() => {
    // Initialize first tab with default code
    updateTabProperty(1, 'code', defaultCode);
  }, []);

  // Get the active tab object
  const activeTab = tabs.find(tab => tab.id === activeTabId) || tabs[0];

  // Function to update a property of a specific tab
  const updateTabProperty = (tabId, property, value) => {
    console.log(`Updating tab ${tabId}, property ${property}:`, value);
    // Use functional update to avoid stale closures
    setTabs(prevTabs => prevTabs.map(tab => 
      tab.id === tabId ? { ...tab, [property]: value } : tab
    ));
  };

  // Add a new tab
  const addNewTab = () => {
    const newTabId = Math.max(...tabs.map(tab => tab.id)) + 1;
    setTabs([...tabs, { 
      id: newTabId, 
      name: `Tab ${newTabId}`, 
      code: defaultCode, 
      input: '', 
      output: '', 
      error: '', 
      status: 'idle', 
      showInput: false 
    }]);
    setActiveTabId(newTabId);
  };

  // Close a tab
  const closeTab = (tabId, e) => {
    e.stopPropagation();
    
    // Don't remove the last tab
    if (tabs.length <= 1) return;
    
    const newTabs = tabs.filter(tab => tab.id !== tabId);
    setTabs(newTabs);
    
    // If we're closing the active tab, switch to another tab
    if (activeTabId === tabId) {
      setActiveTabId(newTabs[0].id);
    }
    
    // Clean up the editor instance for this tab
    if (editorsRef.current[tabId]) {
      delete editorsRef.current[tabId];
    }
  };

  // Rename a tab (double click on tab)
  const renameTab = (tabId) => {
    const currentTab = tabs.find(tab => tab.id === tabId);
    const newName = prompt('Enter new tab name:', currentTab.name);
    
    if (newName && newName.trim() !== '') {
      updateTabProperty(tabId, 'name', newName.trim());
    }
  };

  const handleEditorChange = (value, tabId) => {
    updateTabProperty(tabId, 'code', value);
    
    // Check if code likely needs input (contains cin, getline, etc.)
    const needsInput = value.includes('cin') || 
                       value.includes('getline') || 
                       value.includes('scanf');
    
    updateTabProperty(tabId, 'showInput', needsInput);
  };

  const handleEditorDidMount = (editor, monaco, tabId) => {
    // Store the editor instance for this tab
    editorsRef.current[tabId] = editor;
    
    if (tabId === activeTabId) {
      setEditorReady(true);
    }
  };

  const handleInputChange = (e) => {
    updateTabProperty(activeTabId, 'input', e.target.value);
  };

  const handleCompile = async () => {
    setIsCompiling(true);
    
    // Find the current active tab to get the latest code
    const currentTab = tabs.find(tab => tab.id === activeTabId);
    
    if (!currentTab) {
      console.error("Active tab not found!");
      setIsCompiling(false);
      return;
    }
    
    // Update status immediately with a single setTabs call
    setTabs(prevTabs => 
      prevTabs.map(tab => 
        tab.id === activeTabId 
          ? { ...tab, status: 'compiling', error: '', output: '' } 
          : tab
      )
    );
    
    // Get the latest code directly from the editor instance if available
    let codeToCompile = currentTab.code;
    if (editorsRef.current[activeTabId]) {
      codeToCompile = editorsRef.current[activeTabId].getValue();
      // Also update the tab's code state to keep it in sync
      updateTabProperty(activeTabId, 'code', codeToCompile);
    }
    
    try {
      console.log(`Compiling code for tab ${activeTabId}`);
      
      const response = await axios.post('/api/compile', { 
        code: codeToCompile,
        input: currentTab.input.trim()
      });
      
      // After receiving response, update with a single setTabs call again
      setTabs(prevTabs => 
        prevTabs.map(tab => 
          tab.id === activeTabId 
            ? { 
                ...tab, 
                status: response.data.success ? 'success' : 'error',
                output: response.data.output || '',
                error: response.data.success ? '' : (response.data.message || 'Compilation failed')
              } 
            : tab
        )
      );
    } catch (err) {
      console.error("Compilation error:", err);
      
      // Handle error with another direct update
      setTabs(prevTabs => 
        prevTabs.map(tab => 
          tab.id === activeTabId 
            ? { 
                ...tab, 
                status: 'error',
                error: err.response?.data?.message || 'Failed to compile code',
                output: err.response?.data?.output || ''
              } 
            : tab
        )
      );
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
    // Find the current active tab
    const currentTab = tabs.find(tab => tab.id === activeTabId);
    
    if (!currentTab) {
      console.error("Active tab not found for clearing output!");
      return;
    }
    
    console.log(`Clearing output for tab ${activeTabId}`);
    
    // Clear all output properties in a single state update
    setTabs(prevTabs => prevTabs.map(tab => 
      tab.id === activeTabId ? 
        { ...tab, output: '', error: '', status: 'idle' } : 
        tab
    ));
  };

  const setCodeExample = (example) => {
    if (example === 'input') {
      updateTabProperty(activeTabId, 'code', inputCode);
      updateTabProperty(activeTabId, 'showInput', true);
      
      // Update the editor instance for the active tab
      if (editorsRef.current[activeTabId]) {
        editorsRef.current[activeTabId].setValue(inputCode);
      }
    } else {
      updateTabProperty(activeTabId, 'code', defaultCode);
      updateTabProperty(activeTabId, 'showInput', false);
      
      // Update the editor instance for the active tab
      if (editorsRef.current[activeTabId]) {
        editorsRef.current[activeTabId].setValue(defaultCode);
      }
    }
  };

  // Toggle between light and dark themes
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  // Save the current code to a file
  const saveCodeToFile = () => {
    const blob = new Blob([activeTab.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab.name.replace(/\s+/g, '_')}.cpp`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Apply theme to container class
  const containerClass = `code-editor-container ${theme === 'dark' ? 'dark-theme' : ''}`; 
  
  return (
    <div className={containerClass} onKeyDown={handleKeyDown}>
      <div className="editor-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>C++ Code Editor</h1>
          
          {/* Theme and Save buttons moved to top right */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={toggleTheme} className="theme-button">
              {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
            </button>
            
            <button onClick={saveCodeToFile} className="save-button">
              💾 Save File
            </button>
          </div>
        </div>
        
        <div className="tab-controls">
          <div className="tabs-container">
            {tabs.map(tab => (
              <div 
                key={tab.id} 
                className={`tab ${activeTabId === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTabId(tab.id)}
                onDoubleClick={() => renameTab(tab.id)}
              >
                <span className="tab-name">{tab.name}</span>
                <button className="tab-close" onClick={(e) => closeTab(tab.id, e)}>×</button>
              </div>
            ))}
            <button className="add-tab" onClick={addNewTab}>+</button>
          </div>
        </div>
        
        {/* Reorganized button row - example buttons on left, action buttons on right */}
        <div className="editor-controls">
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            {/* Example buttons on left */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setCodeExample('no-input')} className="example-button">
                Basic Example
              </button>
              <button onClick={() => setCodeExample('input')} className="example-button">
                Input Example
              </button>
            </div>
            
            {/* Status in middle */}
            <div className="status-indicator">
              {activeTab.status === 'compiling' && <span className="status compiling">Compiling...</span>}
              {activeTab.status === 'success' && <span className="status success">Compilation Successful</span>}
              {activeTab.status === 'error' && <span className="status error">Compilation Failed</span>}
            </div>
            
            {/* Clear and Compile buttons on right */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={handleClearOutput} 
                disabled={isCompiling || (!activeTab.output && !activeTab.error)}
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
          </div>
        </div>
      </div>
      
      <div className="editor-output-container">
        <div className="editor-wrapper">
          <div className="editor-toolbar">
            <span className="toolbar-label">Code Editor - {activeTab.name}</span>
            <span className="toolbar-info">Press Ctrl+Enter to compile</span>
          </div>
          
          {/* Render editor for the active tab only */}
          <Editor
            height="500px"
            defaultLanguage="cpp"
            key={activeTabId} // Important: This forces a complete re-render when switching tabs
            value={activeTab.code}
            onChange={(value) => handleEditorChange(value, activeTabId)}
            onMount={(editor, monaco) => handleEditorDidMount(editor, monaco, activeTabId)}
            theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
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
          {/* Input container that shows only when needed */}
          {activeTab.showInput && (
            <div className="input-container">
              <div className="input-header">
                <h3>Program Input</h3>
              </div>
              <textarea
                value={activeTab.input}
                onChange={handleInputChange}
                placeholder="Enter input for your program here..."
                disabled={isCompiling}
                className="input-textarea"
              />
            </div>
          )}
          
          <div className={`output-container ${activeTab.error ? 'has-error' : ''}`}>
            <div className="output-header">
              {activeTab.error ? (
                <h3>Error</h3>
              ) : (
                <h3>Output</h3>
              )}
            </div>
            <div className="output-content">
              {activeTab.error && <pre className="error-message">{activeTab.error}</pre>}
              {activeTab.output && <pre className="output-text">{activeTab.output}</pre>}
              {!activeTab.error && !activeTab.output && activeTab.status !== 'compiling' && (
                <div className="empty-output">
                  <p>No output to display yet. Click "Compile & Run" to execute your code.</p>
                </div>
              )}
              {activeTab.status === 'compiling' && <div className="compiling-indicator">Compiling and running your code...</div>}
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