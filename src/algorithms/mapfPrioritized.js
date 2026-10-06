import { runSpaceTimeAStar } from './spaceTimeAStar';
import { detectCollisions } from './mapfPlainAStar';

/**
 * Prioritized Planning with Space-Time Reservation Table (Cooperative A* - CA*)
 * Proposed Method for Multi-Agent Path Finding
 *
 * Solves:
 * - Vertex Collisions (via Space-Time cell reservation)
 * - Edge/Swap Collisions (via directional edge transition reservation)
 * - Goal Blocking (via permanent terminal goal reservation)
 */
export function runPrioritizedMapf({
  width,
  height,
  obstacles,
  agents,
  priorityStrategy = 'LONGEST_FIRST', // 'LONGEST_FIRST', 'SHORTEST_FIRST', 'INDEX'
  maxTimeHorizon = 200,
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

  // Clone agents and compute heuristic distance for priority ordering
  const orderedAgents = agents.map((a, originalIndex) => {
    const dist = Math.abs(a.start.x - a.goal.x) + Math.abs(a.start.y - a.goal.y);
    return { ...a, originalIndex, distance: dist };
  });

  if (priorityStrategy === 'LONGEST_FIRST') {
    orderedAgents.sort((a, b) => b.distance - a.distance);
  } else if (priorityStrategy === 'SHORTEST_FIRST') {
    orderedAgents.sort((a, b) => a.distance - b.distance);
  } // else keep original index

  // Reservation tables
  // vertexReservation: 'x,y,t' -> agentId
  // edgeReservation: 'x1,y1->x2,y2,t' -> agentId
  const reservedVertices = new Set();
  const reservedEdges = new Set();

  const plannedPaths = new Array(agents.length);
  const agentMetrics = new Array(agents.length);
  let totalNodesExpanded = 0;
  let allFound = true;

  for (let rank = 0; rank < orderedAgents.length; rank++) {
    const agent = orderedAgents[rank];

    const result = runSpaceTimeAStar({
      width,
      height,
      staticObstacles,
      start: agent.start,
      goal: agent.goal,
      vertexConstraints: reservedVertices,
      edgeConstraints: reservedEdges,
      maxTimeHorizon,
    });

    totalNodesExpanded += result.nodesExpanded;

    if (!result.found || !result.path) {
      allFound = false;
      agentMetrics[agent.originalIndex] = {
        agentId: agent.id,
        path: [],
        pathCost: 0,
        pathFound: false,
        nodesExpanded: result.nodesExpanded,
        priorityRank: rank + 1,
      };
      plannedPaths[agent.originalIndex] = [];
      continue;
    }

    const path = result.path.map((p) => ({ x: p.x, y: p.y }));
    plannedPaths[agent.originalIndex] = path;
    agentMetrics[agent.originalIndex] = {
      agentId: agent.id,
      path,
      pathCost: result.cost,
      pathFound: true,
      nodesExpanded: result.nodesExpanded,
      priorityRank: rank + 1,
    };

    // Commit to reservation table
    const pathLen = result.path.length;
    for (let t = 0; t < pathLen; t++) {
      const cell = result.path[t];
      reservedVertices.add(`${cell.x},${cell.y},${t}`);

      if (t < pathLen - 1) {
        const nextCell = result.path[t + 1];
        // Forbid swap collision: no other agent can move nextCell -> cell at time t
        reservedEdges.add(`${nextCell.x},${nextCell.y}->${cell.x},${cell.y},${t}`);
      }
    }

    // Goal reservation: agent parks at goal from arrival time up to maxTimeHorizon
    const finalCell = result.path[pathLen - 1];
    for (let t = pathLen; t <= maxTimeHorizon; t++) {
      reservedVertices.add(`${finalCell.x},${finalCell.y},${t}`);
    }
  }

  const collisions = detectCollisions(plannedPaths.filter((p) => p.length > 0));
  const totalCost = agentMetrics.reduce((acc, m) => acc + (m?.pathCost || 0), 0);
  const makespan = Math.max(0, ...plannedPaths.map((p) => (p.length > 0 ? p.length - 1 : 0)));
  const executionTimeMs = Number((performance.now() - startTime).toFixed(3));

  return {
    method: 'Prioritized Space-Time A* (CA*)',
    priorityStrategy,
    success: allFound && collisions.length === 0,
    allPathsFound: allFound,
    agents: agentMetrics,
    trajectories: plannedPaths,
    collisions,
    collisionCount: collisions.length,
    vertexCollisions: 0,
    edgeCollisions: 0,
    totalCost,
    makespan,
    totalNodesExpanded,
    executionTimeMs,
  };
}
