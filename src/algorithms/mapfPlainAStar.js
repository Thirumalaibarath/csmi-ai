import { runSingleAStar } from './singleAStar';
import { HEURISTICS } from './heuristics';

/**
 * Detect all collisions across robot trajectories
 * Trajectories: array of paths, where paths[i][t] = { x, y }
 *
 * Checks for:
 * 1. Vertex collision: paths[i][t] === paths[j][t]
 * 2. Edge/Swap collision: paths[i][t] === paths[j][t+1] && paths[i][t+1] === paths[j][t]
 */
export function detectCollisions(trajectories) {
  const collisions = [];
  const numAgents = trajectories.length;
  if (numAgents <= 1) return collisions;

  // Determine max timesteps
  const maxTime = Math.max(...trajectories.map((t) => t.length));

  // Extend trajectories so that agents that reach goal earlier stay at their goal
  const paddedTrajectories = trajectories.map((traj) => {
    if (traj.length === 0) return [];
    const padded = [...traj];
    const lastCell = traj[traj.length - 1];
    while (padded.length < maxTime) {
      padded.push({ ...lastCell });
    }
    return padded;
  });

  for (let t = 0; t < maxTime; t++) {
    // 1. Check Vertex Collisions at time t
    for (let i = 0; i < numAgents; i++) {
      const posI = paddedTrajectories[i][t];
      if (!posI) continue;

      for (let j = i + 1; j < numAgents; j++) {
        const posJ = paddedTrajectories[j][t];
        if (!posJ) continue;

        if (posI.x === posJ.x && posI.y === posJ.y) {
          collisions.push({
            type: 'VERTEX',
            time: t,
            agentA: i,
            agentB: j,
            cell: { x: posI.x, y: posI.y },
            description: `Agents ${i + 1} and ${j + 1} occupy cell (${posI.x}, ${posI.y}) simultaneously at timestep t=${t}`,
          });
        }
      }
    }

    // 2. Check Edge / Swap Collisions between t and t+1
    if (t < maxTime - 1) {
      for (let i = 0; i < numAgents; i++) {
        const currI = paddedTrajectories[i][t];
        const nextI = paddedTrajectories[i][t + 1];
        if (!currI || !nextI) continue;

        for (let j = i + 1; j < numAgents; j++) {
          const currJ = paddedTrajectories[j][t];
          const nextJ = paddedTrajectories[j][t + 1];
          if (!currJ || !nextJ) continue;

          // Swap collision: i goes currI -> nextI, j goes currJ -> nextJ
          // where currI == nextJ and nextI == currJ
          if (
            currI.x === nextJ.x &&
            currI.y === nextJ.y &&
            nextI.x === currJ.x &&
            nextI.y === currJ.y &&
            !(currI.x === nextI.x && currI.y === nextI.y) // not both stationary
          ) {
            collisions.push({
              type: 'EDGE_SWAP',
              time: t,
              agentA: i,
              agentB: j,
              cellA: { x: currI.x, y: currI.y },
              cellB: { x: currJ.x, y: currJ.y },
              description: `Agents ${i + 1} and ${j + 1} cross each other along edge (${currI.x},${currI.y}) <-> (${currJ.x},${currJ.y}) between t=${t} and t=${t + 1}`,
            });
          }
        }
      }
    }
  }

  return collisions;
}

/**
 * Plain / Independent Multi-Agent A*
 * Plans individual paths independently ignoring other agents.
 * Serves as the naive baseline highlighting multi-agent conflicts.
 */
export function runPlainMapfAStar({
  width,
  height,
  obstacles,
  agents, // [{ id: 0, start: {x, y}, goal: {x, y}, color }]
  heuristic = HEURISTICS.MANHATTAN,
}) {
  const startTime = performance.now();
  const agentResults = [];
  let totalNodesExpanded = 0;
  let allFound = true;

  for (const agent of agents) {
    const res = runSingleAStar({
      width,
      height,
      obstacles,
      start: agent.start,
      goal: agent.goal,
      heuristic,
      recordHistory: false,
    });

    if (!res.pathFound) {
      allFound = false;
    }

    totalNodesExpanded += res.nodesExpanded;
    agentResults.push({
      agentId: agent.id,
      path: res.path,
      pathCost: res.pathCost,
      pathFound: res.pathFound,
      nodesExpanded: res.nodesExpanded,
      executionTimeMs: res.executionTimeMs,
    });
  }

  const rawTrajectories = agentResults.map((r) => r.path);
  const collisions = detectCollisions(rawTrajectories);
  const totalCost = agentResults.reduce((acc, r) => acc + (r.pathCost || 0), 0);
  const makespan = Math.max(0, ...agentResults.map((r) => (r.path ? r.path.length - 1 : 0)));

  const executionTimeMs = Number((performance.now() - startTime).toFixed(3));

  return {
    method: 'Plain Independent A*',
    success: allFound && collisions.length === 0,
    allPathsFound: allFound,
    agents: agentResults,
    trajectories: rawTrajectories,
    collisions,
    collisionCount: collisions.length,
    vertexCollisions: collisions.filter((c) => c.type === 'VERTEX').length,
    edgeCollisions: collisions.filter((c) => c.type === 'EDGE_SWAP').length,
    totalCost,
    makespan,
    totalNodesExpanded,
    executionTimeMs,
  };
}
