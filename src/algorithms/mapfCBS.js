import { PriorityQueue } from '../utils/PriorityQueue';
import { runSpaceTimeAStar } from './spaceTimeAStar';
import { detectCollisions } from './mapfPlainAStar';

/**
 * Finds the first spatio-temporal conflict between any two agents
 */
export function findFirstConflict(trajectories) {
  const numAgents = trajectories.length;
  if (numAgents <= 1) return null;

  const maxTime = Math.max(...trajectories.map((t) => t.length));

  // Pad trajectories with stationary positions at goals
  const padded = trajectories.map((traj) => {
    if (traj.length === 0) return [];
    const p = [...traj];
    const last = traj[traj.length - 1];
    while (p.length < maxTime) {
      p.push({ ...last });
    }
    return p;
  });

  for (let t = 0; t < maxTime; t++) {
    // 1. Vertex Conflict Check
    for (let i = 0; i < numAgents; i++) {
      const posI = padded[i][t];
      if (!posI) continue;

      for (let j = i + 1; j < numAgents; j++) {
        const posJ = padded[j][t];
        if (!posJ) continue;

        if (posI.x === posJ.x && posI.y === posJ.y) {
          return {
            type: 'VERTEX',
            time: t,
            agentA: i,
            agentB: j,
            x: posI.x,
            y: posI.y,
          };
        }
      }
    }

    // 2. Edge / Swap Conflict Check
    if (t < maxTime - 1) {
      for (let i = 0; i < numAgents; i++) {
        const currI = padded[i][t];
        const nextI = padded[i][t + 1];
        if (!currI || !nextI) continue;

        for (let j = i + 1; j < numAgents; j++) {
          const currJ = padded[j][t];
          const nextJ = padded[j][t + 1];
          if (!currJ || !nextJ) continue;

          if (
            currI.x === nextJ.x &&
            currI.y === nextJ.y &&
            nextI.x === currJ.x &&
            nextI.y === currJ.y &&
            !(currI.x === nextI.x && currI.y === nextI.y)
          ) {
            return {
              type: 'EDGE',
              time: t,
              agentA: i,
              agentB: j,
              u: { x: currI.x, y: currI.y },
              v: { x: nextI.x, y: nextI.y },
            };
          }
        }
      }
    }
  }

  return null;
}

/**
 * Conflict-Based Search (CBS) - Optimal Multi-Agent Path Finding
 * Sharon et al., AAAI 2012
 */
export function runCBSMapf({
  width,
  height,
  obstacles,
  agents,
  maxHighLevelNodes = 300,
  maxTimeMs = 2500,
  maxTimeHorizon = 150,
}) {
  const startTime = performance.now();

  const staticObstacles =
    obstacles instanceof Set
      ? obstacles
      : new Set(
          obstacles.flatMap((row, y) =>
            row.map((val, x) => (val ? `${x},${y}` : null)).filter(Boolean)
          )
        );

  let highLevelNodesExpanded = 0;
  let totalLowLevelNodes = 0;

  // Root Constraint Tree (CT) node
  const rootPaths = [];
  const rootVertexConstraints = Array.from({ length: agents.length }, () => new Set());
  const rootEdgeConstraints = Array.from({ length: agents.length }, () => new Set());

  for (let i = 0; i < agents.length; i++) {
    const res = runSpaceTimeAStar({
      width,
      height,
      staticObstacles,
      start: agents[i].start,
      goal: agents[i].goal,
      maxTimeHorizon,
    });
    totalLowLevelNodes += res.nodesExpanded;

    if (!res.found || !res.path) {
      return {
        method: 'Conflict-Based Search (CBS)',
        success: false,
        allPathsFound: false,
        agents: [],
        trajectories: [],
        collisions: [],
        collisionCount: 0,
        totalCost: 0,
        makespan: 0,
        totalNodesExpanded: totalLowLevelNodes,
        highLevelNodesExpanded: 0,
        executionTimeMs: Number((performance.now() - startTime).toFixed(3)),
        statusMessage: `Initial path not found for Agent ${i + 1}`,
      };
    }

    rootPaths.push(res.path.map((p) => ({ x: p.x, y: p.y })));
  }

  const rootCost = rootPaths.reduce((sum, p) => sum + (p.length - 1), 0);

  // High-level open queue ordered by cost
  const openCT = new PriorityQueue((a, b) => a.cost - b.cost);

  openCT.push({
    paths: rootPaths,
    cost: rootCost,
    vertexConstraints: rootVertexConstraints,
    edgeConstraints: rootEdgeConstraints,
    id: 0,
  });

  let ctNodeCounter = 1;
  let bestSolution = null;

  while (!openCT.isEmpty()) {
    // Check timeout
    if (performance.now() - startTime > maxTimeMs) {
      break;
    }
    if (highLevelNodesExpanded >= maxHighLevelNodes) {
      break;
    }

    const currentCT = openCT.pop();
    highLevelNodesExpanded++;

    const conflict = findFirstConflict(currentCT.paths);

    // If no conflict, we found the optimal solution!
    if (!conflict) {
      bestSolution = currentCT;
      break;
    }

    // Branch on conflict for both agentA and agentB
    const conflictedAgents = [
      { agentIndex: conflict.agentA, otherAgent: conflict.agentB, isA: true },
      { agentIndex: conflict.agentB, otherAgent: conflict.agentA, isA: false },
    ];

    for (const { agentIndex, isA } of conflictedAgents) {
      // Clone constraints
      const newVConstraints = currentCT.vertexConstraints.map((s) => new Set(s));
      const newEConstraints = currentCT.edgeConstraints.map((s) => new Set(s));

      if (conflict.type === 'VERTEX') {
        newVConstraints[agentIndex].add(`${conflict.x},${conflict.y},${conflict.time}`);
      } else {
        // EDGE conflict
        if (isA) {
          newEConstraints[agentIndex].add(
            `${conflict.u.x},${conflict.u.y}->${conflict.v.x},${conflict.v.y},${conflict.time}`
          );
        } else {
          newEConstraints[agentIndex].add(
            `${conflict.v.x},${conflict.v.y}->${conflict.u.x},${conflict.u.y},${conflict.time}`
          );
        }
      }

      // Replan for only this agent
      const replanResult = runSpaceTimeAStar({
        width,
        height,
        staticObstacles,
        start: agents[agentIndex].start,
        goal: agents[agentIndex].goal,
        vertexConstraints: newVConstraints[agentIndex],
        edgeConstraints: newEConstraints[agentIndex],
        maxTimeHorizon,
      });

      totalLowLevelNodes += replanResult.nodesExpanded;

      if (replanResult.found && replanResult.path) {
        const newPaths = [...currentCT.paths];
        newPaths[agentIndex] = replanResult.path.map((p) => ({ x: p.x, y: p.y }));

        const newCost = newPaths.reduce((sum, p) => sum + (p.length - 1), 0);

        openCT.push({
          paths: newPaths,
          cost: newCost,
          vertexConstraints: newVConstraints,
          edgeConstraints: newEConstraints,
          id: ctNodeCounter++,
        });
      }
    }
  }

  const executionTimeMs = Number((performance.now() - startTime).toFixed(3));

  if (bestSolution) {
    const plannedPaths = bestSolution.paths;
    const collisions = detectCollisions(plannedPaths);
    const makespan = Math.max(...plannedPaths.map((p) => p.length - 1));

    const agentMetrics = agents.map((agent, i) => ({
      agentId: agent.id,
      path: plannedPaths[i],
      pathCost: plannedPaths[i].length - 1,
      pathFound: true,
      constraintsCount:
        bestSolution.vertexConstraints[i].size + bestSolution.edgeConstraints[i].size,
    }));

    return {
      method: 'Conflict-Based Search (CBS)',
      success: true,
      allPathsFound: true,
      agents: agentMetrics,
      trajectories: plannedPaths,
      collisions,
      collisionCount: 0,
      totalCost: bestSolution.cost,
      makespan,
      totalNodesExpanded: totalLowLevelNodes,
      highLevelNodesExpanded,
      executionTimeMs,
      optimal: true,
      statusMessage: `Optimal conflict-free solution found in ${highLevelNodesExpanded} high-level expansions`,
    };
  }

  // Fallback: If CBS exceeded limits (due to high density/tight grid), return message and fallback to Prioritized
  return {
    method: 'Conflict-Based Search (CBS)',
    success: false,
    allPathsFound: false,
    agents: [],
    trajectories: [],
    collisions: [],
    collisionCount: 0,
    totalCost: 0,
    makespan: 0,
    totalNodesExpanded: totalLowLevelNodes,
    highLevelNodesExpanded,
    executionTimeMs,
    optimal: false,
    statusMessage: `CBS timed out (${highLevelNodesExpanded} CT nodes). Switch to Prioritized Space-Time A* for guaranteed fast convergence on complex configurations.`,
  };
}
