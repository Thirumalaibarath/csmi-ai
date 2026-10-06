import { PriorityQueue } from '../utils/PriorityQueue';
import { DIRECTIONS_4 } from './singleAStar';

/**
 * 3D Space-Time A* Search for single agent in dynamic constraint environment.
 * Actions: { UP, DOWN, LEFT, RIGHT, WAIT }
 *
 * @param {Object} options
 * @param {number} options.width Grid width
 * @param {number} options.height Grid height
 * @param {Set<string>} options.staticObstacles Set of 'x,y' strings
 * @param {Object} options.start {x, y}
 * @param {Object} options.goal {x, y}
 * @param {Set<string>} [options.vertexConstraints] Set of 'x,y,t' forbidden vertex states
 * @param {Set<string>} [options.edgeConstraints] Set of 'x1,y1->x2,y2,t' forbidden edge transitions at time t
 * @param {number} [options.earliestGoalTime=0] Minimum time agent must stay at goal
 * @param {number} [options.maxTimeHorizon=150] Max search time horizon to avoid infinite search
 * @returns {Object} { path, cost, nodesExpanded, found }
 */
export function runSpaceTimeAStar({
  width,
  height,
  staticObstacles,
  start,
  goal,
  vertexConstraints = new Set(),
  edgeConstraints = new Set(),
  earliestGoalTime = 0,
  maxTimeHorizon = 200,
}) {
  const isStaticObstacle = (x, y) => staticObstacles.has(`${x},${y}`);
  const isInBounds = (x, y) => x >= 0 && x < width && y >= 0 && y < height;

  const manhattan = (x, y) => Math.abs(x - goal.x) + Math.abs(y - goal.y);

  // Check if start is immediately blocked at t=0
  if (vertexConstraints.has(`${start.x},${start.y},0`)) {
    return { path: null, cost: 0, nodesExpanded: 0, found: false };
  }

  // Priority queue ordered by f, tie-break by smaller h, then larger g
  const openQueue = new PriorityQueue((a, b) => {
    if (Math.abs(a.f - b.f) < 1e-9) {
      return a.h - b.h;
    }
    return a.f - b.f;
  });

  // State key: 'x,y,t'
  const closedSet = new Set();
  const parentMap = new Map();
  const gScore = new Map();

  const startH = manhattan(start.x, start.y);
  const startKey = `${start.x},${start.y},0`;
  gScore.set(startKey, 0);

  openQueue.push({
    x: start.x,
    y: start.y,
    t: 0,
    g: 0,
    h: startH,
    f: startH,
  });

  let nodesExpanded = 0;

  // Find max time of any constraint involving the goal cell to ensure agent doesn't stop too early
  let maxGoalConstraintTime = earliestGoalTime;
  for (const c of vertexConstraints) {
    const parts = c.split(',');
    if (parts.length === 3) {
      const cx = Number(parts[0]);
      const cy = Number(parts[1]);
      const ct = Number(parts[2]);
      if (cx === goal.x && cy === goal.y && ct > maxGoalConstraintTime) {
        maxGoalConstraintTime = ct;
      }
    }
  }

  while (!openQueue.isEmpty()) {
    const current = openQueue.pop();
    const currKey = `${current.x},${current.y},${current.t}`;

    if (current.g > (gScore.get(currKey) ?? Infinity)) {
      continue;
    }

    if (closedSet.has(currKey)) {
      continue;
    }
    closedSet.add(currKey);
    nodesExpanded++;

    // Check goal condition: at goal cell, AND time >= maxGoalConstraintTime
    if (current.x === goal.x && current.y === goal.y && current.t >= maxGoalConstraintTime) {
      // Reconstruct path
      const path = [];
      let temp = { x: current.x, y: current.y, t: current.t };
      while (temp) {
        path.push({ x: temp.x, y: temp.y, t: temp.t });
        const pKey = `${temp.x},${temp.y},${temp.t}`;
        temp = parentMap.get(pKey);
      }
      path.reverse();

      return {
        path,
        cost: path.length - 1,
        nodesExpanded,
        found: true,
      };
    }

    if (current.t >= maxTimeHorizon) {
      continue;
    }

    const nextT = current.t + 1;

    // Available actions: 4 directions + WAIT action
    const actions = [
      ...DIRECTIONS_4.map((d) => ({ dx: d.dx, dy: d.dy, action: d.name })),
      { dx: 0, dy: 0, action: 'WAIT' },
    ];

    for (const act of actions) {
      const nx = current.x + act.dx;
      const ny = current.y + act.dy;

      // 1. Boundary & static obstacle check
      if (!isInBounds(nx, ny) || isStaticObstacle(nx, ny)) {
        continue;
      }

      // 2. Vertex constraint check: cannot be at (nx, ny) at time nextT
      const vKey = `${nx},${ny},${nextT}`;
      if (vertexConstraints.has(vKey)) {
        continue;
      }

      // 3. Edge / Swap constraint check: cannot traverse current -> next at time current.t
      const eKey = `${current.x},${current.y}->${nx},${ny},${current.t}`;
      if (edgeConstraints.has(eKey)) {
        continue;
      }

      const nextKey = `${nx},${ny},${nextT}`;
      if (closedSet.has(nextKey)) {
        continue;
      }

      const tentativeG = current.g + 1;
      const existingG = gScore.get(nextKey) ?? Infinity;

      if (tentativeG < existingG) {
        gScore.set(nextKey, tentativeG);
        parentMap.set(nextKey, { x: current.x, y: current.y, t: current.t });

        const h = manhattan(nx, ny);
        const f = tentativeG + h;

        openQueue.push({
          x: nx,
          y: ny,
          t: nextT,
          g: tentativeG,
          h,
          f,
        });
      }
    }
  }

  // No path found within horizon
  return {
    path: null,
    cost: 0,
    nodesExpanded,
    found: false,
  };
}
