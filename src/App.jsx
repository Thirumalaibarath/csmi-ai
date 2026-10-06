import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { SingleAgentView } from './components/SingleAgentView';
import { MultiAgentView } from './components/MultiAgentView';
import { BenchmarkView } from './components/BenchmarkView';
import './styles/components.css';
import './styles/visualizer.css';

export function App() {
  const [activeTab, setActiveTab] = useState('single'); // 'single' | 'multi' | 'benchmark'

  // Keyboard navigation for views
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if (e.key === '1') setActiveTab('single');
      if (e.key === '2') setActiveTab('multi');
      if (e.key === '3') setActiveTab('benchmark');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="app-container">
      {/* Header / Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Dynamic Views */}
      <main style={{ paddingBottom: '3rem' }}>
        {activeTab === 'single' && <SingleAgentView />}
        {activeTab === 'multi' && <MultiAgentView />}
        {activeTab === 'benchmark' && <BenchmarkView />}
      </main>

      {/* Footer */}
      <footer
        style={{
          marginTop: 'auto',
          borderTop: '1px solid var(--border-subtle)',
          padding: '1.25rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
          background: 'rgba(10, 13, 20, 0.7)',
        }}
      >
        <div>
          <span>Pathfinder Algorithm • Single & Multi-Agent Pathfinding</span>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <span>Algorithms: A* (Manhattan, Euclidean, Chebyshev, Weighted), CA*, CBS</span>
          <span>Tested & Profiled with Microsecond Precision</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
