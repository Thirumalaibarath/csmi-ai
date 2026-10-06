import { calculateHeuristic, HEURISTICS } from './heuristics';
import { PriorityQueue } from '../utils/PriorityQueue';

/**
 * 4-directional orthogonal neighbors: Up, Right, Down, Left
 */
export const DIRECTIONS_4 = [
  { dx: 0, dy: -1, cost: 1, name: 'UP' },
  { dx: 1, dy: 0, cost: 1, name: 'RIGHT' },
  { dx: 0, dy: 1, cost: 1, name: 'DOWN' },
  { dx: -1, dy: 0, cost: 1, name: 'LEFT' },
];

export const DIRECTIONS_8 = [
  { dx: 0, dy: -1, cost: 1, name: 'UP' },
  { dx: 1, dy: 0, cost: 1, name: 'RIGHT' },
  { dx: 0, dy: 1, cost: 1, name: 'DOWN' },
  { dx: -1, dy: 0, cost: 1, name: 'LEFT' },
  { dx: 1, dy: -1, cost: 1.414, name: 'UP_RIGHT' },
  { dx: 1, dy: 1, cost: 1.414, name: 'DOWN_RIGHT' },
  { dx: -1, dy: 1, cost: 1.414, name: 'DOWN_LEFT' },
  { dx: -1, dy: -1, cost: 1.414, name: 'UP_LEFT' },
];

/**
 * Single-Agent A* Pathfinding Algorithm
 *
 * @param {Object} options
 * @param {number} options.width Grid width (cols)
 * @param {number} options.height Grid height (rows)
 * @param {Set<string>|Array<Array<boolean>>} options.obstacles Obstacle lookup
 * @param {Object} options.start {x, y}
 * @param {Object} options.goal {x, y}
 * @param {string} options.heuristic One of HEURISTICS keys or strings
 * @param {number} [options.weight=1.5] Optional weight for weighted heuristics
 * @param {boolean} [options.allowDiagonal=false] Whether 8-directional movement is permitted
 * @param {boolean} [options.recordHistory=true] Whether to record visited order for animation
 * @returns {Object} Search result and comprehensive metrics
 */
export function runSingleAStar({
  width,
  height,
  obstacles,
  start,
  goal,
  heuristic = HEURISTICS.MANHATTAN,
  weight = 1.5,
  allowDiagonal = false,
  recordHistory = true,
}) {
  const startTime = performance.now();

  const isObstacle = (x, y) => {
    if (obstacles instanceof Set) {
      return obstacles.has(`${x},${y}`);
    }
    if (Array.isArray(obstacles)) {
      return !!obstacles[y]?.[x];
    }
    return false;
  };

  const isInBounds = (x, y) => x >= 0 && x < width && y >= 0 && y < height;

  const startKey = `${start.x},${start.y}`;
  const goalKey = `${goal.x},${goal.y}`;

  // If start is goal, trivial return
  if (start.x === goal.x && start.y === goal.y) {
    return {
      pathFound: true,
      path: [{ x: start.x, y: start.y }],
      pathCost: 0,
      pathLength: 1,
      nodesExpanded: 0,
      nodesVisited: 1,
      peakOpenSetSize: 1,
      executionTimeMs: performance.now() - startTime,
      visitedOrder: [{ x: start.x, y: start.y, g: 0, h: 0, f: 0 }],
      heuristic,
      closedSet: new Set([startKey]),
      openSetRemaining: [],
    };
  }

  // Priority queue ordered by fScore, ties broken by smaller hScore
  const openQueue = new PriorityQueue((a, b) => {
    if (Math.abs(a.f - b.f) < 1e-9) {
      return a.h - b.h; // tie-breaker: closer to goal
    }
    return a.f - b.f;
  });

  const gScore = new Map();
  const parentMap = new Map();
  const closedSet = new Set();
  const inOpenMap = new Map(); // key -> current f

  const startH = calculateHeuristic(heuristic, start.x, start.y, goal.x, goal.y, weight);
  gScore.set(startKey, 0);

  const startNode = {
    x: start.x,
    y: start.y,
    g: 0,
    h: startH,
    f: startH,
  };

  openQueue.push(startNode);
  inOpenMap.set(startKey, startH);

  let peakOpenSetSize = 1;
  let nodesExpanded = 0;
  let nodesVisited = 1;
  const visitedOrder = [];
  let pathFound = false;
  let goalNode = null;

  while (!openQueue.isEmpty()) {
    if (openQueue.size() > peakOpenSetSize) {
      peakOpenSetSize = openQueue.size();
    }

    const current = openQueue.pop();
    const currentKey = `${current.x},${current.y}`;

    // Stale node in priority queue (gScore was improved after pushing)
    if (current.g > (gScore.get(currentKey) ?? Infinity)) {
      continue;
    }

    inOpenMap.delete(currentKey);

    if (closedSet.has(currentKey)) {
      continue;
    }
    closedSet.add(currentKey);
    nodesExpanded++;

    if (recordHistory) {
      visitedOrder.push({
        x: current.x,
        y: current.y,
        g: current.g,
        h: current.h,
        f: current.f,
      });
    }

    // Check goal
    if (current.x === goal.x && current.y === goal.y) {
      pathFound = true;
      goalNode = current;
      break;
    }

    // Expand neighbors (4-way or 8-way)
    const directions = allowDiagonal ? DIRECTIONS_8 : DIRECTIONS_4;

    for (const dir of directions) {
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;
      const nKey = `${nx},${ny}`;

      if (!isInBounds(nx, ny) || isObstacle(nx, ny) || closedSet.has(nKey)) {
        continue;
      }

      // Corner-cutting prevention for diagonal steps
      if (dir.dx !== 0 && dir.dy !== 0) {
        if (isObstacle(current.x + dir.dx, current.y) && isObstacle(current.x, current.y + dir.dy)) {
          continue;
        }
      }

      const stepCost = dir.cost || 1;
      const tentativeG = current.g + stepCost;
      const existingG = gScore.get(nKey) ?? Infinity;

      if (tentativeG < existingG) {
        gScore.set(nKey, tentativeG);
        parentMap.set(nKey, { x: current.x, y: current.y });

        const h = calculateHeuristic(heuristic, nx, ny, goal.x, goal.y, weight);
        const f = tentativeG + h;
        const neighborNode = { x: nx, y: ny, g: tentativeG, h, f };

        if (!inOpenMap.has(nKey)) {
          nodesVisited++;
        }
        inOpenMap.set(nKey, f);
        openQueue.push(neighborNode);
      }
    }
  }

  const endTime = performance.now();
  const executionTimeMs = Number((endTime - startTime).toFixed(3));

  // Reconstruct path
  const path = [];
  if (pathFound && goalNode) {
    let curr = { x: goal.x, y: goal.y };
    path.push(curr);
    while (parentMap.has(`${curr.x},${curr.y}`)) {
      curr = parentMap.get(`${curr.x},${curr.y}`);
      path.push(curr);
    }
    path.reverse();
  }

  const pathCost = pathFound ? path.length - 1 : 0;
  const pathLength = path.length;

  // Approximate Effective Branching Factor b* : N = (b*^(d+1) - 1) / (b* - 1)
  let effectiveBranchingFactor = 1.0;
  if (pathCost > 0 && nodesExpanded > 1) {
    effectiveBranchingFactor = Number(
      Math.pow(nodesExpanded, 1 / pathCost).toFixed(2)
    );
  }

  return {
    pathFound,
    path,
    pathCost,
    pathLength,
    nodesExpanded,
    nodesVisited,
    peakOpenSetSize,
    executionTimeMs,
    visitedOrder,
    heuristic,
    closedSet,
    openSetRemaining: Array.from(inOpenMap.keys()).map((k) => {
      const [x, y] = k.split(',').map(Number);
      return { x, y };
    }),
    effectiveBranchingFactor,
  };
}
