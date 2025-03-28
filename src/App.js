import React, { useState, useEffect } from 'react';
import CodeEditor from './components/CodeEditor';
import './App.css';

function App() {
  // Set initial theme based on user preference
  const [theme, setTheme] = useState(() => {
    // Check for saved theme preference or use system preference
    const savedTheme = localStorage.getItem('preferred-theme');
    if (savedTheme) {
      return savedTheme;
    }
    // Use system preference as fallback
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Update body class when theme changes
  useEffect(() => {
    document.body.className = theme === 'dark' ? 'dark-mode' : 'light-mode';
    localStorage.setItem('preferred-theme', theme);
  }, [theme]);

  return (
    <div className={`App ${theme === 'dark' ? 'dark-theme' : ''}`}>
      <CodeEditor theme={theme} setTheme={setTheme} />
    </div>
  );
}

export default App;