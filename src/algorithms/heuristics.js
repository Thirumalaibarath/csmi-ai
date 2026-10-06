/**
 * Heuristics for A* Pathfinding on 2D Grids
 * Includes admissible, consistent, and weighted variations.
 */

export const HEURISTICS = {
  MANHATTAN: 'Manhattan',
  EUCLIDEAN: 'Euclidean',
  CHEBYSHEV: 'Chebyshev',
  OCTILE: 'Octile',
  WEIGHTED_MANHATTAN: 'Weighted Manhattan (w=1.5)',
  DIJKSTRA: 'Zero (Dijkstra Baseline)',
};

export const HEURISTIC_DESCRIPTIONS = {
  [HEURISTICS.MANHATTAN]: {
    name: 'Manhattan Distance (L1 Norm)',
    formula: 'h(u, v) = |x1 - x2| + |y1 - y2|',
    admissible: true,
    consistent: true,
    description:
      'Standard heuristic for 4-directional grid movement. Never overestimates distance, guarantees optimal shortest paths while expanding minimal nodes compared to other admissible norms.',
  },
  [HEURISTICS.EUCLIDEAN]: {
    name: 'Euclidean Distance (L2 Norm)',
    formula: 'h(u, v) = sqrt((x1 - x2)^2 + (y1 - y2)^2)',
    admissible: true,
    consistent: true,
    description:
      'Straight-line geometric distance. Admissible for 4-way movement but systematically underestimates grid paths (e.g. diagonal step is 1.414 vs grid cost 2), resulting in more expanded nodes than Manhattan.',
  },
  [HEURISTICS.CHEBYSHEV]: {
    name: 'Chebyshev Distance (L-infinity Norm)',
    formula: 'h(u, v) = max(|x1 - x2|, |y1 - y2|)',
    admissible: true,
    consistent: true,
    description:
      'Measures distance assuming 8-connected movement with equal diagonal cost. Because 4-connected movement cannot move diagonally, Chebyshev severely underestimates, demonstrating loose lower-bound behavior.',
  },
  [HEURISTICS.OCTILE]: {
    name: 'Octile Distance',
    formula: 'h(u, v) = (sqrt(2) - 1) * min(dx, dy) + max(dx, dy)',
    admissible: true,
    consistent: true,
    description:
      'Exact distance for 8-connected grid with diagonal cost sqrt(2). Provides a tighter lower-bound than Chebyshev while still remaining admissible for 4-connected movement.',
  },
  [HEURISTICS.WEIGHTED_MANHATTAN]: {
    name: 'Weighted Manhattan (epsilon = 1.5)',
    formula: 'h(u, v) = 1.5 * (|x1 - x2| + |y1 - y2|)',
    admissible: false,
    consistent: false,
    description:
      'Epsilon-admissible greedy heuristic. Inflates estimated remaining cost to prioritize depth-first exploration toward the goal. Dramatically reduces nodes expanded at the cost of slight bounded suboptimality (<= 1.5 * optimal).',
  },
  [HEURISTICS.DIJKSTRA]: {
    name: 'Zero Heuristic (Dijkstra / Uniform-Cost)',
    formula: 'h(u, v) = 0',
    admissible: true,
    consistent: true,
    description:
      'Blind uniform-cost search. Serves as theoretical control baseline to measure the search space reduction achieved by heuristic guidance.',
  },
};

/**
 * Calculate heuristic cost between two cells (x1, y1) and (x2, y2)
 */
export function calculateHeuristic(type, x1, y1, x2, y2, weight = 1.5) {
  const dx = Math.abs(x1 - x2);
  const dy = Math.abs(y1 - y2);

  switch (type) {
    case HEURISTICS.MANHATTAN:
      return dx + dy;
    case HEURISTICS.EUCLIDEAN:
      return Math.sqrt(dx * dx + dy * dy);
    case HEURISTICS.CHEBYSHEV:
      return Math.max(dx, dy);
    case HEURISTICS.OCTILE:
      return (Math.SQRT2 - 1) * Math.min(dx, dy) + Math.max(dx, dy);
    case HEURISTICS.WEIGHTED_MANHATTAN:
      return weight * (dx + dy);
    case HEURISTICS.DIJKSTRA:
      return 0;
    default:
      return dx + dy;
  }
}

/**
 * Geometric Vector & Multi-Metric Analysis between two cells
 * Computes vector displacement, direction angle theta, and all heuristic norms.
 */
export function getHeuristicAnalysis(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  const angleRad = Math.atan2(dy, dx);
  let angleDeg = Math.round((angleRad * 180) / Math.PI);
  if (angleDeg < 0) angleDeg += 360;

  const euclidean = Number(Math.sqrt(absDx * absDx + absDy * absDy).toFixed(2));
  const manhattan = absDx + absDy;
  const chebyshev = Math.max(absDx, absDy);
  const octile = Number(
    ((Math.SQRT2 - 1) * Math.min(absDx, absDy) + Math.max(absDx, absDy)).toFixed(2)
  );

  return {
    dx,
    dy,
    absDx,
    absDy,
    angleDeg,
    euclidean,
    manhattan,
    chebyshev,
    octile,
  };
}

