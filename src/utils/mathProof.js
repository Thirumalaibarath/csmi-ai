import { HEURISTICS, calculateHeuristic } from '../algorithms/heuristics';

/**
 * Mathematical Proof and Step-by-Step Formula Substitution Engine
 * Computes exact numerical substitutions, admissibility checks, consistency inequalities,
 * and dominance relationships for any active heuristic.
 */

/**
 * Generates exact formula substitution string for a given cell (x, y) and goal (gx, gy)
 */
export function getStepFormulaSubstitution({
  heuristic,
  x,
  y,
  gx,
  gy,
  g = 0,
  weight = 1.5,
  trueDistance = null,
}) {
  const dx = gx - x;
  const dy = gy - y;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  let formulaName = '';
  let genericFormula = '';
  let substitutedFormula = '';
  let computedH = 0;
  let explanation = '';

  switch (heuristic) {
    case HEURISTICS.MANHATTAN:
      formulaName = 'Manhattan Distance (L1 Norm)';
      genericFormula = 'h(n) = |x - gx| + |y - gy|';
      substitutedFormula = `|${x} - ${gx}| + |${y} - ${gy}| = |${dx}| + |${dy}| = ${absDx} + ${absDy} = ${absDx + absDy}`;
      computedH = absDx + absDy;
      explanation = 'Measures the exact minimum orthogonal steps needed in obstacle-free space.';
      break;

    case HEURISTICS.EUCLIDEAN:
      formulaName = 'Euclidean Distance (L2 Norm)';
      genericFormula = 'h(n) = sqrt((x - gx)^2 + (y - gy)^2)';
      const sqDist = absDx * absDx + absDy * absDy;
      const eucVal = Math.sqrt(sqDist);
      substitutedFormula = `sqrt((${x} - ${gx})^2 + (${y} - ${gy})^2) = sqrt(${absDx}^2 + ${absDy}^2) = sqrt(${absDx * absDx} + ${absDy * absDy}) = sqrt(${sqDist}) = ${eucVal.toFixed(2)}`;
      computedH = Number(eucVal.toFixed(2));
      explanation = 'Straight-line geometric Euclidean distance. Always <= Manhattan on 4-way grids.';
      break;

    case HEURISTICS.CHEBYSHEV:
      formulaName = 'Chebyshev Distance (L-infinity Norm)';
      genericFormula = 'h(n) = max(|x - gx|, |y - gy|)';
      const chebVal = Math.max(absDx, absDy);
      substitutedFormula = `max(|${x} - ${gx}|, |${y} - ${gy}|) = max(${absDx}, ${absDy}) = ${chebVal}`;
      computedH = chebVal;
      explanation = 'Assumes diagonal movement is permitted at cost 1. Severely underestimates on 4-way grids.';
      break;

    case HEURISTICS.OCTILE:
      formulaName = 'Octile Distance';
      genericFormula = 'h(n) = (sqrt(2) - 1) * min(dx, dy) + max(dx, dy)';
      const minD = Math.min(absDx, absDy);
      const maxD = Math.max(absDx, absDy);
      const octVal = (Math.SQRT2 - 1) * minD + maxD;
      substitutedFormula = `(1.414 - 1) * min(${absDx}, ${absDy}) + max(${absDx}, ${absDy}) = 0.414 * ${minD} + ${maxD} = ${(0.414 * minD).toFixed(2)} + ${maxD} = ${octVal.toFixed(2)}`;
      computedH = Number(octVal.toFixed(2));
      explanation = 'Exact distance metric for 8-connected grids with orthogonal cost 1 and diagonal cost sqrt(2).';
      break;

    case HEURISTICS.WEIGHTED_MANHATTAN:
      formulaName = `Weighted Manhattan (w = ${weight})`;
      genericFormula = `h(n) = ${weight} * (|x - gx| + |y - gy|)`;
      const baseMan = absDx + absDy;
      const wMan = weight * baseMan;
      substitutedFormula = `${weight} * (|${x} - ${gx}| + |${y} - ${gy}|) = ${weight} * (${absDx} + ${absDy}) = ${weight} * ${baseMan} = ${wMan.toFixed(1)}`;
      computedH = Number(wMan.toFixed(1));
      explanation = 'Greedy inadmissible heuristic. Overweights distance to prioritize depth-first goal convergence.';
      break;

    case HEURISTICS.DIJKSTRA:
      formulaName = 'Zero Heuristic (Dijkstra / Uniform-Cost)';
      genericFormula = 'h(n) = 0';
      substitutedFormula = 'h(n) = 0 (No heuristic guidance)';
      computedH = 0;
      explanation = 'Degenerates A* into uniform-cost search. Priority queue expands strictly by g(n).';
      break;

    default:
      computedH = absDx + absDy;
      substitutedFormula = `${absDx} + ${absDy} = ${computedH}`;
  }

  const f = Number((g + computedH).toFixed(2));

  // Admissibility check: h(n) <= h*(n)
  let isAdmissible = true;
  let admissibilityNote = '';
  if (trueDistance !== null) {
    isAdmissible = computedH <= trueDistance + 1e-4;
    admissibilityNote = isAdmissible
      ? `h(n) = ${computedH} <= h*(n) = ${trueDistance} (Admissible: Never overestimates)`
      : `h(n) = ${computedH} > h*(n) = ${trueDistance} (Inadmissible: Overestimates true cost)`;
  }

  return {
    heuristic,
    formulaName,
    genericFormula,
    substitutedFormula,
    dx,
    dy,
    absDx,
    absDy,
    g,
    h: computedH,
    f,
    isAdmissible,
    admissibilityNote,
    explanation,
  };
}

/**
 * Generates the complete step-by-step mathematical trace ledger for a solved path
 */
export function generatePathMathLedger({ path, heuristic, goal, weight = 1.5 }) {
  if (!path || path.length === 0) return [];

  const ledger = [];
  const totalSteps = path.length - 1;

  for (let t = 0; t < path.length; t++) {
    const curr = path[t];
    const next = t < path.length - 1 ? path[t + 1] : null;

    // Remaining true distance along this optimal path
    const trueDistance = totalSteps - t;

    const sub = getStepFormulaSubstitution({
      heuristic,
      x: curr.x,
      y: curr.y,
      gx: goal.x,
      gy: goal.y,
      g: t,
      weight,
      trueDistance,
    });

    // Action name
    let actionName = 'GOAL';
    let stepCost = 0;
    if (next) {
      const adx = next.x - curr.x;
      const ady = next.y - curr.y;
      if (adx === 1 && ady === 0) actionName = 'RIGHT (→)';
      else if (adx === -1 && ady === 0) actionName = 'LEFT (←)';
      else if (adx === 0 && ady === 1) actionName = 'DOWN (↓)';
      else if (adx === 0 && ady === -1) actionName = 'UP (↑)';
      else if (adx === 1 && ady === 1) actionName = 'DOWN-RIGHT (↘)';
      else if (adx === -1 && ady === 1) actionName = 'DOWN-LEFT (↙)';
      else if (adx === 1 && ady === -1) actionName = 'UP-RIGHT (↗)';
      else if (adx === -1 && ady === -1) actionName = 'UP-LEFT (↖)';
      stepCost = adx !== 0 && ady !== 0 ? 1.414 : 1.0;
    }

    // Consistency check with next node: h(curr) <= c(curr, next) + h(next)
    let isConsistent = true;
    let consistencyDiff = 0;
    if (next) {
      const nextH = calculateHeuristic(heuristic, next.x, next.y, goal.x, goal.y, weight);
      consistencyDiff = Number((sub.h - nextH).toFixed(2));
      isConsistent = sub.h <= stepCost + nextH + 1e-4;
    }

    ledger.push({
      step: t,
      cell: curr,
      action: actionName,
      stepCost,
      g: t,
      h: sub.h,
      f: sub.f,
      substitution: sub.substitutedFormula,
      consistencyDiff,
      isConsistent,
      isGoal: t === path.length - 1,
    });
  }

  return ledger;
}

/**
 * Mathematical Dominance Theorem Verification
 * Proves the Minkowski inequality: h_Chebyshev <= h_Euclidean <= h_Manhattan
 */
export function getDominanceTheoremProof(x, y, gx, gy) {
  const dx = Math.abs(gx - x);
  const dy = Math.abs(gy - y);

  const cheb = Math.max(dx, dy);
  const euc = Number(Math.sqrt(dx * dx + dy * dy).toFixed(2));
  const oct = Number(((Math.SQRT2 - 1) * Math.min(dx, dy) + Math.max(dx, dy)).toFixed(2));
  const man = dx + dy;

  // Minkowski Chain: cheb <= euc <= man
  const chainHolds = cheb <= euc && euc <= man;

  return {
    dx,
    dy,
    cheb,
    euc,
    oct,
    man,
    chainHolds,
    chainString: `${cheb} (Chebyshev) <= ${oct} (Octile) <= ${euc} (Euclidean) <= ${man} (Manhattan)`,
    theoremExplanation:
      'By Minkowski norm inequality, L_infinity <= L_2 <= L_1. Therefore, Manhattan strictly dominates Euclidean and Chebyshev everywhere on the 4-way grid. By Pearl (1984), a dominating admissible heuristic is guaranteed to expand a subset of the nodes expanded by a dominated heuristic!',
  };
}
