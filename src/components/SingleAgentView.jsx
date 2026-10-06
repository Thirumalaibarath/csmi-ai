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
  Compass,
  Layers,
  ChevronRight,
  ChevronLeft,
  TrendingDown,
  Info,
  CheckCircle2,
  AlertTriangle,
  Move,
  Target,
  Navigation,
  Eye,
  Crosshair,
  ArrowRight,
  SkipForward,
  SkipBack,
  Split,
  Maximize2,
  HelpCircle,
} from 'lucide-react';
import {
  HEURISTICS,
  HEURISTIC_DESCRIPTIONS,
  calculateHeuristic,
  getHeuristicAnalysis,
} from '../algorithms/heuristics';
import { runSingleAStar } from '../algorithms/singleAStar';
import { generateRandomGrid } from '../utils/gridGenerator';
import { MetricCard } from './MetricCard';
import { MathProofCard } from './MathProofCard';

export function SingleAgentView() {
  // Grid parameters
  const [gridSize, setGridSize] = useState(16);
  const [density, setDensity] = useState(0.2);
  const [selectedHeuristic, setSelectedHeuristic] = useState(HEURISTICS.MANHATTAN);
  const [weight, setWeight] = useState(1.5);
  const [allowDiagonal, setAllowDiagonal] = useState(false); // 4-way vs 8-way movement

  // Grid state
  const [gridData, setGridData] = useState(() =>
    generateRandomGrid({ width: 16, height: 16, obstacleDensity: 0.2, numAgents: 1 })
  );

  // Interaction Tool Mode: 'WALL_TOGGLE' | 'PLACE_START' | 'PLACE_GOAL' | 'ERASE'
  const [toolMode, setToolMode] = useState('WALL_TOGGLE');
  const [isMouseDown, setIsMouseDown] = useState(false);

  // Active View Mode: 'SINGLE' | 'DUAL_COMPARE'
  const [viewMode, setViewMode] = useState('SINGLE');
  const [compareHeuristicA, setCompareHeuristicA] = useState(HEURISTICS.MANHATTAN);
  const [compareHeuristicB, setCompareHeuristicB] = useState(HEURISTICS.DIJKSTRA);

  // Search Results
  const [searchResult, setSearchResult] = useState(null);

  // Animation Mode: 'SEARCH_WAVE' | 'ROBOT_TRAVERSAL'
  const [animMode, setAnimMode] = useState('ROBOT_TRAVERSAL');

  // 1. Search Wave Animation State (Step through Priority Queue expansions)
  const [searchAnimStep, setSearchAnimStep] = useState(0);
  const [isSearchPlaying, setIsSearchPlaying] = useState(false);
  const [searchSpeedMultiplier, setSearchSpeedMultiplier] = useState(1);

  // 2. Robot Traversal Animation State (Smooth, Controlled Movement along path)
  const [robotStep, setRobotStep] = useState(0);
  const [isRobotTraversing, setIsRobotTraversing] = useState(false);
  const [robotSpeedMultiplier, setRobotSpeedMultiplier] = useState(1);

  const effectiveSearchSpeed = useMemo(() => {
    return Math.max(5, Math.round(30 / searchSpeedMultiplier));
  }, [searchSpeedMultiplier]);

  const effectiveRobotSpeed = useMemo(() => {
    return Math.max(35, Math.round(180 / robotSpeedMultiplier));
  }, [robotSpeedMultiplier]);

  // 3D Camera Perspective State
  const [cameraView, setCameraView] = useState('3D'); // '3D' | 'CINEMATIC' | '2D' | 'custom'
  const [pitch, setPitch] = useState(54);
  const [yaw, setYaw] = useState(-28);
  const [zoom, setZoom] = useState(1.0);
  const [isOrbiting, setIsOrbiting] = useState(false);

  // Hovered Cell for Vector & Angle Telemetry
  const [hoveredCell, setHoveredCell] = useState(null);

  const searchTimerRef = useRef(null);

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

  const CAMERA_PRESETS = ['3D', 'CINEMATIC', '2D'];
  const handlePrevCameraPreset = () => {
    const currentIndex = CAMERA_PRESETS.indexOf(cameraView);
    const prevIndex = currentIndex <= 0 ? CAMERA_PRESETS.length - 1 : currentIndex - 1;
    handleCameraPreset(CAMERA_PRESETS[prevIndex]);
  };
  const handleNextCameraPreset = () => {
    const currentIndex = CAMERA_PRESETS.indexOf(cameraView);
    const nextIndex = (currentIndex + 1) % CAMERA_PRESETS.length;
    handleCameraPreset(CAMERA_PRESETS[nextIndex]);
  };

  // Re-run search whenever grid, heuristic, weight, or movement mode changes
  const executeSearch = (
    grid = gridData,
    heuristic = selectedHeuristic,
    w = weight,
    diagonal = allowDiagonal
  ) => {
    const res = runSingleAStar({
      width: grid.width,
      height: grid.height,
      obstacles: grid.obstacles,
      start: grid.start,
      goal: grid.goal,
      heuristic,
      weight: w,
      allowDiagonal: diagonal,
      recordHistory: true,
    });
    setSearchResult(res);
    setSearchAnimStep(res.visitedOrder ? res.visitedOrder.length : 0);
    setRobotStep(res.path ? res.path.length - 1 : 0);
    setIsSearchPlaying(false);
    setIsRobotTraversing(false);
  };

  useEffect(() => {
    executeSearch();
  }, [gridData, selectedHeuristic, weight, allowDiagonal]);

  // Dual Comparison Results
  const dualResultA = useMemo(() => {
    if (viewMode !== 'DUAL_COMPARE') return null;
    return runSingleAStar({
      width: gridData.width,
      height: gridData.height,
      obstacles: gridData.obstacles,
      start: gridData.start,
      goal: gridData.goal,
      heuristic: compareHeuristicA,
      weight: 1.5,
      allowDiagonal,
      recordHistory: true,
    });
  }, [viewMode, gridData, compareHeuristicA, allowDiagonal]);

  const dualResultB = useMemo(() => {
    if (viewMode !== 'DUAL_COMPARE') return null;
    return runSingleAStar({
      width: gridData.width,
      height: gridData.height,
      obstacles: gridData.obstacles,
      start: gridData.start,
      goal: gridData.goal,
      heuristic: compareHeuristicB,
      weight: 1.5,
      allowDiagonal,
      recordHistory: true,
    });
  }, [viewMode, gridData, compareHeuristicB, allowDiagonal]);

  // Handle randomized grid generation
  const handleRandomizeGrid = () => {
    const newGrid = generateRandomGrid({
      width: gridSize,
      height: gridSize,
      obstacleDensity: density,
      numAgents: 1,
    });
    setGridData(newGrid);
  };

  // Cell Interaction Handler
  const handleCellInteraction = (x, y) => {
    const key = `${x},${y}`;

    // Place Start Mode
    if (toolMode === 'PLACE_START') {
      const newObs = new Set(gridData.obstacles);
      newObs.delete(key);
      setGridData({ ...gridData, start: { x, y }, obstacles: newObs });
      setToolMode('WALL_TOGGLE');
      return;
    }

    // Place Goal Mode
    if (toolMode === 'PLACE_GOAL') {
      const newObs = new Set(gridData.obstacles);
      newObs.delete(key);
      setGridData({ ...gridData, goal: { x, y }, obstacles: newObs });
      setToolMode('WALL_TOGGLE');
      return;
    }

    // Direct click on Start or Goal switches to relocation mode
    if (gridData.start.x === x && gridData.start.y === y) {
      setToolMode('PLACE_START');
      return;
    }
    if (gridData.goal.x === x && gridData.goal.y === y) {
      setToolMode('PLACE_GOAL');
      return;
    }

    // Toggle or erase obstacle
    const newObs = new Set(gridData.obstacles);
    if (toolMode === 'ERASE') {
      newObs.delete(key);
    } else {
      if (newObs.has(key)) newObs.delete(key);
      else newObs.add(key);
    }
    setGridData({ ...gridData, obstacles: newObs });
  };

  // --- Search Wave Animation Loop ---
  useEffect(() => {
    if (!isSearchPlaying || !searchResult?.visitedOrder) return;

    searchTimerRef.current = setInterval(() => {
      setSearchAnimStep((prev) => {
        if (prev < searchResult.visitedOrder.length) {
          return prev + 1;
        } else {
          setIsSearchPlaying(false);
          return prev;
        }
      });
    }, effectiveSearchSpeed);

    return () => clearInterval(searchTimerRef.current);
  }, [isSearchPlaying, searchResult, effectiveSearchSpeed]);

  const startSearchPlayback = () => {
    if (!searchResult?.visitedOrder) return;
    setSearchAnimStep(0);
    setIsSearchPlaying(true);
  };

  const handleSearchStepBack = () => {
    setIsSearchPlaying(false);
    setSearchAnimStep((prev) => Math.max(0, prev - 1));
  };

  const handleSearchStepForward = () => {
    setIsSearchPlaying(false);
    const maxSteps = searchResult?.visitedOrder?.length || 0;
    setSearchAnimStep((prev) => Math.min(maxSteps, prev + 1));
  };

  // --- Robot Traversal Loop ---
  useEffect(() => {
    if (!isRobotTraversing || !searchResult?.path || searchResult.path.length <= 1) return;

    const interval = setInterval(() => {
      setRobotStep((prev) => {
        if (prev < searchResult.path.length - 1) {
          return prev + 1;
        } else {
          setIsRobotTraversing(false);
          return prev;
        }
      });
    }, effectiveRobotSpeed);

    return () => clearInterval(interval);
  }, [isRobotTraversing, searchResult, effectiveRobotSpeed]);

  const startRobotTraversal = () => {
    if (!searchResult?.pathFound || !searchResult?.path || searchResult.path.length === 0) return;
    setRobotStep(0);
    setIsRobotTraversing(true);
  };

  const handleRobotStepBack = () => {
    setIsRobotTraversing(false);
    setRobotStep((prev) => Math.max(0, prev - 1));
  };

  const handleRobotStepForward = () => {
    setIsRobotTraversing(false);
    const maxSteps = Math.max(0, (searchResult?.path?.length || 1) - 1);
    setRobotStep((prev) => Math.min(maxSteps, prev + 1));
  };

  // Current Robot Coordinates
  const currentRobotPos = useMemo(() => {
    if (searchResult?.path && searchResult.path.length > 0) {
      const idx = Math.min(robotStep, searchResult.path.length - 1);
      return searchResult.path[idx] || gridData.start;
    }
    return gridData.start;
  }, [searchResult, robotStep, gridData.start]);

  // Current Robot Heading Angle (Degrees)
  const currentHeading = useMemo(() => {
    if (!searchResult?.path || searchResult.path.length <= 1) return 0;
    const idx = Math.min(robotStep, searchResult.path.length - 1);
    const curr = searchResult.path[idx];
    const next = searchResult.path[Math.min(idx + 1, searchResult.path.length - 1)];
    const prev = searchResult.path[Math.max(0, idx - 1)];

    const target = next !== curr ? next : curr;
    const source = next !== curr ? curr : prev;

    if (!source || !target || (source.x === target.x && source.y === target.y)) return 0;
    const angleRad = Math.atan2(target.y - source.y, target.x - source.x);
    return Math.round((angleRad * 180) / Math.PI) + 90;
  }, [searchResult, robotStep]);

  // Visited Cells Set (for wave animation up to searchAnimStep)
  const visitedSet = useMemo(() => {
    if (!searchResult?.visitedOrder) return new Set();
    const set = new Set();
    const count = Math.min(searchAnimStep, searchResult.visitedOrder.length);
    for (let i = 0; i < count; i++) {
      const node = searchResult.visitedOrder[i];
      set.add(`${node.x},${node.y}`);
    }
    return set;
  }, [searchResult, searchAnimStep]);

  // Node Map for O(1) hover inspector (f = g + h, step #)
  const nodeLookup = useMemo(() => {
    const map = new Map();
    if (!searchResult?.visitedOrder) return map;
    searchResult.visitedOrder.forEach((node, idx) => {
      map.set(`${node.x},${node.y}`, {
        step: idx + 1,
        g: node.g,
        h: Number(node.h.toFixed(1)),
        f: Number(node.f.toFixed(1)),
      });
    });
    return map;
  }, [searchResult]);

  // Path Cells Set
  const pathSet = useMemo(() => {
    if (!searchResult?.path) return new Set();
    const set = new Set();
    searchResult.path.forEach((p) => set.add(`${p.x},${p.y}`));
    return set;
  }, [searchResult]);

  // Traversed Path Set behind Robot
  const traversedSet = useMemo(() => {
    const set = new Set();
    if (!searchResult?.path) return set;
    for (let i = 0; i <= robotStep && i < searchResult.path.length; i++) {
      set.add(`${searchResult.path[i].x},${searchResult.path[i].y}`);
    }
    return set;
  }, [searchResult, robotStep]);

  // Heuristic Telemetry Analysis (from current robot pos or hovered cell to goal)
  const vectorTelemetry = useMemo(() => {
    const refCell = hoveredCell || currentRobotPos;
    return getHeuristicAnalysis(refCell.x, refCell.y, gridData.goal.x, gridData.goal.y);
  }, [hoveredCell, currentRobotPos, gridData.goal]);

  // Hovered Node Details
  const hoveredNodeDetails = useMemo(() => {
    if (!hoveredCell) return null;
    const key = `${hoveredCell.x},${hoveredCell.y}`;
    return nodeLookup.get(key) || null;
  }, [hoveredCell, nodeLookup]);

  // Live Instant Comparison across all Heuristics for THIS Grid
  const comparisonData = useMemo(() => {
    if (!gridData) return [];
    const list = [
      HEURISTICS.MANHATTAN,
      HEURISTICS.EUCLIDEAN,
      HEURISTICS.CHEBYSHEV,
      HEURISTICS.OCTILE,
      HEURISTICS.WEIGHTED_MANHATTAN,
      HEURISTICS.DIJKSTRA,
    ];

    return list.map((h) => {
      const res = runSingleAStar({
        width: gridData.width,
        height: gridData.height,
        obstacles: gridData.obstacles,
        start: gridData.start,
        goal: gridData.goal,
        heuristic: h,
        weight: 1.5,
        allowDiagonal,
        recordHistory: false,
      });
      return {
        heuristic: h,
        found: res.pathFound,
        nodesExpanded: res.nodesExpanded,
        nodesVisited: res.nodesVisited,
        cost: Number(res.pathCost.toFixed(1)),
        peakOpen: res.peakOpenSetSize,
        timeMs: res.executionTimeMs,
        bStar: res.effectiveBranchingFactor,
      };
    });
  }, [gridData, allowDiagonal]);

  const currentHInfo = HEURISTIC_DESCRIPTIONS[selectedHeuristic];

  return (
    <div className="main-content">
      {/* KPI Cards Row */}
      <div className="kpi-grid">
        <MetricCard
          title="Nodes Expanded"
          value={searchResult?.nodesExpanded ?? 0}
          unit="cells"
          icon={Cpu}
          badge={searchResult?.pathFound ? 'Search Complete' : 'No Path'}
          badgeType={searchResult?.pathFound ? 'emerald' : 'rose'}
          detail="PriorityQueue states evaluated"
          color="var(--accent-cyan)"
        />
        <MetricCard
          title="Path Length / Cost"
          value={searchResult?.pathCost ? Number(searchResult.pathCost.toFixed(1)) : 0}
          unit="steps"
          icon={Zap}
          badge={`${searchResult?.pathLength ?? 0} vertices`}
          badgeType="cyan"
          detail={allowDiagonal ? '8-Way (Diagonals allowed)' : '4-Way (Orthogonal step cost 1.0)'}
          color="var(--accent-emerald)"
        />
        <MetricCard
          title="Execution Time"
          value={searchResult?.executionTimeMs ?? 0}
          unit="ms"
          icon={Clock}
          badge="High-Res"
          badgeType="amber"
          detail="Search planning time"
          color="var(--accent-amber)"
        />
        <MetricCard
          title="Peak Frontier Size"
          value={searchResult?.peakOpenSetSize ?? 0}
          unit="nodes"
          icon={Layers}
          badge="Heap Memory"
          badgeType="violet"
          detail="Max Open Set size"
          color="var(--accent-violet)"
        />
      </div>

      {/* Verification Educational Alert Box */}
      <div
        className="glass-card"
        style={{
          padding: '1rem 1.25rem',
          background: 'rgba(6, 182, 212, 0.06)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1rem',
        }}
      >
        <HelpCircle size={24} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--text-primary)' }}>
            How to verify why Heuristics take 34 vs 52 vs 189 nodes:
          </strong>
          <ul style={{ paddingLeft: '1.2rem', marginTop: '0.3rem' }}>
            <li>
              <strong>Path Length ({searchResult?.pathCost || 15} steps)</strong> is the{' '}
              <em>final route the robot drives along</em>. Since all admissible heuristics guarantee finding the shortest path, they all find the exact same {searchResult?.pathCost || 15}-step route.
            </li>
            <li>
              <strong>Nodes Expanded ({searchResult?.nodesExpanded || 34} cells)</strong> is the{' '}
              <em>computational work</em> done during planning. <strong>Click any row in the table below</strong> or click <strong>"Dual Grid Compare"</strong> to physically see the difference: Dijkstra blindly floods the room, while Manhattan cuts straight to the target!
            </li>
          </ul>
        </div>
      </div>

      {/* Main Workspace Grid */}
      <div className="workspace-grid">
        {/* Left Side Controls */}
        <div className="glass-card sidebar-panel">
          <div className="panel-header">
            <span className="panel-title">
              <Sliders size={18} color="var(--accent-cyan)" />
              A* Algorithm Setup
            </span>
            <span className="badge badge-cyan">Single-Robot</span>
          </div>

          {/* View Mode Toggle: Single Grid vs Dual Compare */}
          <div className="control-group">
            <label className="control-label">
              <span>Visualizer Display Mode</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
              <button
                className={`btn btn-secondary ${viewMode === 'SINGLE' ? 'btn-primary' : ''}`}
                style={{ fontSize: '0.75rem', padding: '0.45rem' }}
                onClick={() => setViewMode('SINGLE')}
              >
                Single Grid View
              </button>
              <button
                className={`btn btn-secondary ${viewMode === 'DUAL_COMPARE' ? 'btn-primary' : ''}`}
                style={{ fontSize: '0.75rem', padding: '0.45rem' }}
                onClick={() => setViewMode('DUAL_COMPARE')}
              >
                🔲 Dual Compare
              </button>
            </div>
          </div>

          {/* Movement Model Selector (4-Way vs 8-Way) */}
          <div className="control-group">
            <label className="control-label">
              <span>Kinematic Movement Model</span>
              <span className="control-value">{allowDiagonal ? '8-Directional' : '4-Directional'}</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
              <button
                className={`btn btn-secondary ${!allowDiagonal ? 'btn-primary' : ''}`}
                style={{ fontSize: '0.75rem', padding: '0.45rem' }}
                onClick={() => setAllowDiagonal(false)}
              >
                4-Way (Orthogonal)
              </button>
              <button
                className={`btn btn-secondary ${allowDiagonal ? 'btn-primary' : ''}`}
                style={{ fontSize: '0.75rem', padding: '0.45rem' }}
                onClick={() => setAllowDiagonal(true)}
              >
                8-Way (Diagonals)
              </button>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
              {allowDiagonal
                ? 'Allows diagonal steps (cost √2). Octile & Chebyshev reflect diagonal metrics.'
                : 'Restricts to N, S, E, W steps (cost 1). Manhattan is the exact shortest metric.'}
            </span>
          </div>

          {/* Heuristic Selector */}
          <div className="control-group">
            <label className="control-label">
              <span>A* Heuristic Distance Function</span>
            </label>
            <select
              className="custom-select"
              value={selectedHeuristic}
              onChange={(e) => setSelectedHeuristic(e.target.value)}
            >
              {Object.values(HEURISTICS).map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>

          {/* Weighted Heuristic Slider */}
          {selectedHeuristic === HEURISTICS.WEIGHTED_MANHATTAN && (
            <div className="control-group">
              <label className="control-label">
                <span>Greedy Weight Factor (w)</span>
                <span className="control-value">{weight.toFixed(1)}x</span>
              </label>
              <input
                type="range"
                min="1.0"
                max="3.0"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(parseFloat(e.target.value))}
              />
            </div>
          )}

          {/* Heuristic Explanation Card */}
          {currentHInfo && (
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '0.85rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.78rem',
              }}
            >
              <div style={{ fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '0.35rem' }}>
                {currentHInfo.name}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--accent-emerald)',
                  marginBottom: '0.45rem',
                  fontSize: '0.75rem',
                }}
              >
                {currentHInfo.formula}
              </div>
              <div style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {currentHInfo.description}
              </div>
            </div>
          )}

          {/* Grid Dimensions */}
          <div className="control-group">
            <label className="control-label">
              <span>Grid Dimension</span>
              <span className="control-value">
                {gridSize} × {gridSize}
              </span>
            </label>
            <input
              type="range"
              min="8"
              max="26"
              step="2"
              value={gridSize}
              onChange={(e) => {
                const s = parseInt(e.target.value);
                setGridSize(s);
                const newGrid = generateRandomGrid({
                  width: s,
                  height: s,
                  obstacleDensity: density,
                  numAgents: 1,
                });
                setGridData(newGrid);
              }}
            />
          </div>

          {/* Obstacle Density */}
          <div className="control-group">
            <label className="control-label">
              <span>Obstacle Density</span>
              <span className="control-value">{Math.round(density * 100)}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="0.38"
              step="0.02"
              value={density}
              onChange={(e) => {
                const d = parseFloat(e.target.value);
                setDensity(d);
                const newGrid = generateRandomGrid({
                  width: gridSize,
                  height: gridSize,
                  obstacleDensity: d,
                  numAgents: 1,
                });
                setGridData(newGrid);
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button className="btn btn-primary" onClick={handleRandomizeGrid}>
              <Sparkles size={16} />
              <span>Randomize Grid Environment</span>
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setGridData({ ...gridData, obstacles: new Set() });
              }}
            >
              <RotateCcw size={16} />
              <span>Clear All Obstacles</span>
            </button>
          </div>
        </div>

        {/* Right Stage: 3D Visualizer & Dual Compare */}
        <div className="glass-card stage-panel">
          {/* Top Tool Palette for Wall Painting & Start/Goal Placement */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-secondary)',
              padding: '0.5rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Edit Grid:
              </span>
              <button
                className={`btn btn-secondary ${toolMode === 'PLACE_START' ? 'btn-primary' : ''}`}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.35rem 0.65rem',
                  border: toolMode === 'PLACE_START' ? '1px solid #10b981' : undefined,
                }}
                onClick={() => setToolMode(toolMode === 'PLACE_START' ? 'WALL_TOGGLE' : 'PLACE_START')}
                title="Click any cell to position Robot Start"
              >
                <Move size={14} color="#10b981" />
                <span>Move Start 🟢</span>
              </button>
              <button
                className={`btn btn-secondary ${toolMode === 'PLACE_GOAL' ? 'btn-primary' : ''}`}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.35rem 0.65rem',
                  border: toolMode === 'PLACE_GOAL' ? '1px solid #f59e0b' : undefined,
                }}
                onClick={() => setToolMode(toolMode === 'PLACE_GOAL' ? 'WALL_TOGGLE' : 'PLACE_GOAL')}
                title="Click any cell to position Target Goal"
              >
                <Target size={14} color="#f59e0b" />
                <span>Move Goal 🎯</span>
              </button>
              <button
                className={`btn btn-secondary ${toolMode === 'WALL_TOGGLE' ? 'btn-primary' : ''}`}
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                onClick={() => setToolMode('WALL_TOGGLE')}
                title="Click or drag to paint walls"
              >
                <span>🧱 Paint Walls</span>
              </button>
              <button
                className={`btn btn-secondary ${toolMode === 'ERASE' ? 'btn-primary' : ''}`}
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                onClick={() => setToolMode('ERASE')}
                title="Click or drag to erase walls"
              >
                <span>🧼 Erase</span>
              </button>
            </div>

            {/* Animation Phase Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Animation:
              </span>
              <button
                className={`btn btn-secondary ${animMode === 'ROBOT_TRAVERSAL' ? 'btn-primary' : ''}`}
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                onClick={() => setAnimMode('ROBOT_TRAVERSAL')}
              >
                <span>🤖 Drive Robot</span>
              </button>
              <button
                className={`btn btn-secondary ${animMode === 'SEARCH_WAVE' ? 'btn-primary' : ''}`}
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                onClick={() => setAnimMode('SEARCH_WAVE')}
              >
                <span>🌊 Search Wave ({searchResult?.nodesExpanded || 0})</span>
              </button>
            </div>
          </div>

          {/* Placement Notification Banner */}
          {toolMode === 'PLACE_START' && (
            <div className="placement-mode-banner start">
              <span>
                🟢 <strong>Place Start Active:</strong> Click any cell to place the robot's starting position ({gridData.start.x}, {gridData.start.y}).
              </span>
              <button
                className="btn btn-secondary"
                style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                onClick={() => setToolMode('WALL_TOGGLE')}
              >
                Done
              </button>
            </div>
          )}

          {toolMode === 'PLACE_GOAL' && (
            <div className="placement-mode-banner goal">
              <span>
                🎯 <strong>Place Goal Active:</strong> Click any cell to place the target destination ({gridData.goal.x}, {gridData.goal.y}).
              </span>
              <button
                className="btn btn-secondary"
                style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                onClick={() => setToolMode('WALL_TOGGLE')}
              >
                Done
              </button>
            </div>
          )}

          {/* Animation Controls Bar */}
          {animMode === 'ROBOT_TRAVERSAL' ? (
            <div className="timeline-bar">
              <span className="timeline-step-label">
                Robot Step: {robotStep} / {Math.max(0, (searchResult?.path?.length || 1) - 1)}
              </span>
              <input
                type="range"
                min="0"
                max={Math.max(1, (searchResult?.path?.length || 1) - 1)}
                value={robotStep}
                onChange={(e) => {
                  setRobotStep(Number(e.target.value));
                  setIsRobotTraversing(false);
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                <button
                  className="playback-btn"
                  onClick={() => {
                    setIsRobotTraversing(false);
                    setRobotStep(0);
                  }}
                  title="Reset Robot to Start"
                >
                  <RotateCcw size={14} />
                </button>

                {/* Go Back 1 Step Button */}
                <button
                  className="playback-btn"
                  onClick={handleRobotStepBack}
                  disabled={robotStep <= 0}
                  title="Go Back 1 Step"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', padding: '0.25rem 0.5rem' }}
                >
                  <SkipBack size={13} />
                  <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>Back</span>
                </button>

                {/* Play / Pause Toggle Button */}
                <button
                  className="btn btn-primary"
                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                  onClick={() => {
                    if (isRobotTraversing) {
                      setIsRobotTraversing(false);
                    } else {
                      if (robotStep >= (searchResult?.path?.length || 1) - 1) setRobotStep(0);
                      setIsRobotTraversing(true);
                    }
                  }}
                  disabled={!searchResult?.pathFound}
                  title={isRobotTraversing ? 'Pause Movement' : 'Drive Robot along Path'}
                >
                  {isRobotTraversing ? <Pause size={14} /> : <Play size={14} />}
                  <span>{isRobotTraversing ? 'Pause' : 'Drive'}</span>
                </button>

                {/* Next 1 Step Button */}
                <button
                  className="playback-btn"
                  onClick={handleRobotStepForward}
                  disabled={robotStep >= Math.max(0, (searchResult?.path?.length || 1) - 1)}
                  title="Next 1 Step"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', padding: '0.25rem 0.5rem' }}
                >
                  <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>Next</span>
                  <SkipForward size={13} />
                </button>

                {/* Speed Toggle for Play */}
                <div className="speed-toggle-group" title="Robot Movement Speed Multiplier">
                  <Zap size={11} color="var(--accent-amber)" />
                  {[0.5, 1, 2, 4].map((mult) => (
                    <button
                      key={mult}
                      type="button"
                      className={`speed-btn ${robotSpeedMultiplier === mult ? 'active' : ''}`}
                      onClick={() => setRobotSpeedMultiplier(mult)}
                      title={`Drive Speed: ${mult}x`}
                    >
                      {mult}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="timeline-bar">
              <span className="timeline-step-label">
                Search Expansion: {searchAnimStep} / {searchResult?.visitedOrder?.length || 0}
              </span>
              <input
                type="range"
                min="0"
                max={searchResult?.visitedOrder?.length || 1}
                value={searchAnimStep}
                onChange={(e) => {
                  setSearchAnimStep(Number(e.target.value));
                  setIsSearchPlaying(false);
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                <button
                  className="playback-btn"
                  onClick={() => {
                    setIsSearchPlaying(false);
                    setSearchAnimStep(0);
                  }}
                  title="Reset Search Expansion to Step 0"
                >
                  <RotateCcw size={14} />
                </button>

                {/* Go Back 1 Expansion Step Button */}
                <button
                  className="playback-btn"
                  onClick={handleSearchStepBack}
                  disabled={searchAnimStep <= 0}
                  title="Go Back 1 Expansion Step"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', padding: '0.25rem 0.5rem' }}
                >
                  <SkipBack size={13} />
                  <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>Back</span>
                </button>

                {/* Play / Pause Toggle Button */}
                <button
                  className="btn btn-primary"
                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                  onClick={() => {
                    if (isSearchPlaying) {
                      setIsSearchPlaying(false);
                    } else {
                      if (searchAnimStep >= (searchResult?.visitedOrder?.length || 1)) {
                        setSearchAnimStep(0);
                      }
                      setIsSearchPlaying(true);
                    }
                  }}
                  disabled={!searchResult?.visitedOrder}
                  title={isSearchPlaying ? 'Pause Wave' : 'Expand Search Wave'}
                >
                  {isSearchPlaying ? <Pause size={14} /> : <Play size={14} />}
                  <span>{isSearchPlaying ? 'Pause' : 'Expand Wave'}</span>
                </button>

                {/* Next 1 Expansion Step Button */}
                <button
                  className="playback-btn"
                  onClick={handleSearchStepForward}
                  disabled={searchAnimStep >= (searchResult?.visitedOrder?.length || 0)}
                  title="Next 1 Expansion Step"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', padding: '0.25rem 0.5rem' }}
                >
                  <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>Next</span>
                  <SkipForward size={13} />
                </button>

                {/* Speed Toggle for Play */}
                <div className="speed-toggle-group" title="Search Expansion Speed Multiplier">
                  <Zap size={11} color="var(--accent-amber)" />
                  {[0.5, 1, 2, 4].map((mult) => (
                    <button
                      key={mult}
                      type="button"
                      className={`speed-btn ${searchSpeedMultiplier === mult ? 'active' : ''}`}
                      onClick={() => setSearchSpeedMultiplier(mult)}
                      title={`Expansion Speed: ${mult}x`}
                    >
                      {mult}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW MODE 1: SINGLE GRID VIEW */}
          {/* ============================================================== */}
          {viewMode === 'SINGLE' && (
            <div
              className="visualizer-container"
              onMouseLeave={() => {
                setIsMouseDown(false);
                setHoveredCell(null);
              }}
              onMouseUp={() => setIsMouseDown(false)}
            >
              {/* 3D Camera Controls Bar */}
              <div className="camera-controls-bar">
                <div className="camera-preset-group">
                  <button
                    className="camera-btn"
                    onClick={handlePrevCameraPreset}
                    title="Previous Camera Angle"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                  >
                    <ChevronLeft size={13} />
                    <span>Prev</span>
                  </button>
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
                    className="camera-btn"
                    onClick={handleNextCameraPreset}
                    title="Next Camera Angle"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                  >
                    <span>Next</span>
                    <ChevronRight size={13} />
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

              {/* Legend Bar */}
              <div className="legend-bar" style={{ marginBottom: '1.25rem', width: '100%', maxWidth: '640px' }}>
                <div className="legend-item">
                  <div className="legend-color-dot" style={{ background: '#10b981' }} />
                  <span>Start ({gridData.start.x},{gridData.start.y})</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color-dot" style={{ background: '#f59e0b' }} />
                  <span>Goal ({gridData.goal.x},{gridData.goal.y})</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color-dot" style={{ background: '#253046' }} />
                  <span>3D Wall</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color-dot" style={{ background: 'rgba(139, 92, 246, 0.4)' }} />
                  <span>Explored ({searchResult?.nodesExpanded || 0})</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color-dot" style={{ background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                  <span>Planned Path ({searchResult?.pathCost || 0} steps)</span>
                </div>
              </div>

              {/* 3D Grid Elements Stage */}
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
                        const isStart = gridData.start.x === x && gridData.start.y === y;
                        const isGoal = gridData.goal.x === x && gridData.goal.y === y;
                        const isTraversed = traversedSet.has(key);
                        const isPath = pathSet.has(key);
                        const isVisited = visitedSet.has(key);

                        let cellClass = 'grid-cell';
                        if (isObstacle) cellClass += ' obstacle';
                        else if (isStart) cellClass += ' start-cell';
                        else if (isGoal) cellClass += ' goal-cell';
                        else if (isTraversed) cellClass += ' traversed-cell';
                        else if (isPath) cellClass += ' path-cell';
                        else if (isVisited) cellClass += ' visited';

                        return (
                          <div
                            key={key}
                            className={cellClass}
                            onMouseEnter={() => {
                              setHoveredCell({ x, y });
                              if (isMouseDown && (toolMode === 'WALL_TOGGLE' || toolMode === 'ERASE')) {
                                handleCellInteraction(x, y);
                              }
                            }}
                            onMouseDown={() => {
                              setIsMouseDown(true);
                              handleCellInteraction(x, y);
                            }}
                          >
                            {isStart && (
                              <span
                                style={{
                                  fontSize: '0.85rem',
                                  transform: 'translateZ(10px)',
                                  display: 'inline-block',
                                }}
                              >
                                🟢
                              </span>
                            )}
                            {isGoal && (
                              <span
                                style={{
                                  fontSize: '0.85rem',
                                  transform: 'translateZ(12px)',
                                  display: 'inline-block',
                                }}
                              >
                                🎯
                              </span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* 3D Autonomous Robot Drone with Synchronized Heading Rotation */}
                  {searchResult?.pathFound && currentRobotPos && (
                    <div
                      className="robot-drone-3d"
                      style={{
                        width: `${100 / gridData.width}%`,
                        height: `${100 / gridData.height}%`,
                        left: `${(currentRobotPos.x * 100) / gridData.width}%`,
                        top: `${(currentRobotPos.y * 100) / gridData.height}%`,
                        color: '#06b6d4',
                        '--robot-duration': `${effectiveRobotSpeed}ms`,
                      }}
                    >
                      <div className="drone-ground-shadow" />
                      <div
                        className="drone-body-3d"
                        style={{
                          '--robot-heading': `${currentHeading}deg`,
                        }}
                      >
                        <div className="drone-head-arrow" />
                        <span style={{ fontSize: '0.8rem' }}>🤖</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Blocked Path Warning */}
              {!searchResult?.pathFound && (
                <div className="conflict-alert" style={{ marginTop: '1rem', maxWidth: '580px' }}>
                  <div className="conflict-info">
                    <AlertTriangle size={20} color="#f43f5e" />
                    <span>
                      <strong>No Path Exists!</strong> The destination is completely surrounded by obstacles.
                    </span>
                  </div>
                  <button className="btn btn-secondary" onClick={handleRandomizeGrid}>
                    Regenerate
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW MODE 2: DUAL GRID SIDE-BY-SIDE COMPARISON */}
          {/* ============================================================== */}
          {viewMode === 'DUAL_COMPARE' && dualResultA && dualResultB && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                background: '#080b12',
                padding: '1.25rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-medium)',
              }}
            >
              {/* Dual Selector Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                    Heuristic A:
                  </span>
                  <select
                    className="custom-select"
                    style={{ width: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                    value={compareHeuristicA}
                    onChange={(e) => setCompareHeuristicA(e.target.value)}
                  >
                    {Object.values(HEURISTICS).map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: 'var(--accent-emerald)',
                    background: 'rgba(16, 185, 129, 0.1)',
                    padding: '0.35rem 0.85rem',
                    borderRadius: '999px',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                  }}
                >
                  ⚡ Comparison: {dualResultA.nodesExpanded} vs {dualResultB.nodesExpanded} Nodes Expanded (
                  {Math.round(
                    ((Math.max(dualResultA.nodesExpanded, dualResultB.nodesExpanded) -
                      Math.min(dualResultA.nodesExpanded, dualResultB.nodesExpanded)) /
                      Math.max(dualResultA.nodesExpanded, dualResultB.nodesExpanded || 1)) *
                      100
                  )}
                  % difference!)
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent-violet)' }}>
                    Heuristic B:
                  </span>
                  <select
                    className="custom-select"
                    style={{ width: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                    value={compareHeuristicB}
                    onChange={(e) => setCompareHeuristicB(e.target.value)}
                  >
                    {Object.values(HEURISTICS).map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Side-by-side Dual Grids Container */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '1.5rem',
                }}
              >
                {/* Left Side: Grid A */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    background: 'rgba(16, 22, 35, 0.6)',
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <span style={{ fontWeight: 700, color: 'var(--accent-cyan)', fontSize: '0.85rem' }}>
                      {compareHeuristicA}
                    </span>
                    <span className="badge badge-cyan">{dualResultA.nodesExpanded} Explored</span>
                  </div>

                  {/* Grid A Element */}
                  <div
                    style={{
                      width: '280px',
                      height: '280px',
                      display: 'grid',
                      gridTemplateColumns: `repeat(${gridData.width}, 1fr)`,
                      gridTemplateRows: `repeat(${gridData.height}, 1fr)`,
                      gap: '1px',
                      background: '#0b0f1a',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    {Array.from({ length: gridData.height }).map((_, y) =>
                      Array.from({ length: gridData.width }).map((_, x) => {
                        const key = `${x},${y}`;
                        const isObs = gridData.obstacles.has(key);
                        const isStart = gridData.start.x === x && gridData.start.y === y;
                        const isGoal = gridData.goal.x === x && gridData.goal.y === y;
                        const isVisited = dualResultA.closedSet.has(key);
                        const isPath = dualResultA.path.some((p) => p.x === x && p.y === y);

                        let bg = '#111726';
                        if (isObs) bg = '#253046';
                        else if (isStart) bg = '#10b981';
                        else if (isGoal) bg = '#f59e0b';
                        else if (isPath) bg = 'rgba(16, 185, 129, 0.6)';
                        else if (isVisited) bg = 'rgba(6, 182, 212, 0.35)';

                        return (
                          <div
                            key={key}
                            style={{
                              background: bg,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.65rem',
                            }}
                          >
                            {isStart && '🟢'}
                            {isGoal && '🎯'}
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Path: {dualResultA.pathCost} steps • Explored: {dualResultA.nodesExpanded} nodes • Time: {dualResultA.executionTimeMs}ms
                  </div>
                </div>

                {/* Right Side: Grid B */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    background: 'rgba(16, 22, 35, 0.6)',
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <span style={{ fontWeight: 700, color: 'var(--accent-violet)', fontSize: '0.85rem' }}>
                      {compareHeuristicB}
                    </span>
                    <span className="badge badge-violet">{dualResultB.nodesExpanded} Explored</span>
                  </div>

                  {/* Grid B Element */}
                  <div
                    style={{
                      width: '280px',
                      height: '280px',
                      display: 'grid',
                      gridTemplateColumns: `repeat(${gridData.width}, 1fr)`,
                      gridTemplateRows: `repeat(${gridData.height}, 1fr)`,
                      gap: '1px',
                      background: '#0b0f1a',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    {Array.from({ length: gridData.height }).map((_, y) =>
                      Array.from({ length: gridData.width }).map((_, x) => {
                        const key = `${x},${y}`;
                        const isObs = gridData.obstacles.has(key);
                        const isStart = gridData.start.x === x && gridData.start.y === y;
                        const isGoal = gridData.goal.x === x && gridData.goal.y === y;
                        const isVisited = dualResultB.closedSet.has(key);
                        const isPath = dualResultB.path.some((p) => p.x === x && p.y === y);

                        let bg = '#111726';
                        if (isObs) bg = '#253046';
                        else if (isStart) bg = '#10b981';
                        else if (isGoal) bg = '#f59e0b';
                        else if (isPath) bg = 'rgba(16, 185, 129, 0.6)';
                        else if (isVisited) bg = 'rgba(139, 92, 246, 0.35)';

                        return (
                          <div
                            key={key}
                            style={{
                              background: bg,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.65rem',
                            }}
                          >
                            {isStart && '🟢'}
                            {isGoal && '🎯'}
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Path: {dualResultB.pathCost} steps • Explored: {dualResultB.nodesExpanded} nodes • Time: {dualResultB.executionTimeMs}ms
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Heuristic Vector & Angle Inspector + Node Details */}
          <div className="vector-inspector-card">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '0.65rem',
                marginBottom: '0.75rem',
              }}
            >
              <span
                style={{
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Compass size={18} color="var(--accent-cyan)" />
                Heuristic Telemetry & Node Evaluation Inspector (Hover Any Cell)
              </span>
              <span className="badge badge-cyan">
                Active Heuristic: {selectedHeuristic}
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '0.75rem',
                fontSize: '0.78rem',
              }}
            >
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '6px' }}>
                <div style={{ color: 'var(--text-muted)' }}>Target / Hovered Cell</div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  ({hoveredCell ? hoveredCell.x : currentRobotPos.x},{' '}
                  {hoveredCell ? hoveredCell.y : currentRobotPos.y})
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '6px' }}>
                <div style={{ color: 'var(--text-muted)' }}>Search Evaluation</div>
                <div style={{ fontWeight: 700, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
                  {hoveredNodeDetails ? (
                    `Step #${hoveredNodeDetails.step} of ${searchResult?.nodesExpanded}`
                  ) : (
                    'Not Explored'
                  )}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '6px' }}>
                <div style={{ color: 'var(--text-muted)' }}>f = g + h Score</div>
                <div style={{ fontWeight: 700, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                  {hoveredNodeDetails ? (
                    `f=${hoveredNodeDetails.f} (g=${hoveredNodeDetails.g}, h=${hoveredNodeDetails.h})`
                  ) : (
                    `h=${calculateHeuristic(selectedHeuristic, (hoveredCell || currentRobotPos).x, (hoveredCell || currentRobotPos).y, gridData.goal.x, gridData.goal.y, weight).toFixed(1)}`
                  )}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '6px' }}>
                <div style={{ color: 'var(--text-muted)' }}>Vector Angle (θ)</div>
                <div
                  style={{
                    fontWeight: 700,
                    color: 'var(--accent-emerald)',
                    fontFamily: 'var(--font-mono)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <Navigation
                    size={14}
                    style={{
                      transform: `rotate(${vectorTelemetry.angleDeg}deg)`,
                      transition: 'transform 0.2s ease',
                    }}
                  />
                  <span>{vectorTelemetry.angleDeg}°</span>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '6px' }}>
                <div style={{ color: 'var(--text-muted)' }}>Euclidean (L2)</div>
                <div style={{ fontWeight: 700, color: '#3b82f6', fontFamily: 'var(--font-mono)' }}>
                  {vectorTelemetry.euclidean}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '6px' }}>
                <div style={{ color: 'var(--text-muted)' }}>Manhattan (L1)</div>
                <div style={{ fontWeight: 700, color: '#06b6d4', fontFamily: 'var(--font-mono)' }}>
                  {vectorTelemetry.manhattan}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.65rem' }}>
              💡 <strong>Geometric Logic:</strong> Hover any tile above to inspect its exact A* evaluation: $g$ (cost from start), $h$ (heuristic to goal), and $f = g + h$ (priority in min-heap).
            </div>
          </div>

          {/* Mathematical Heuristic Calculation & Proof Verification Engine */}
          <MathProofCard
            heuristic={selectedHeuristic}
            start={gridData.start}
            goal={gridData.goal}
            path={searchResult?.path}
            currentRobotStep={robotStep}
            onSelectStep={(step) => {
              setRobotStep(step);
              setAnimMode('ROBOT_TRAVERSAL');
            }}
            weight={weight}
          />

          {/* Interactive Live Benchmark Table (Click Any Row to Immediately Visualize on Grid) */}
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
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <div>
                <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>
                  Live Heuristic Benchmark on Current Grid ({allowDiagonal ? '8-Way Diagonal' : '4-Way Orthogonal'})
                </span>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  👉 Click any row below to instantly load and visualize that heuristic's search tree on the grid!
                </p>
              </div>
              <span className="badge badge-emerald">Interactive Inspector</span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                    <th style={{ textAlign: 'left', padding: '0.55rem' }}>Heuristic Function</th>
                    <th style={{ textAlign: 'center', padding: '0.55rem' }}>Nodes Expanded</th>
                    <th style={{ textAlign: 'center', padding: '0.55rem' }}>Nodes Visited</th>
                    <th style={{ textAlign: 'center', padding: '0.55rem' }}>Path Cost</th>
                    <th style={{ textAlign: 'center', padding: '0.55rem' }}>Peak Open</th>
                    <th style={{ textAlign: 'center', padding: '0.55rem' }}>Time (ms)</th>
                    <th style={{ textAlign: 'center', padding: '0.55rem' }}>Speedup vs Dijkstra</th>
                    <th style={{ textAlign: 'center', padding: '0.55rem' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((row) => {
                    const isSelected = row.heuristic === selectedHeuristic;
                    const dijkstraExpanded =
                      comparisonData.find((d) => d.heuristic === HEURISTICS.DIJKSTRA)?.nodesExpanded || 1;
                    const speedupPct = Math.round(
                      ((dijkstraExpanded - row.nodesExpanded) / dijkstraExpanded) * 100
                    );

                    return (
                      <tr
                        key={row.heuristic}
                        onClick={() => setSelectedHeuristic(row.heuristic)}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                          background: isSelected ? 'rgba(6, 182, 212, 0.12)' : 'transparent',
                          fontWeight: isSelected ? 700 : 400,
                          cursor: 'pointer',
                          transition: 'background 0.15s ease',
                        }}
                      >
                        <td style={{ padding: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          {isSelected && <ChevronRight size={14} color="var(--accent-cyan)" />}
                          <span>{row.heuristic}</span>
                        </td>
                        <td
                          style={{
                            textAlign: 'center',
                            padding: '0.6rem',
                            color: 'var(--accent-cyan)',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          {row.nodesExpanded}
                        </td>
                        <td style={{ textAlign: 'center', padding: '0.6rem', fontFamily: 'var(--font-mono)' }}>
                          {row.nodesVisited}
                        </td>
                        <td
                          style={{
                            textAlign: 'center',
                            padding: '0.6rem',
                            color: 'var(--accent-emerald)',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          {row.cost}
                        </td>
                        <td style={{ textAlign: 'center', padding: '0.6rem', fontFamily: 'var(--font-mono)' }}>
                          {row.peakOpen}
                        </td>
                        <td style={{ textAlign: 'center', padding: '0.6rem', fontFamily: 'var(--font-mono)' }}>
                          {row.timeMs}
                        </td>
                        <td style={{ textAlign: 'center', padding: '0.6rem' }}>
                          <span
                            className={`badge ${
                              speedupPct > 0 ? 'badge-emerald' : speedupPct === 0 ? 'badge-amber' : 'badge-rose'
                            }`}
                          >
                            {speedupPct > 0 ? `-${speedupPct}% Expansions` : 'Baseline'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', padding: '0.6rem' }}>
                          <button
                            className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ fontSize: '0.7rem', padding: '0.2rem 0.55rem' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedHeuristic(row.heuristic);
                            }}
                          >
                            {isSelected ? 'Active' : 'Inspect'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
