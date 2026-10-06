import { runSingleAStar } from './singleAStar';
import { HEURISTICS } from './heuristics';
import { generateRandomGrid } from '../utils/gridGenerator';
import { runPlainMapfAStar } from './mapfPlainAStar';
import { runPrioritizedMapf } from './mapfPrioritized';
import { runCBSMapf } from './mapfCBS';

/**
 * Computes mean, standard deviation, min, and max for an array of numbers
 */
function computeStats(arr) {
  if (!arr || arr.length === 0) return { mean: 0, std: 0, min: 0, max: 0 };
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance =
    arr.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (arr.length || 1);
  return {
    mean: Number(mean.toFixed(2)),
    std: Number(Math.sqrt(variance).toFixed(2)),
    min: Number(Math.min(...arr).toFixed(2)),
    max: Number(Math.max(...arr).toFixed(2)),
  };
}

/**
 * Run Single-Agent Benchmark across all heuristics on N randomized grids
 */
export function runSingleAgentBenchmark({
  numTrials = 30,
  width = 16,
  height = 16,
  obstacleDensity = 0.2,
  onProgress = null,
}) {
  const heuristicsList = [
    HEURISTICS.MANHATTAN,
    HEURISTICS.EUCLIDEAN,
    HEURISTICS.CHEBYSHEV,
    HEURISTICS.OCTILE,
    HEURISTICS.WEIGHTED_MANHATTAN,
    HEURISTICS.DIJKSTRA,
  ];

  // Prepare result store
  const resultsByHeuristic = {};
  for (const h of heuristicsList) {
    resultsByHeuristic[h] = {
      heuristic: h,
      nodesExpanded: [],
      nodesVisited: [],
      pathCost: [],
      peakOpenSet: [],
      executionTimeMs: [],
      branchingFactor: [],
    };
  }

  for (let trial = 0; trial < numTrials; trial++) {
    // Generate one shared random grid for fair apples-to-apples comparison across all heuristics
    const grid = generateRandomGrid({
      width,
      height,
      obstacleDensity,
      numAgents: 1,
    });

    for (const h of heuristicsList) {
      const res = runSingleAStar({
        width,
        height,
        obstacles: grid.obstacles,
        start: grid.start,
        goal: grid.goal,
        heuristic: h,
        recordHistory: false,
      });

      if (res.pathFound) {
        resultsByHeuristic[h].nodesExpanded.push(res.nodesExpanded);
        resultsByHeuristic[h].nodesVisited.push(res.nodesVisited);
        resultsByHeuristic[h].pathCost.push(res.pathCost);
        resultsByHeuristic[h].peakOpenSet.push(res.peakOpenSetSize);
        resultsByHeuristic[h].executionTimeMs.push(res.executionTimeMs);
        resultsByHeuristic[h].branchingFactor.push(res.effectiveBranchingFactor);
      }
    }

    if (onProgress) {
      onProgress(Math.round(((trial + 1) / numTrials) * 100));
    }
  }

  // Aggregate statistics
  const summary = heuristicsList.map((h) => {
    const data = resultsByHeuristic[h];
    return {
      heuristic: h,
      trialsCount: data.nodesExpanded.length,
      nodesExpanded: computeStats(data.nodesExpanded),
      nodesVisited: computeStats(data.nodesVisited),
      pathCost: computeStats(data.pathCost),
      peakOpenSet: computeStats(data.peakOpenSet),
      executionTimeMs: computeStats(data.executionTimeMs),
      branchingFactor: computeStats(data.branchingFactor),
    };
  });

  return {
    trials: numTrials,
    gridSize: `${width}x${height}`,
    obstacleDensity: `${Math.round(obstacleDensity * 100)}%`,
    summary,
  };
}

/**
 * Run Multi-Agent Benchmark comparing Plain A* vs Prioritized vs CBS
 */
export function runMultiAgentBenchmark({
  numTrials = 15,
  width = 14,
  height = 14,
  obstacleDensity = 0.2,
  numAgents = 4,
  onProgress = null,
}) {
  const methods = ['Plain A* (Independent)', 'Prioritized Space-Time A*', 'Conflict-Based Search (CBS)'];

  const rawData = {
    'Plain A* (Independent)': { collisions: [], success: [], makespan: [], cost: [], timeMs: [] },
    'Prioritized Space-Time A*': { collisions: [], success: [], makespan: [], cost: [], timeMs: [] },
    'Conflict-Based Search (CBS)': { collisions: [], success: [], makespan: [], cost: [], timeMs: [] },
  };

  for (let trial = 0; trial < numTrials; trial++) {
    const grid = generateRandomGrid({
      width,
      height,
      obstacleDensity,
      numAgents,
    });

    // 1. Plain A*
    const plainRes = runPlainMapfAStar({
      width,
      height,
      obstacles: grid.obstacles,
      agents: grid.agents,
    });
    rawData['Plain A* (Independent)'].collisions.push(plainRes.collisionCount);
    rawData['Plain A* (Independent)'].success.push(plainRes.success ? 100 : 0);
    rawData['Plain A* (Independent)'].makespan.push(plainRes.makespan);
    rawData['Plain A* (Independent)'].cost.push(plainRes.totalCost);
    rawData['Plain A* (Independent)'].timeMs.push(plainRes.executionTimeMs);

    // 2. Prioritized Space-Time A*
    const prioRes = runPrioritizedMapf({
      width,
      height,
      obstacles: grid.obstacles,
      agents: grid.agents,
      priorityStrategy: 'LONGEST_FIRST',
    });
    rawData['Prioritized Space-Time A*'].collisions.push(prioRes.collisionCount);
    rawData['Prioritized Space-Time A*'].success.push(prioRes.success ? 100 : 0);
    rawData['Prioritized Space-Time A*'].makespan.push(prioRes.makespan);
    rawData['Prioritized Space-Time A*'].cost.push(prioRes.totalCost);
    rawData['Prioritized Space-Time A*'].timeMs.push(prioRes.executionTimeMs);

    // 3. CBS (with bounded limit)
    const cbsRes = runCBSMapf({
      width,
      height,
      obstacles: grid.obstacles,
      agents: grid.agents,
      maxHighLevelNodes: 200,
      maxTimeMs: 1500,
    });
    rawData['Conflict-Based Search (CBS)'].collisions.push(cbsRes.collisionCount);
    rawData['Conflict-Based Search (CBS)'].success.push(cbsRes.success ? 100 : 0);
    rawData['Conflict-Based Search (CBS)'].makespan.push(cbsRes.makespan);
    rawData['Conflict-Based Search (CBS)'].cost.push(cbsRes.totalCost);
    rawData['Conflict-Based Search (CBS)'].timeMs.push(cbsRes.executionTimeMs);

    if (onProgress) {
      onProgress(Math.round(((trial + 1) / numTrials) * 100));
    }
  }

  const summary = methods.map((m) => {
    const d = rawData[m];
    return {
      method: m,
      trialsCount: numTrials,
      collisions: computeStats(d.collisions),
      successRatePct: Number((d.success.reduce((a, b) => a + b, 0) / numTrials).toFixed(1)),
      makespan: computeStats(d.makespan),
      totalCost: computeStats(d.cost),
      executionTimeMs: computeStats(d.timeMs),
    };
  });

  return {
    trials: numTrials,
    gridSize: `${width}x${height}`,
    numAgents,
    obstacleDensity: `${Math.round(obstacleDensity * 100)}%`,
    summary,
  };
}
