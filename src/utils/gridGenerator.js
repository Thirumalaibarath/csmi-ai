/**
 * Grid generation utilities, obstacle placements, agent color palettes,
 * and standard benchmarking presets.
 */

export const AGENT_PALETTES = [
  { name: 'Cyan', color: '#06B6D4', glow: 'rgba(6, 182, 212, 0.4)', text: '#0891B2' },
  { name: 'Magenta', color: '#EC4899', glow: 'rgba(236, 72, 153, 0.4)', text: '#DB2777' },
  { name: 'Amber', color: '#F59E0B', glow: 'rgba(245, 158, 11, 0.4)', text: '#D97706' },
  { name: 'Emerald', color: '#10B981', glow: 'rgba(16, 185, 129, 0.4)', text: '#059669' },
  { name: 'Violet', color: '#8B5CF6', glow: 'rgba(139, 92, 246, 0.4)', text: '#7C3AED' },
  { name: 'Rose', color: '#F43F5E', glow: 'rgba(244, 63, 94, 0.4)', text: '#E11D48' },
  { name: 'Sky', color: '#0EA5E9', glow: 'rgba(14, 165, 233, 0.4)', text: '#0284C7' },
  { name: 'Lime', color: '#84CC16', glow: 'rgba(132, 204, 22, 0.4)', text: '#65A30D' },
];

/**
 * Checks if there is a valid path from start to goal on the given grid using BFS
 */
export function isPathPossible(width, height, obstacles, start, goal) {
  const isObs = (x, y) => obstacles.has(`${x},${y}`);
  if (isObs(start.x, start.y) || isObs(goal.x, goal.y)) return false;

  const queue = [{ x: start.x, y: start.y }];
  const visited = new Set([`${start.x},${start.y}`]);

  while (queue.length > 0) {
    const curr = queue.shift();
    if (curr.x === goal.x && curr.y === goal.y) return true;

    const neighbors = [
      { x: curr.x + 1, y: curr.y },
      { x: curr.x - 1, y: curr.y },
      { x: curr.x, y: curr.y + 1 },
      { x: curr.x, y: curr.y - 1 },
    ];

    for (const n of neighbors) {
      if (n.x >= 0 && n.x < width && n.y >= 0 && n.y < height) {
        const key = `${n.x},${n.y}`;
        if (!visited.has(key) && !isObs(n.x, n.y)) {
          visited.add(key);
          queue.push(n);
        }
      }
    }
  }

  return false;
}

/**
 * Generates a random grid with guaranteed path(s)
 */
export function generateRandomGrid({
  width = 16,
  height = 16,
  obstacleDensity = 0.2,
  numAgents = 1,
  seed = null,
}) {
  let attempts = 0;
  const maxAttempts = 50;

  while (attempts < maxAttempts) {
    attempts++;
    const obstacles = new Set();
    const totalCells = width * height;
    const targetObstacles = Math.floor(totalCells * obstacleDensity);

    // Random obstacle placement
    while (obstacles.size < targetObstacles) {
      const rx = Math.floor(Math.random() * width);
      const ry = Math.floor(Math.random() * height);
      obstacles.add(`${rx},${ry}`);
    }

    // Pick distinct starts and goals
    const availableCells = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (!obstacles.has(`${x},${y}`)) {
          availableCells.push({ x, y });
        }
      }
    }

    if (availableCells.length < numAgents * 2) {
      continue;
    }

    // Shuffle available cells
    for (let i = availableCells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableCells[i], availableCells[j]] = [availableCells[j], availableCells[i]];
    }

    const agents = [];
    let validForAll = true;

    for (let a = 0; a < numAgents; a++) {
      const start = availableCells[a * 2];
      const goal = availableCells[a * 2 + 1];

      // Ensure path exists
      if (!isPathPossible(width, height, obstacles, start, goal)) {
        validForAll = false;
        break;
      }

      const palette = AGENT_PALETTES[a % AGENT_PALETTES.length];
      agents.push({
        id: a,
        name: `Robot ${a + 1}`,
        start,
        goal,
        color: palette.color,
        glow: palette.glow,
      });
    }

    if (validForAll) {
      return {
        width,
        height,
        obstacles,
        agents,
        start: agents[0].start,
        goal: agents[0].goal,
      };
    }
  }

  // Fallback empty grid if generation was too constrained
  const emptyObstacles = new Set();
  const agents = [];
  for (let a = 0; a < numAgents; a++) {
    const palette = AGENT_PALETTES[a % AGENT_PALETTES.length];
    agents.push({
      id: a,
      name: `Robot ${a + 1}`,
      start: { x: a, y: 0 },
      goal: { x: width - 1 - a, y: height - 1 },
      color: palette.color,
      glow: palette.glow,
    });
  }

  return {
    width,
    height,
    obstacles: emptyObstacles,
    agents,
    start: agents[0].start,
    goal: agents[0].goal,
  };
}

/**
 * Handcrafted Presets showcasing complex AI scenarios
 */
export const PRESETS = {
  CORRIDOR_BOTTLENECK: {
    name: 'Narrow Corridor Bottleneck',
    description: 'Two robots must cross a 1-cell wide corridor in opposite directions. Tests wait-action coordination.',
    generator: (width = 15, height = 9) => {
      const obstacles = new Set();
      const midY = Math.floor(height / 2);
      // Wall above and below middle row with a corridor
      for (let x = 3; x < width - 3; x++) {
        for (let y = 0; y < height; y++) {
          if (y !== midY) {
            obstacles.add(`${x},${y}`);
          }
        }
      }
      const agents = [
        {
          id: 0,
          name: 'Robot 1',
          start: { x: 1, y: midY },
          goal: { x: width - 2, y: midY },
          color: AGENT_PALETTES[0].color,
          glow: AGENT_PALETTES[0].glow,
        },
        {
          id: 1,
          name: 'Robot 2',
          start: { x: width - 2, y: midY },
          goal: { x: 1, y: midY },
          color: AGENT_PALETTES[1].color,
          glow: AGENT_PALETTES[1].glow,
        },
      ];
      return { width, height, obstacles, agents, start: agents[0].start, goal: agents[0].goal };
    },
  },
  CROSS_INTERSECTION: {
    name: '4-Way Cross Intersection',
    description: 'Four robots traveling from North, South, East, and West cross in the central junction.',
    generator: (width = 13, height = 13) => {
      const obstacles = new Set();
      const mid = Math.floor(width / 2);
      // Build 4 quadrant walls leaving a cross open
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (Math.abs(x - mid) > 1 && Math.abs(y - mid) > 1) {
            obstacles.add(`${x},${y}`);
          }
        }
      }
      const agents = [
        { id: 0, name: 'Robot 1 (W->E)', start: { x: 0, y: mid }, goal: { x: width - 1, y: mid }, color: AGENT_PALETTES[0].color, glow: AGENT_PALETTES[0].glow },
        { id: 1, name: 'Robot 2 (E->W)', start: { x: width - 1, y: mid }, goal: { x: 0, y: mid }, color: AGENT_PALETTES[1].color, glow: AGENT_PALETTES[1].glow },
        { id: 2, name: 'Robot 3 (N->S)', start: { x: mid, y: 0 }, goal: { x: mid, y: height - 1 }, color: AGENT_PALETTES[2].color, glow: AGENT_PALETTES[2].glow },
        { id: 3, name: 'Robot 4 (S->N)', start: { x: mid, y: height - 1 }, goal: { x: mid, y: 0 }, color: AGENT_PALETTES[3].color, glow: AGENT_PALETTES[3].glow },
      ];
      return { width, height, obstacles, agents, start: agents[0].start, goal: agents[0].goal };
    },
  },
  WAREHOUSE_AISLES: {
    name: 'Automated Warehouse Aisles',
    description: 'Amazon-style Kiva robot warehouse grid with vertical storage pods and navigation aisles.',
    generator: (width = 16, height = 12) => {
      const obstacles = new Set();
      for (let x = 2; x < width - 2; x += 3) {
        for (let y = 2; y < height - 2; y++) {
          obstacles.add(`${x},${y}`);
          obstacles.add(`${x + 1},${y}`);
        }
      }
      const agents = [
        { id: 0, name: 'Picker 1', start: { x: 0, y: 0 }, goal: { x: width - 1, y: height - 1 }, color: AGENT_PALETTES[0].color, glow: AGENT_PALETTES[0].glow },
        { id: 1, name: 'Picker 2', start: { x: width - 1, y: 0 }, goal: { x: 0, y: height - 1 }, color: AGENT_PALETTES[1].color, glow: AGENT_PALETTES[1].glow },
        { id: 2, name: 'Picker 3', start: { x: 0, y: height - 1 }, goal: { x: width - 1, y: 0 }, color: AGENT_PALETTES[2].color, glow: AGENT_PALETTES[2].glow },
      ];
      return { width, height, obstacles, agents, start: agents[0].start, goal: agents[0].goal };
    },
  },
};
