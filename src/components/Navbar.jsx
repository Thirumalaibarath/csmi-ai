import React from 'react';
import {
  Compass,
  Users,
  BarChart3,
  Sparkles,
  Code2,
} from 'lucide-react';

export function Navbar({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'single', label: 'Single-Robot A*', icon: Compass },
    { id: 'multi', label: 'Multi-Robot (MAPF)', icon: Users },
    { id: 'benchmark', label: 'Analytics & Benchmarks', icon: BarChart3 },
  ];

  return (
    <header className="app-header">
      <div className="brand-section">
        <div className="brand-icon-wrapper">
          <Sparkles size={22} />
        </div>
        <div>
          <div className="brand-title">Pathfinder Algorithm</div>
        </div>
      </div>

      <nav className="nav-tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`nav-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  style={{
                    fontSize: '0.65rem',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '999px',
                    background: isActive ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                    color: isActive ? '#22d3ee' : '#94a3b8',
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="header-actions">
        <a
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
          className="btn btn-secondary"
          style={{ padding: '0.55rem' }}
          title="GitHub Submission Repository"
        >
          <Code2 size={18} />
        </a>
      </div>
    </header>
  );
}
