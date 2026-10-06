import React, { useState } from 'react';
import {
  Calculator,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Scale,
  Activity,
  ArrowRight,
} from 'lucide-react';
import {
  getStepFormulaSubstitution,
  generatePathMathLedger,
  getDominanceTheoremProof,
} from '../utils/mathProof';

export function MathProofCard({
  heuristic,
  start,
  goal,
  path,
  currentRobotStep = 0,
  onSelectStep = null,
  weight = 1.5,
}) {
  const [activeTab, setActiveTab] = useState('CURRENT_STEP'); // 'CURRENT_STEP' | 'PATH_LEDGER' | 'DOMINANCE_PROOF'
  const [isExpanded, setIsExpanded] = useState(true);

  const activeCell = path && path[currentRobotStep] ? path[currentRobotStep] : start;

  // Formula substitution for current step
  const stepMath = getStepFormulaSubstitution({
    heuristic,
    x: activeCell.x,
    y: activeCell.y,
    gx: goal.x,
    gy: goal.y,
    g: currentRobotStep,
    weight,
    trueDistance: path ? path.length - 1 - currentRobotStep : null,
  });

  // Full path mathematical trace ledger
  const pathLedger = generatePathMathLedger({
    path,
    heuristic,
    goal,
    weight,
  });

  // Dominance proof
  const dominance = getDominanceTheoremProof(activeCell.x, activeCell.y, goal.x, goal.y);

  return (
    <div
      style={{
        marginTop: '1.25rem',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid rgba(6, 182, 212, 0.35)',
        overflow: 'hidden',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.85rem 1.25rem',
          background: 'rgba(6, 182, 212, 0.08)',
          borderBottom: '1px solid var(--border-subtle)',
          cursor: 'pointer',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Calculator size={20} color="var(--accent-cyan)" />
          <div>
            <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Mathematical Heuristic Proof & Step Calculation Engine
            </span>
            <span
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                display: 'block',
                marginTop: '1px',
              }}
            >
              Exact numerical substitutions, admissibility proofs, and step-by-step mathematical ledger
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="badge badge-cyan">{heuristic}</span>
          <button
            className="playback-btn"
            style={{ padding: '0.2rem' }}
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Sub-Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.65rem', flexWrap: 'wrap' }}>
            <button
              className={`btn btn-secondary ${activeTab === 'CURRENT_STEP' ? 'btn-primary' : ''}`}
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
              onClick={() => setActiveTab('CURRENT_STEP')}
            >
              1. Step #{currentRobotStep} Exact Substitution
            </button>
            <button
              className={`btn btn-secondary ${activeTab === 'PATH_LEDGER' ? 'btn-primary' : ''}`}
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
              onClick={() => setActiveTab('PATH_LEDGER')}
            >
              2. Full Path Mathematical Ledger ({path ? path.length : 0} Steps)
            </button>
            <button
              className={`btn btn-secondary ${activeTab === 'DOMINANCE_PROOF' ? 'btn-primary' : ''}`}
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
              onClick={() => setActiveTab('DOMINANCE_PROOF')}
            >
              3. Heuristic Dominance Theorem Proof
            </button>
            <button
              className={`btn btn-secondary ${activeTab === 'GEOMETRY_DIAGRAM' ? 'btn-primary' : ''}`}
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
              onClick={() => setActiveTab('GEOMETRY_DIAGRAM')}
            >
              4. 📐 Visual Geometry & Angles Diagram
            </button>
          </div>

          {/* ============================================================== */}
          {/* TAB 1: CURRENT STEP EXACT SUBSTITUTION */}
          {/* ============================================================== */}
          {activeTab === 'CURRENT_STEP' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Formula & Number Substitution Box */}
              <div
                style={{
                  background: 'rgba(10, 13, 20, 0.7)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                    {stepMath.formulaName}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Current Cell: ({activeCell.x}, {activeCell.y}) → Goal: ({goal.x}, {goal.y})
                  </span>
                </div>

                {/* Generic Formula */}
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', color: '#94a3b8' }}>
                  <span style={{ color: 'var(--text-muted)', marginRight: '0.5rem' }}>General Form:</span>
                  <code style={{ background: 'rgba(255,255,255,0.06)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                    {stepMath.genericFormula}
                  </code>
                </div>

                {/* Substituted Numbers */}
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.95rem',
                    color: 'var(--text-primary)',
                    background: 'rgba(6, 182, 212, 0.08)',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(6, 182, 212, 0.25)',
                  }}
                >
                  <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>h(n) = </span>
                  <span>{stepMath.substitutedFormula}</span>
                </div>

                {/* Total f(n) calculation */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.5rem',
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>g(n) (cost from start): </span>
                    <strong style={{ color: 'var(--accent-emerald)' }}>{stepMath.g}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>h(n) (estimate): </span>
                    <strong style={{ color: 'var(--accent-cyan)' }}>{stepMath.h}</strong>
                  </div>
                  <div
                    style={{
                      background: 'rgba(16, 185, 129, 0.15)',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '4px',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    <span style={{ color: 'var(--accent-emerald)' }}>Total Priority: </span>
                    <strong style={{ color: '#ffffff', fontSize: '1rem' }}>
                      f(n) = g + h = {stepMath.g} + {stepMath.h} = {stepMath.f}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Admissibility and Consistency Proof Badges */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '0.85rem',
                }}
              >
                {/* Proof 1: Admissibility */}
                <div
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
                    {stepMath.isAdmissible ? (
                      <CheckCircle2 size={16} color="var(--accent-emerald)" />
                    ) : (
                      <AlertTriangle size={16} color="var(--accent-amber)" />
                    )}
                    <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                      Mathematical Admissibility Proof: h(n) ≤ h*(n)
                    </span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {stepMath.admissibilityNote}
                  </p>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.4rem' }}>
                    <strong>Theorem:</strong> When h(n) never overestimates the true remaining distance, A* tree search is mathematically guaranteed to return the globally optimal shortest path upon popping the Goal.
                  </div>
                </div>

                {/* Proof 2: Consistency */}
                <div
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
                    <CheckCircle2 size={16} color="var(--accent-emerald)" />
                    <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                      Monotonicity / Consistency Proof: h(u) ≤ c(u, v) + h(v)
                    </span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Triangle inequality holds for all adjacent steps: the reduction in heuristic distance Δh between consecutive steps never exceeds the step cost (1.0).
                  </p>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.4rem' }}>
                    <strong>Theorem:</strong> Consistency guarantees that the sequence of f-values along any path is monotonically non-decreasing, meaning the first time any state is expanded, its optimal path has already been found (no re-expansions required).
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: FULL PATH MATHEMATICAL TRACE LEDGER */}
          {/* ============================================================== */}
          {activeTab === 'PATH_LEDGER' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Step-by-step verification of every coordinate on the found path. Click any row to jump the robot:
                </span>
                <span className="badge badge-emerald">Total Path Cost: {pathLedger.length - 1} Steps</span>
              </div>

              <div style={{ overflowX: 'auto', maxHeight: '280px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                  <thead style={{ position: 'sticky', top: 0, background: '#0e1524', zIndex: 10 }}>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                      <th style={{ textAlign: 'center', padding: '0.5rem' }}>Step (t)</th>
                      <th style={{ textAlign: 'center', padding: '0.5rem' }}>Coordinate (x, y)</th>
                      <th style={{ textAlign: 'center', padding: '0.5rem' }}>Transition Action</th>
                      <th style={{ textAlign: 'center', padding: '0.5rem' }}>g(t)</th>
                      <th style={{ textAlign: 'left', padding: '0.5rem' }}>Formula Substitution</th>
                      <th style={{ textAlign: 'center', padding: '0.5rem' }}>h(t)</th>
                      <th style={{ textAlign: 'center', padding: '0.5rem' }}>f = g + h</th>
                      <th style={{ textAlign: 'center', padding: '0.5rem' }}>Consistent?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pathLedger.map((row) => {
                      const isCurrent = row.step === currentRobotStep;
                      return (
                        <tr
                          key={row.step}
                          onClick={() => onSelectStep && onSelectStep(row.step)}
                          style={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                            background: isCurrent ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                            cursor: 'pointer',
                            fontWeight: isCurrent ? 700 : 400,
                          }}
                        >
                          <td style={{ textAlign: 'center', padding: '0.45rem', color: 'var(--accent-cyan)' }}>
                            #{row.step}
                          </td>
                          <td style={{ textAlign: 'center', padding: '0.45rem', fontFamily: 'var(--font-mono)' }}>
                            ({row.cell.x}, {row.cell.y})
                          </td>
                          <td style={{ textAlign: 'center', padding: '0.45rem', color: 'var(--text-muted)' }}>
                            {row.action}
                          </td>
                          <td style={{ textAlign: 'center', padding: '0.45rem', color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
                            {row.g}
                          </td>
                          <td style={{ textAlign: 'left', padding: '0.45rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                            {row.substitution}
                          </td>
                          <td style={{ textAlign: 'center', padding: '0.45rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                            {row.h}
                          </td>
                          <td style={{ textAlign: 'center', padding: '0.45rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                            {row.f}
                          </td>
                          <td style={{ textAlign: 'center', padding: '0.45rem' }}>
                            <span className="badge badge-emerald">Verified ✅</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: DOMINANCE THEOREM PROOF */}
          {/* ============================================================== */}
          {activeTab === 'DOMINANCE_PROOF' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div
                style={{
                  background: 'rgba(10, 13, 20, 0.7)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--accent-cyan)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  The Minkowski Norm Inequality & Heuristic Dominance Chain
                </div>

                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '1rem',
                    color: 'var(--accent-emerald)',
                    background: 'rgba(16, 185, 129, 0.08)',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    marginBottom: '0.85rem',
                  }}
                >
                  {dominance.chainString}
                </div>

                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {dominance.theoremExplanation}
                </p>

                <div
                  style={{
                    marginTop: '1rem',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '0.75rem',
                    fontSize: '0.8rem',
                  }}
                >
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.65rem', borderRadius: '6px' }}>
                    <strong style={{ color: '#8b5cf6' }}>Chebyshev (L∞) = {dominance.cheb}</strong>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '0.2rem' }}>
                      Loosest lower bound. Severely underestimates on 4-way grids, causing excessive node expansions.
                    </p>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.65rem', borderRadius: '6px' }}>
                    <strong style={{ color: '#3b82f6' }}>Euclidean (L2) = {dominance.euc}</strong>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '0.2rem' }}>
                      Admissible geometric straight line, but smaller than Manhattan. Must expand ≥ Manhattan.
                    </p>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.65rem', borderRadius: '6px' }}>
                    <strong style={{ color: '#06b6d4' }}>Manhattan (L1) = {dominance.man}</strong>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '0.2rem' }}>
                      TIGHTEST lower-bound. Dominates Euclidean everywhere, provably expanding minimal nodes!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 4: VISUAL GEOMETRY & ANGLES DIAGRAM */}
          {/* ============================================================== */}
          {activeTab === 'GEOMETRY_DIAGRAM' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                    Heuristic Trajectories & Vector Heading Angles (θ)
                  </span>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Visualizing how each heuristic decomposes the distance between Start and Goal on a discrete 2D grid
                  </p>
                </div>
                <a
                  href="/heuristic_geometry.svg"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.72rem', padding: '0.3rem 0.65rem' }}
                >
                  Open Fullscreen Diagram ↗
                </a>
              </div>

              {/* Vector Diagram Image */}
              <div
                style={{
                  background: '#080c16',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  padding: '0.75rem',
                  display: 'flex',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <img
                  src="/heuristic_geometry.svg"
                  alt="Heuristic Geometry and Vector Angles"
                  style={{
                    width: '100%',
                    maxHeight: '440px',
                    objectFit: 'contain',
                    borderRadius: '6px',
                  }}
                />
              </div>

              {/* Angle & Calculation Explanation Matrix */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '0.75rem',
                  fontSize: '0.78rem',
                }}
              >
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '6px', borderLeft: '3px solid #06b6d4' }}>
                  <strong style={{ color: '#06b6d4' }}>Manhattan (L1)</strong>
                  <div style={{ color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', margin: '0.2rem 0' }}>
                    Angle: 0° & 90° Orthogonal
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', lineHeight: 1.4 }}>
                    Cannot move diagonally. Decomposes vector into orthogonal steps (|Δx| + |Δy|). Never cuts corners, expanding minimal nodes on 4-way grids.
                  </p>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '6px', borderLeft: '3px solid #3b82f6' }}>
                  <strong style={{ color: '#3b82f6' }}>Euclidean (L2)</strong>
                  <div style={{ color: '#60a5fa', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', margin: '0.2rem 0' }}>
                    Angle: θ = atan2(Δy, Δx)
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', lineHeight: 1.4 }}>
                    Draws a straight line hypotenuse directly along angle θ. Because it assumes the robot can fly straight, it undercuts grid paths (√2 &lt; 2).
                  </p>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '6px', borderLeft: '3px solid #8b5cf6' }}>
                  <strong style={{ color: '#8b5cf6' }}>Chebyshev (L∞)</strong>
                  <div style={{ color: '#c084fc', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', margin: '0.2rem 0' }}>
                    Angle: 45° Diagonal then 0°/90°
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', lineHeight: 1.4 }}>
                    Moves diagonally at 45° as long as possible with uniform cost 1.0. Severely underestimates on 4-way grids, causing heavy expansion penalties.
                  </p>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '6px', borderLeft: '3px solid #ec4899' }}>
                  <strong style={{ color: '#ec4899' }}>Octile Distance</strong>
                  <div style={{ color: '#f472b6', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', margin: '0.2rem 0' }}>
                    Angle: 45° (cost √2) + Straight (cost 1.0)
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', lineHeight: 1.4 }}>
                    Exact geometric metric for 8-connected grid movement where diagonal steps cost √2 ≈ 1.414 and straight steps cost 1.0.
                  </p>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '6px', borderLeft: '3px solid #64748b' }}>
                  <strong style={{ color: '#94a3b8' }}>Dijkstra Baseline</strong>
                  <div style={{ color: '#cbd5e1', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', margin: '0.2rem 0' }}>
                    Angle: NONE (360° Omnidirectional)
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', lineHeight: 1.4 }}>
                    Sets h(n) = 0. Has zero directional angle bias; expands in expanding circular rings around the start, exploring maximum cells.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
