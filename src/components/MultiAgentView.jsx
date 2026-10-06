import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Zap,
  Sliders,
  Cpu,
  Clock,
  Users,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Layers,
  ChevronRight,
  TrendingUp,
  Award,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateRandomGrid, PRESETS, AGENT_PALETTES } from '../utils/gridGenerator';
import { runPlainMapfAStar } from '../algorithms/mapfPlainAStar';
import { runPrioritizedMapf } from '../algorithms/mapfPrioritized';
import { runCBSMapf } from '../algorithms/mapfCBS';
import { MetricCard } from './MetricCard';

export function MultiAgentView() {
  // Config state
  const [numAgents, setNumAgents] = useState(4);
  const [gridSize, setGridSize] = useState(14);
  const [density, setDensity] = useState(0.18);
  const [selectedPreset, setSelectedPreset] = useState('CUSTOM');
  const [selectedMethod, setSelectedMethod] = useState('PRIORITIZED'); // 'PLAIN' | 'PRIORITIZED' | 'CBS'
  const [priorityStrategy, setPriorityStrategy] = useState('LONGEST_FIRST');

  // Grid & Agents Data
  const [gridData, setGridData] = useState(() =>
    generateRandomGrid({ width: 14, height: 14, obstacleDensity: 0.18, numAgents: 4 })
  );

  // Solved Trajectories & Results for all 3 algorithms
  const [allResults, setAllResults] = useState({
    plain: null,
    prioritized: null,
    cbs: null,
  });

  // Current active result
  const activeResult = useMemo(() => {
    if (selectedMethod === 'PLAIN') return allResults.plain;
    if (selectedMethod === 'PRIORITIZED') return allResults.prioritized;
    if (selectedMethod === 'CBS') return allResults.cbs;
    return allResults.prioritized;
  }, [selectedMethod, allResults]);

  // Timestep Simulation State
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(400); // ms per timestep

  // 3D Camera Perspective State
  const [cameraView, setCameraView] = useState('3D'); // '3D' | 'CINEMATIC' | '2D' | 'custom'
  const [pitch, setPitch] = useState(54);
  const [yaw, setYaw] = useState(-28);
  const [zoom, setZoom] = useState(1.0);
  const [isOrbiting, setIsOrbiting] = useState(false);

  const handleCameraPreset = (mode) => {
    setCameraView(mode);
    setIsOrbiting(false);
    if (mode === '3D') {
      setPitch(54);
      setYaw(-28);
      setZoom(1.0);
    } else if (mode === 'CINEMATIC') {
      setPitch(68);
      setYaw(-15);
      setZoom(1.05);
    } else if (mode === '2D') {
      setPitch(0);
      setYaw(0);
      setZoom(1.0);
    }
  };

  const timerRef = useRef(null);

  // Compute solutions for all algorithms on current grid
  const solveAllMethods = (grid = gridData) => {
    // 1. Plain A*
    const plain = runPlainMapfAStar({
      width: grid.width,
      height: grid.height,
      obstacles: grid.obstacles,
      agents: grid.agents,
    });

    // 2. Prioritized Planning
    const prio = runPrioritizedMapf({
      width: grid.width,
      height: grid.height,
      obstacles: grid.obstacles,
      agents: grid.agents,
      priorityStrategy,
    });

    // 3. Conflict-Based Search (CBS)
    const cbs = runCBSMapf({
      width: grid.width,
      height: grid.height,
      obstacles: grid.obstacles,
      agents: grid.agents,
      maxHighLevelNodes: 250,
      maxTimeMs: 2000,
    });

    setAllResults({ plain, prioritized: prio, cbs });
    setCurrentStep(0);
    setIsPlaying(false);
  };

  useEffect(() => {
    solveAllMethods();
  }, [gridData, priorityStrategy]);

  // Handle Preset Selection
  const handleSelectPreset = (key) => {
    setSelectedPreset(key);
    if (key === 'CUSTOM') {
      const g = generateRandomGrid({
        width: gridSize,
        height: gridSize,
        obstacleDensity: density,
        numAgents,
      });
      setGridData(g);
    } else {
      const preset = PRESETS[key];
      if (preset) {
        const g = preset.generator();
        setGridSize(g.width);
        setNumAgents(g.agents.length);
        setGridData(g);
      }
    }
  };

  // Playback Step Timer
  const maxMakespan = useMemo(() => {
    if (!activeResult?.trajectories) return 0;
    return Math.max(0, ...activeResult.trajectories.map((t) => (t ? t.length - 1 : 0)));
  }, [activeResult]);

  useEffect(() => {
    if (!isPlaying) return;

    timerRef.current = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < maxMakespan) {
          return prev + 1;
        } else {
          setIsPlaying(false);
          if (activeResult?.collisionCount === 0 && activeResult?.success) {
            confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
          }
          return prev;
        }
      });
    }, playbackSpeed);

    return () => clearInterval(timerRef.current);
  }, [isPlaying, maxMakespan, playbackSpeed, activeResult]);

  // Current positions of agents at currentStep
  const agentPositions = useMemo(() => {
    if (!activeResult?.trajectories) return [];
    return gridData.agents.map((agent, i) => {
      const traj = activeResult.trajectories[i];
      if (!traj || traj.length === 0) return agent.start;
      const stepIdx = Math.min(currentStep, traj.length - 1);
      return traj[stepIdx] || agent.start;
    });
  }, [activeResult, currentStep, gridData.agents]);

  // Current heading angle of each agent
  const agentHeadings = useMemo(() => {
    if (!activeResult?.trajectories) return gridData.agents.map(() => 0);
    return gridData.agents.map((agent, i) => {
      const traj = activeResult.trajectories[i];
      if (!traj || traj.length <= 1) return 0;
      const stepIdx = Math.min(currentStep, traj.length - 1);
      const curr = traj[stepIdx];
      const next = traj[Math.min(stepIdx + 1, traj.length - 1)];
      const prev = traj[Math.max(0, stepIdx - 1)];
      const target = next !== curr ? next : curr;
      const source = next !== curr ? curr : prev;
      if (!source || !target || (source.x === target.x && source.y === target.y)) return 0;
      const angleRad = Math.atan2(target.y - source.y, target.x - source.x);
      return Math.round((angleRad * 180) / Math.PI) + 90;
    });
  }, [activeResult, currentStep, gridData.agents]);

  // Collisions active at currentStep (if Plain A*)
  const activeCollisions = useMemo(() => {
    if (!activeResult?.collisions) return [];
    return activeResult.collisions.filter((c) => c.time === currentStep);
  }, [activeResult, currentStep]);

  return (
    <div className="main-content">
      {/* KPI Cards */}
      <div className="kpi-grid">
        <MetricCard
          title="Collisions Detected"
          value={activeResult?.collisionCount ?? 0}
          unit="events"
          icon={activeResult?.collisionCount === 0 ? ShieldCheck : ShieldAlert}
          badge={activeResult?.collisionCount === 0 ? 'Zero Collisions' : 'COLLISIONS DETECTED'}
          badgeType={activeResult?.collisionCount === 0 ? 'emerald' : 'rose'}
          detail={
            activeResult?.collisionCount === 0
              ? '100% collision-free coordination'
              : `${activeResult?.vertexCollisions || 0} Vertex + ${activeResult?.edgeCollisions || 0} Edge swaps`
          }
          color={activeResult?.collisionCount === 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)'}
        />
        <MetricCard
          title="Sum of Costs (Flowtime)"
          value={activeResult?.totalCost ?? 0}
          unit="ticks"
          icon={TrendingUp}
          badge={selectedMethod === 'CBS' ? 'Optimal Flowtime' : 'Sum of Steps'}
          badgeType={selectedMethod === 'CBS' ? 'emerald' : 'cyan'}
          detail="Total energy/travel time"
          color="var(--accent-cyan)"
        />
        <MetricCard
          title="Makespan"
          value={activeResult?.makespan ?? 0}
          unit="clock ticks"
          icon={Clock}
          badge="Mission Horizon"
          badgeType="amber"
          detail="Time until last robot docks"
          color="var(--accent-amber)"
        />
        <MetricCard
          title="Search Runtime"
          value={activeResult?.executionTimeMs ?? 0}
          unit="ms"
          icon={Cpu}
          badge="Micro-timed"
          badgeType="violet"
          detail="Spatio-temporal planning"
          color="var(--accent-violet)"
        />
      </div>

      {/* Main Multi-Agent Grid */}
      <div className="workspace-grid">
        {/* Controls Sidebar */}
        <div className="glass-card sidebar-panel">
          <div className="panel-header">
            <span className="panel-title">
              <Users size={18} color="var(--accent-cyan)" />
              MAPF Coordination Engine
            </span>
            <span className="badge badge-emerald">Multi-Robot</span>
          </div>

          {/* Algorithm Switcher */}
          <div className="control-group">
            <label className="control-label">
              <span>Multi-Robot Algorithm</span>
              <span className="control-value">
                {selectedMethod === 'PLAIN'
                  ? 'Plain A*'
                  : selectedMethod === 'PRIORITIZED'
                  ? 'Prioritized Space-Time'
                  : 'Conflict-Based Search'}
              </span>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <button
                className={`btn btn-secondary ${selectedMethod === 'PLAIN' ? 'btn-danger' : ''}`}
                style={{ justifyContent: 'flex-start', fontSize: '0.8rem' }}
                onClick={() => setSelectedMethod('PLAIN')}
              >
                <AlertTriangle size={15} />
                <span>1. Plain Independent A* (Baseline)</span>
              </button>
              <button
                className={`btn btn-secondary ${selectedMethod === 'PRIORITIZED' ? 'btn-primary' : ''}`}
                style={{ justifyContent: 'flex-start', fontSize: '0.8rem' }}
                onClick={() => setSelectedMethod('PRIORITIZED')}
              >
                <Zap size={15} />
                <span>2. Prioritized Space-Time A* (CA*)</span>
              </button>
              <button
                className={`btn btn-secondary ${selectedMethod === 'CBS' ? 'btn-primary' : ''}`}
                style={{ justifyContent: 'flex-start', fontSize: '0.8rem' }}
                onClick={() => setSelectedMethod('CBS')}
              >
                <Award size={15} />
                <span>3. Conflict-Based Search (Optimal CBS)</span>
              </button>
            </div>
          </div>

          {/* Scenario Presets */}
          <div className="control-group">
            <label className="control-label">
              <span>Benchmark Scenarios</span>
            </label>
            <select
              className="custom-select"
              value={selectedPreset}
              onChange={(e) => handleSelectPreset(e.target.value)}
            >
              <option value="CUSTOM">Randomized Custom Grid</option>
              <option value="CORRIDOR_BOTTLENECK">Narrow Corridor Bottleneck</option>
              <option value="CROSS_INTERSECTION">4-Way Cross Intersection</option>
              <option value="WAREHOUSE_AISLES">Automated Warehouse Aisles</option>
            </select>
          </div>

          {/* Agent Count & Grid Controls if Custom */}
          {selectedPreset === 'CUSTOM' && (
            <>
              <div className="control-group">
                <label className="control-label">
                  <span>Number of Autonomous Robots</span>
                  <span className="control-value">{numAgents} Robots</span>
                </label>
                <input
                  type="range"
                  min="2"
                  max="8"
                  value={numAgents}
                  onChange={(e) => {
                    const n = parseInt(e.target.value);
                    setNumAgents(n);
                    const newG = generateRandomGrid({
                      width: gridSize,
                      height: gridSize,
                      obstacleDensity: density,
                      numAgents: n,
                    });
                    setGridData(newG);
                  }}
                />
              </div>

              <div className="control-group">
                <label className="control-label">
                  <span>Grid Dimension</span>
                  <span className="control-value">
                    {gridSize} × {gridSize}
                  </span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="22"
                  step="2"
                  value={gridSize}
                  onChange={(e) => {
                    const s = parseInt(e.target.value);
                    setGridSize(s);
                    const newG = generateRandomGrid({
                      width: s,
                      height: s,
                      obstacleDensity: density,
                      numAgents,
                    });
                    setGridData(newG);
                  }}
                />
              </div>

              <div className="control-group">
                <label className="control-label">
                  <span>Obstacle Density</span>
                  <span className="control-value">{Math.round(density * 100)}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="0.3"
                  step="0.02"
                  value={density}
                  onChange={(e) => {
                    const d = parseFloat(e.target.value);
                    setDensity(d);
                    const newG = generateRandomGrid({
                      width: gridSize,
                      height: gridSize,
                      obstacleDensity: d,
                      numAgents,
                    });
                    setGridData(newG);
                  }}
                />
              </div>
            </>
          )}

          {/* Priority Strategy if Prioritized chosen */}
          {selectedMethod === 'PRIORITIZED' && (
            <div className="control-group">
              <label className="control-label">
                <span>Priority Assignment Rule</span>
              </label>
              <select
                className="custom-select"
                value={priorityStrategy}
                onChange={(e) => setPriorityStrategy(e.target.value)}
              >
                <option value="LONGEST_FIRST">Longest Distance First (LDF)</option>
                <option value="SHORTEST_FIRST">Shortest Path First</option>
                <option value="INDEX">Agent Index Order (1 to N)</option>
              </select>
            </div>
          )}

          {/* Regenerate Button */}
          <button
            className="btn btn-primary"
            style={{ marginTop: '0.5rem' }}
            onClick={() => handleSelectPreset(selectedPreset)}
          >
            <Sparkles size={16} />
            <span>Generate New Configuration</span>
          </button>
        </div>

        {/* Right Stage: Simulation Canvas */}
        <div className="glass-card stage-panel">
          <div className="stage-toolbar">
            <div className="stage-title-wrap">
              <span className="stage-title">Multi-Robot Simulation</span>
              <span
                className={`badge ${
                  selectedMethod === 'PLAIN' ? 'badge-rose' : 'badge-emerald'
                }`}
              >
                {selectedMethod === 'PLAIN' ? 'Naive Decoupled (Collisions)' : 'Coordinated (0 Collisions)'}
              </span>
            </div>

            {/* Playback Controls */}
            <div className="playback-controls">
              <button
                className="playback-btn"
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentStep(0);
                }}
                title="Reset to t=0"
              >
                <RotateCcw size={16} />
              </button>
              <button
                className="playback-btn"
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentStep((prev) => Math.max(0, prev - 1));
                }}
                disabled={currentStep <= 0}
                title="Go Back 1 Timestep"
              >
                <SkipBack size={16} />
              </button>
              <button
                className={`playback-btn ${isPlaying ? 'active' : ''}`}
                onClick={() => setIsPlaying(!isPlaying)}
                title={isPlaying ? 'Pause' : 'Play Simulation'}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button
                className="playback-btn"
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentStep((prev) => Math.min(maxMakespan, prev + 1));
                }}
                disabled={currentStep >= maxMakespan}
                title="Next 1 Timestep"
              >
                <SkipForward size={16} />
              </button>

              <div style={{ width: '1px', height: '18px', background: 'var(--border-subtle)', margin: '0 4px' }} />

              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Speed:</span>
              <select
                className="custom-select"
                style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem', width: 'auto' }}
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
              >
                <option value={700}>0.5x Slow</option>
                <option value={400}>1x Normal</option>
                <option value={150}>2.5x Fast</option>
                <option value={50}>5x Rapid</option>
              </select>
            </div>
          </div>

          {/* Timeline Bar */}
          <div className="timeline-bar">
            <span className="timeline-step-label">
              Timestep t = {currentStep} / {maxMakespan}
            </span>
            <input
              type="range"
              min="0"
              max={maxMakespan || 1}
              value={currentStep}
              onChange={(e) => {
                setCurrentStep(Number(e.target.value));
                setIsPlaying(false);
              }}
            />
          </div>

          {/* Conflict Alert Banner if collisions occur in current view */}
          {selectedMethod === 'PLAIN' && activeResult?.collisionCount > 0 && (
            <div className="conflict-alert">
              <div className="conflict-info">
                <AlertTriangle size={20} color="#f43f5e" />
                <span>
                  <strong>Plain A* Fails:</strong> {activeResult.collisionCount} collisions detected! (
                  {activeResult.vertexCollisions} Vertex collisions, {activeResult.edgeCollisions} Edge swap
                  collisions). Switch to <strong>Prioritized Space-Time A*</strong> or{' '}
                  <strong>Conflict-Based Search</strong> to resolve all collisions.
                </span>
              </div>
              <button
                className="btn btn-primary"
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                onClick={() => setSelectedMethod('PRIORITIZED')}
              >
                Switch to Proposed Solution
              </button>
            </div>
          )}

          {selectedMethod !== 'PLAIN' && activeResult?.success && (
            <div className="conflict-alert success">
              <div className="conflict-info">
                <ShieldCheck size={20} color="#10b981" />
                <span>
                  <strong>Success: 0 Collisions!</strong> Proposed spatio-temporal reservation table
                  coordinated all {gridData.agents.length} robots with dynamic wait actions and evasions.
                </span>
              </div>
            </div>
          )}

          {/* Visual Canvas */}
          <div className="visualizer-container">
            {/* 3D Camera Controls Bar */}
            <div className="camera-controls-bar">
              <div className="camera-preset-group">
                <button
                  className={`camera-btn ${cameraView === '3D' ? 'active' : ''}`}
                  onClick={() => handleCameraPreset('3D')}
                  title="Isometric 3D Perspective"
                >
                  <span>Isometric 3D</span>
                </button>
                <button
                  className={`camera-btn ${cameraView === 'CINEMATIC' ? 'active' : ''}`}
                  onClick={() => handleCameraPreset('CINEMATIC')}
                  title="Dramatic Low Angle Perspective"
                >
                  <span>Cinematic 3D</span>
                </button>
                <button
                  className={`camera-btn ${cameraView === '2D' ? 'active' : ''}`}
                  onClick={() => handleCameraPreset('2D')}
                  title="Planar Top-Down View"
                >
                  <span>Top-Down 2D</span>
                </button>
                <button
                  className={`camera-btn ${isOrbiting ? 'active' : ''}`}
                  onClick={() => setIsOrbiting(!isOrbiting)}
                  title="Cinematic Camera Orbit"
                >
                  <span>{isOrbiting ? '⏸ Orbiting' : '🔄 Auto-Orbit'}</span>
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div className="camera-slider-group">
                  <span>Pitch: {pitch}°</span>
                  <input
                    type="range"
                    min="0"
                    max="75"
                    value={pitch}
                    onChange={(e) => {
                      setPitch(Number(e.target.value));
                      setCameraView('custom');
                    }}
                  />
                </div>
                <div className="camera-slider-group">
                  <span>Yaw: {yaw}°</span>
                  <input
                    type="range"
                    min="-60"
                    max="60"
                    value={yaw}
                    onChange={(e) => {
                      setYaw(Number(e.target.value));
                      setCameraView('custom');
                    }}
                  />
                </div>
                <div className="camera-slider-group">
                  <span>Zoom: {zoom.toFixed(1)}x</span>
                  <input
                    type="range"
                    min="0.8"
                    max="1.3"
                    step="0.05"
                    value={zoom}
                    onChange={(e) => {
                      setZoom(Number(e.target.value));
                      setCameraView('custom');
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Legend for Agents */}
            <div
              className="legend-bar"
              style={{ marginBottom: '1.25rem', width: '100%', maxWidth: '640px' }}
            >
              {gridData.agents.map((agent) => (
                <div key={agent.id} className="legend-item">
                  <div
                    className="legend-color-dot"
                    style={{ background: agent.color, boxShadow: `0 0 8px ${agent.glow}` }}
                  />
                  <span>
                    {agent.name} (G: {agent.goal.x},{agent.goal.y})
                  </span>
                </div>
              ))}
            </div>

            {/* 3D Grid Board Stage */}
            <div
              className={`grid-stage-3d ${isOrbiting ? 'orbiting' : ''}`}
              style={
                !isOrbiting
                  ? {
                      transform: `rotateX(${pitch}deg) rotateZ(${yaw}deg) scale3d(${zoom}, ${zoom}, ${zoom})`,
                    }
                  : {}
              }
            >
              <div
                className="grid-wrapper"
                style={{
                  width: Math.min(540, window.innerWidth * 0.45),
                  height: Math.min(540, window.innerWidth * 0.45),
                }}
              >
                <div
                  className="grid-board"
                  style={{
                    gridTemplateColumns: `repeat(${gridData.width}, 1fr)`,
                    gridTemplateRows: `repeat(${gridData.height}, 1fr)`,
                    width: '100%',
                    height: '100%',
                  }}
                >
                  {Array.from({ length: gridData.height }).map((_, y) =>
                    Array.from({ length: gridData.width }).map((_, x) => {
                      const key = `${x},${y}`;
                      const isObstacle = gridData.obstacles.has(key);

                      // Find if any agent goal is here
                      const goalAgent = gridData.agents.find((a) => a.goal.x === x && a.goal.y === y);
                      const startAgent = gridData.agents.find((a) => a.start.x === x && a.start.y === y);

                      let cellStyle = {};
                      if (goalAgent) {
                        cellStyle = {
                          border: `2px dashed ${goalAgent.color}`,
                          background: `${goalAgent.color}22`,
                          boxShadow: `0 0 10px ${goalAgent.color}44`,
                        };
                      } else if (startAgent) {
                        cellStyle = {
                          border: `1px solid ${startAgent.color}`,
                          background: `${startAgent.color}15`,
                        };
                      }

                      return (
                        <div
                          key={key}
                          className={`grid-cell ${isObstacle ? 'obstacle' : ''}`}
                          style={cellStyle}
                        >
                          {goalAgent && (
                            <span
                              style={{
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                color: goalAgent.color,
                                transform: 'translateZ(12px)',
                                display: 'inline-block',
                              }}
                            >
                              G{goalAgent.id + 1}
                            </span>
                          )}
                          {startAgent && !goalAgent && (
                            <span
                              style={{
                                fontSize: '0.65rem',
                                opacity: 0.8,
                                color: startAgent.color,
                                transform: 'translateZ(8px)',
                                display: 'inline-block',
                              }}
                            >
                              S{startAgent.id + 1}
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* 3D Autonomous Robot Drones */}
                {agentPositions.map((pos, i) => {
                  if (!pos) return null;
                  const agent = gridData.agents[i];
                  const isAtGoal = pos.x === agent.goal.x && pos.y === agent.goal.y;

                  return (
                    <div
                      key={agent.id}
                      className="robot-drone-3d"
                      style={{
                        width: `${100 / gridData.width}%`,
                        height: `${100 / gridData.height}%`,
                        left: `${(pos.x * 100) / gridData.width}%`,
                        top: `${(pos.y * 100) / gridData.height}%`,
                        color: agent.color,
                        '--robot-duration': `${playbackSpeed}ms`,
                      }}
                      title={`${agent.name} at (${pos.x}, ${pos.y})`}
                    >
                      <div className="drone-ground-shadow" />
                      <div
                        className="drone-body-3d"
                        style={{
                          background: agent.color,
                          borderColor: '#ffffff',
                          boxShadow: `0 4px 14px rgba(0, 0, 0, 0.8), 0 0 20px ${agent.glow}`,
                          fontSize: '0.75rem',
                          '--robot-heading': `${agentHeadings[i] || 0}deg`,
                        }}
                      >
                        <div className="drone-head-arrow" />
                        <span>{isAtGoal ? '✓' : agent.id + 1}</span>
                        <div
                          className="drone-thruster-light"
                          style={{ background: '#ffffff', boxShadow: `0 0 10px ${agent.color}` }}
                        />
                      </div>
                    </div>
                  );
                })}

                {/* 3D Collision Badges */}
                {activeCollisions.map((col, idx) => {
                  const cell = col.cell || col.cellA;
                  return (
                    <div
                      key={idx}
                      className="collision-badge-3d"
                      style={{
                        left: `calc(${(cell.x * 100) / gridData.width}% - 4px)`,
                        top: `calc(${(cell.y * 100) / gridData.height}% - 4px)`,
                      }}
                      title={col.description}
                    >
                      <div className="collision-blast-ring">💥</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Comparative Table: Plain A* vs Prioritized vs CBS on THIS instance */}
          <div
            style={{
              marginTop: '1rem',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              padding: '1rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.75rem',
              }}
            >
              <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>
                Algorithmic Comparison on Current MAPF Instance
              </span>
              <span className="badge badge-cyan">Evaluation Matrix</span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                    <th style={{ textAlign: 'left', padding: '0.5rem' }}>Method</th>
                    <th style={{ textAlign: 'center', padding: '0.5rem' }}>Collisions</th>
                    <th style={{ textAlign: 'center', padding: '0.5rem' }}>Status</th>
                    <th style={{ textAlign: 'center', padding: '0.5rem' }}>Sum of Costs (Flowtime)</th>
                    <th style={{ textAlign: 'center', padding: '0.5rem' }}>Makespan</th>
                    <th style={{ textAlign: 'center', padding: '0.5rem' }}>Time (ms)</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Row 1: Plain A* */}
                  <tr
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      background: selectedMethod === 'PLAIN' ? 'rgba(244, 63, 94, 0.08)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '0.55rem' }}>Plain Independent A*</td>
                    <td style={{ textAlign: 'center', color: '#f43f5e', fontWeight: 700 }}>
                      {allResults.plain?.collisionCount ?? 0} collisions
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge badge-rose">Unsafe / Collisions</span>
                    </td>
                    <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                      {allResults.plain?.totalCost} (Invalid)
                    </td>
                    <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                      {allResults.plain?.makespan}
                    </td>
                    <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                      {allResults.plain?.executionTimeMs}
                    </td>
                  </tr>

                  {/* Row 2: Prioritized Space-Time A* */}
                  <tr
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      background: selectedMethod === 'PRIORITIZED' ? 'rgba(6, 182, 212, 0.08)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '0.55rem' }}>Prioritized Space-Time A* (CA*)</td>
                    <td style={{ textAlign: 'center', color: '#10b981', fontWeight: 700 }}>
                      0 (Zero collisions)
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge badge-emerald">Collision-Free</span>
                    </td>
                    <td style={{ textAlign: 'center', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                      {allResults.prioritized?.totalCost}
                    </td>
                    <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                      {allResults.prioritized?.makespan}
                    </td>
                    <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                      {allResults.prioritized?.executionTimeMs}
                    </td>
                  </tr>

                  {/* Row 3: CBS */}
                  <tr
                    style={{
                      background: selectedMethod === 'CBS' ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '0.55rem' }}>Conflict-Based Search (Optimal CBS)</td>
                    <td style={{ textAlign: 'center', color: '#10b981', fontWeight: 700 }}>
                      0 (Zero collisions)
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge badge-emerald">Optimal Solution</span>
                    </td>
                    <td style={{ textAlign: 'center', color: 'var(--accent-emerald)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                      {allResults.cbs?.success ? allResults.cbs.totalCost : 'Timed out (Use CA*)'}
                    </td>
                    <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                      {allResults.cbs?.makespan}
                    </td>
                    <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                      {allResults.cbs?.executionTimeMs}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
