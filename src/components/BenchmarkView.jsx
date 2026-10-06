import React, { useState } from 'react';
import {
  BarChart3,
  Play,
  RotateCcw,
  Download,
  CheckCircle2,
  TrendingDown,
  Cpu,
  Layers,
  Clock,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { runSingleAgentBenchmark, runMultiAgentBenchmark } from '../algorithms/benchmarkRunner';

export function BenchmarkView() {
  const [activeBenchmark, setActiveBenchmark] = useState('single'); // 'single' | 'multi'
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  // Single Agent Benchmark Config & Results
  const [singleTrials, setSingleTrials] = useState(30);
  const [singleGridSize, setSingleGridSize] = useState(16);
  const [singleDensity, setSingleDensity] = useState(0.2);
  const [singleResults, setSingleResults] = useState(null);

  // Multi Agent Benchmark Config & Results
  const [multiTrials, setMultiTrials] = useState(15);
  const [multiGridSize, setMultiGridSize] = useState(14);
  const [multiDensity, setMultiDensity] = useState(0.2);
  const [multiAgents, setMultiAgents] = useState(4);
  const [multiResults, setMultiResults] = useState(null);

  // Selected metric to graph
  const [singleMetric, setSingleMetric] = useState('nodesExpanded'); // 'nodesExpanded' | 'executionTimeMs' | 'peakOpenSet' | 'pathCost'
  const [multiMetric, setMultiMetric] = useState('collisions'); // 'collisions' | 'successRatePct' | 'executionTimeMs' | 'totalCost'

  // Run Single Agent Benchmark
  const executeSingleBenchmark = () => {
    setIsRunning(true);
    setProgress(5);

    setTimeout(() => {
      const res = runSingleAgentBenchmark({
        numTrials: singleTrials,
        width: singleGridSize,
        height: singleGridSize,
        obstacleDensity: singleDensity,
        onProgress: (p) => setProgress(p),
      });
      setSingleResults(res);
      setIsRunning(false);
      setProgress(100);
    }, 50);
  };

  // Run Multi Agent Benchmark
  const executeMultiBenchmark = () => {
    setIsRunning(true);
    setProgress(5);

    setTimeout(() => {
      const res = runMultiAgentBenchmark({
        numTrials: multiTrials,
        width: multiGridSize,
        height: multiGridSize,
        obstacleDensity: multiDensity,
        numAgents: multiAgents,
        onProgress: (p) => setProgress(p),
      });
      setMultiResults(res);
      setIsRunning(false);
      setProgress(100);
    }, 50);
  };

  // Export to CSV
  const exportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (activeBenchmark === 'single' && singleResults) {
      csvContent += 'Heuristic,Nodes_Expanded_Mean,Nodes_Expanded_Std,Path_Cost,Peak_Open,Time_ms\n';
      singleResults.summary.forEach((s) => {
        csvContent += `"${s.heuristic}",${s.nodesExpanded.mean},${s.nodesExpanded.std},${s.pathCost.mean},${s.peakOpenSet.mean},${s.executionTimeMs.mean}\n`;
      });
    } else if (activeBenchmark === 'multi' && multiResults) {
      csvContent += 'Method,Collisions_Mean,Success_Rate_Pct,Flowtime_Cost,Makespan,Time_ms\n';
      multiResults.summary.forEach((s) => {
        csvContent += `"${s.method}",${s.collisions.mean},${s.successRatePct},${s.totalCost.mean},${s.makespan.mean},${s.executionTimeMs.mean}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `benchmark_${activeBenchmark}_results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Color mapping for heuristics
  const heuristicColors = {
    'Manhattan': '#06b6d4',
    'Euclidean': '#3b82f6',
    'Chebyshev': '#8b5cf6',
    'Octile': '#ec4899',
    'Weighted Manhattan (w=1.5)': '#10b981',
    'Zero (Dijkstra Baseline)': '#64748b',
  };

  // Color mapping for MAPF
  const mapfColors = {
    'Plain A* (Independent)': '#f43f5e',
    'Prioritized Space-Time A*': '#06b6d4',
    'Conflict-Based Search (CBS)': '#10b981',
  };

  return (
    <div className="main-content">
      {/* Top Controls Header */}
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart3 size={24} color="var(--accent-cyan)" />
              Automated Experimental Benchmarking Suite
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Executes Monte Carlo trials on randomized grid configurations to validate theoretical complexity and conflict resolution.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className={`btn btn-secondary ${activeBenchmark === 'single' ? 'btn-primary' : ''}`}
              onClick={() => setActiveBenchmark('single')}
            >
              Single-Robot Heuristics
            </button>
            <button
              className={`btn btn-secondary ${activeBenchmark === 'multi' ? 'btn-primary' : ''}`}
              onClick={() => setActiveBenchmark('multi')}
            >
              Multi-Robot Scalability
            </button>
          </div>
        </div>

        {/* Progress bar if running */}
        {isRunning && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.3rem' }}>
              <span>Running Monte Carlo trials...</span>
              <span>{progress}%</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #06b6d4, #10b981)',
                  transition: 'width 0.2s ease',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* SINGLE AGENT BENCHMARK SECTION (Q1) */}
      {/* ============================================================== */}
      {activeBenchmark === 'single' && (
        <div className="workspace-grid">
          {/* Controls */}
          <div className="glass-card sidebar-panel">
            <span className="panel-title">Single-Robot Parameters</span>

            <div className="control-group">
              <label className="control-label">
                <span>Number of Random Trials</span>
                <span className="control-value">{singleTrials} runs</span>
              </label>
              <input
                type="range"
                min="10"
                max="100"
                step="10"
                value={singleTrials}
                onChange={(e) => setSingleTrials(Number(e.target.value))}
              />
            </div>

            <div className="control-group">
              <label className="control-label">
                <span>Grid Dimensions</span>
                <span className="control-value">{singleGridSize} × {singleGridSize}</span>
              </label>
              <input
                type="range"
                min="10"
                max="26"
                step="2"
                value={singleGridSize}
                onChange={(e) => setSingleGridSize(Number(e.target.value))}
              />
            </div>

            <div className="control-group">
              <label className="control-label">
                <span>Obstacle Density</span>
                <span className="control-value">{Math.round(singleDensity * 100)}%</span>
              </label>
              <input
                type="range"
                min="0.05"
                max="0.35"
                step="0.05"
                value={singleDensity}
                onChange={(e) => setSingleDensity(Number(e.target.value))}
              />
            </div>

            <button
              className="btn btn-primary"
              disabled={isRunning}
              onClick={executeSingleBenchmark}
              style={{ marginTop: '0.5rem' }}
            >
              <Play size={16} />
              <span>{isRunning ? 'Benchmarking...' : 'Execute Benchmark'}</span>
            </button>

            {singleResults && (
              <button className="btn btn-secondary" onClick={exportCSV}>
                <Download size={16} />
                <span>Export Data to CSV</span>
              </button>
            )}
          </div>

          {/* Graph & Stats Output */}
          <div className="glass-card stage-panel">
            <div className="stage-toolbar">
              <span className="stage-title">Comparative Performance Graphs</span>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  className={`btn btn-secondary ${singleMetric === 'nodesExpanded' ? 'btn-primary' : ''}`}
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                  onClick={() => setSingleMetric('nodesExpanded')}
                >
                  Nodes Expanded
                </button>
                <button
                  className={`btn btn-secondary ${singleMetric === 'executionTimeMs' ? 'btn-primary' : ''}`}
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                  onClick={() => setSingleMetric('executionTimeMs')}
                >
                  Runtime (ms)
                </button>
                <button
                  className={`btn btn-secondary ${singleMetric === 'peakOpenSet' ? 'btn-primary' : ''}`}
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                  onClick={() => setSingleMetric('peakOpenSet')}
                >
                  Peak Frontier
                </button>
                <button
                  className={`btn btn-secondary ${singleMetric === 'pathCost' ? 'btn-primary' : ''}`}
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                  onClick={() => setSingleMetric('pathCost')}
                >
                  Path Cost
                </button>
              </div>
            </div>

            {!singleResults ? (
              <div
                style={{
                  padding: '3rem 1rem',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                }}
              >
                <BarChart3 size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
                <p>Click <strong>"Execute Benchmark"</strong> to run automated Monte Carlo trials across all heuristics.</p>
              </div>
            ) : (
              <div className="chart-container">
                <div className="chart-header">
                  <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                    Metric: {singleMetric === 'nodesExpanded' ? 'Mean Nodes Expanded' : singleMetric === 'executionTimeMs' ? 'Average Search Time (ms)' : singleMetric === 'peakOpenSet' ? 'Peak Open Set Memory Size' : 'Path Cost (Steps)'}
                  </span>
                  <span className="badge badge-cyan">{singleResults.trials} Trials • {singleResults.gridSize} Grid</span>
                </div>

                {/* Bar Graph */}
                <div className="bar-chart-wrap">
                  {(() => {
                    const values = singleResults.summary.map((s) => s[singleMetric].mean);
                    const maxVal = Math.max(...values, 0.001);

                    return singleResults.summary.map((item) => {
                      const val = item[singleMetric].mean;
                      const pct = Math.max(8, (val / maxVal) * 100);
                      const color = heuristicColors[item.heuristic] || '#06b6d4';

                      return (
                        <div key={item.heuristic} className="bar-row">
                          <div className="bar-label-wrap">
                            <span>{item.heuristic}</span>
                            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                              {val} {singleMetric === 'executionTimeMs' ? 'ms' : ''} (±{item[singleMetric].std})
                            </span>
                          </div>
                          <div className="bar-track">
                            <div
                              className="bar-fill"
                              style={{
                                width: `${pct}%`,
                                background: color,
                                boxShadow: `0 0 12px ${color}55`,
                              }}
                            >
                              {val}
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Full Statistical Table */}
                <div style={{ marginTop: '1.5rem', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                        <th style={{ textAlign: 'left', padding: '0.5rem' }}>Heuristic</th>
                        <th style={{ textAlign: 'center', padding: '0.5rem' }}>Avg Expansions</th>
                        <th style={{ textAlign: 'center', padding: '0.5rem' }}>Std Dev</th>
                        <th style={{ textAlign: 'center', padding: '0.5rem' }}>Path Cost</th>
                        <th style={{ textAlign: 'center', padding: '0.5rem' }}>Peak Open</th>
                        <th style={{ textAlign: 'center', padding: '0.5rem' }}>Time (ms)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {singleResults.summary.map((s) => (
                        <tr key={s.heuristic} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          <td style={{ padding: '0.5rem', fontWeight: 600 }}>{s.heuristic}</td>
                          <td style={{ textAlign: 'center', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                            {s.nodesExpanded.mean}
                          </td>
                          <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            ±{s.nodesExpanded.std}
                          </td>
                          <td style={{ textAlign: 'center', color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
                            {s.pathCost.mean}
                          </td>
                          <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                            {s.peakOpenSet.mean}
                          </td>
                          <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                            {s.executionTimeMs.mean}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MULTI AGENT BENCHMARK SECTION (Q2) */}
      {/* ============================================================== */}
      {activeBenchmark === 'multi' && (
        <div className="workspace-grid">
          {/* Controls */}
          <div className="glass-card sidebar-panel">
            <span className="panel-title">Multi-Agent Scalability</span>

            <div className="control-group">
              <label className="control-label">
                <span>Number of Random Trials</span>
                <span className="control-value">{multiTrials} runs</span>
              </label>
              <input
                type="range"
                min="5"
                max="30"
                step="5"
                value={multiTrials}
                onChange={(e) => setMultiTrials(Number(e.target.value))}
              />
            </div>

            <div className="control-group">
              <label className="control-label">
                <span>Number of Agents</span>
                <span className="control-value">{multiAgents} Robots</span>
              </label>
              <input
                type="range"
                min="2"
                max="6"
                value={multiAgents}
                onChange={(e) => setMultiAgents(Number(e.target.value))}
              />
            </div>

            <div className="control-group">
              <label className="control-label">
                <span>Grid Dimension</span>
                <span className="control-value">{multiGridSize} × {multiGridSize}</span>
              </label>
              <input
                type="range"
                min="10"
                max="18"
                step="2"
                value={multiGridSize}
                onChange={(e) => setMultiGridSize(Number(e.target.value))}
              />
            </div>

            <div className="control-group">
              <label className="control-label">
                <span>Obstacle Density</span>
                <span className="control-value">{Math.round(multiDensity * 100)}%</span>
              </label>
              <input
                type="range"
                min="0.1"
                max="0.25"
                step="0.05"
                value={multiDensity}
                onChange={(e) => setMultiDensity(Number(e.target.value))}
              />
            </div>

            <button
              className="btn btn-primary"
              disabled={isRunning}
              onClick={executeMultiBenchmark}
              style={{ marginTop: '0.5rem' }}
            >
              <Play size={16} />
              <span>{isRunning ? 'Benchmarking MAPF...' : 'Execute MAPF Benchmark'}</span>
            </button>

            {multiResults && (
              <button className="btn btn-secondary" onClick={exportCSV}>
                <Download size={16} />
                <span>Export Data to CSV</span>
              </button>
            )}
          </div>

          {/* Graph & Stats Output */}
          <div className="glass-card stage-panel">
            <div className="stage-toolbar">
              <span className="stage-title">MAPF Performance Graphs</span>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  className={`btn btn-secondary ${multiMetric === 'collisions' ? 'btn-primary' : ''}`}
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                  onClick={() => setMultiMetric('collisions')}
                >
                  Collisions
                </button>
                <button
                  className={`btn btn-secondary ${multiMetric === 'successRatePct' ? 'btn-primary' : ''}`}
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                  onClick={() => setMultiMetric('successRatePct')}
                >
                  Success Rate (%)
                </button>
                <button
                  className={`btn btn-secondary ${multiMetric === 'executionTimeMs' ? 'btn-primary' : ''}`}
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                  onClick={() => setMultiMetric('executionTimeMs')}
                >
                  Runtime (ms)
                </button>
                <button
                  className={`btn btn-secondary ${multiMetric === 'totalCost' ? 'btn-primary' : ''}`}
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                  onClick={() => setMultiMetric('totalCost')}
                >
                  Flowtime
                </button>
              </div>
            </div>

            {!multiResults ? (
              <div
                style={{
                  padding: '3rem 1rem',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                }}
              >
                <BarChart3 size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
                <p>Click <strong>"Execute MAPF Benchmark"</strong> to compare Plain A* vs Prioritized Space-Time A* vs CBS.</p>
              </div>
            ) : (
              <div className="chart-container">
                <div className="chart-header">
                  <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                    Metric: {multiMetric === 'collisions' ? 'Average Collisions Detected per Trial' : multiMetric === 'successRatePct' ? 'Collision-Free Success Rate (%)' : multiMetric === 'executionTimeMs' ? 'Runtime (ms)' : 'Sum of Costs (Flowtime)'}
                  </span>
                  <span className="badge badge-emerald">{multiResults.trials} Trials • {multiResults.numAgents} Agents</span>
                </div>

                {/* Bar Graph */}
                <div className="bar-chart-wrap">
                  {(() => {
                    const values = multiResults.summary.map((s) =>
                      multiMetric === 'successRatePct' ? s.successRatePct : s[multiMetric].mean
                    );
                    const maxVal = Math.max(...values, 0.001);

                    return multiResults.summary.map((item) => {
                      const val = multiMetric === 'successRatePct' ? item.successRatePct : item[multiMetric].mean;
                      const pct = Math.max(6, (val / maxVal) * 100);
                      const color = mapfColors[item.method] || '#06b6d4';

                      return (
                        <div key={item.method} className="bar-row">
                          <div className="bar-label-wrap">
                            <span>{item.method}</span>
                            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                              {val} {multiMetric === 'executionTimeMs' ? 'ms' : multiMetric === 'successRatePct' ? '%' : ''}
                            </span>
                          </div>
                          <div className="bar-track">
                            <div
                              className="bar-fill"
                              style={{
                                width: `${pct}%`,
                                background: color,
                                boxShadow: `0 0 12px ${color}55`,
                              }}
                            >
                              {val}
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Table */}
                <div style={{ marginTop: '1.5rem', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                        <th style={{ textAlign: 'left', padding: '0.5rem' }}>Method</th>
                        <th style={{ textAlign: 'center', padding: '0.5rem' }}>Avg Collisions</th>
                        <th style={{ textAlign: 'center', padding: '0.5rem' }}>Success Rate (%)</th>
                        <th style={{ textAlign: 'center', padding: '0.5rem' }}>Makespan</th>
                        <th style={{ textAlign: 'center', padding: '0.5rem' }}>Flowtime</th>
                        <th style={{ textAlign: 'center', padding: '0.5rem' }}>Time (ms)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {multiResults.summary.map((s) => (
                        <tr key={s.method} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          <td style={{ padding: '0.5rem', fontWeight: 600 }}>{s.method}</td>
                          <td style={{ textAlign: 'center', color: s.collisions.mean > 0 ? '#f43f5e' : '#10b981', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                            {s.collisions.mean}
                          </td>
                          <td style={{ textAlign: 'center', color: s.successRatePct > 80 ? '#10b981' : '#f43f5e', fontFamily: 'var(--font-mono)' }}>
                            {s.successRatePct}%
                          </td>
                          <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                            {s.makespan.mean}
                          </td>
                          <td style={{ textAlign: 'center', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                            {s.totalCost.mean}
                          </td>
                          <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                            {s.executionTimeMs.mean}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
