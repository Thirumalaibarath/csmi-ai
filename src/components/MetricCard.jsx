import React from 'react';

export function MetricCard({
  title,
  value,
  unit = '',
  icon: Icon,
  badge = null,
  badgeType = 'cyan',
  detail = null,
  color = 'var(--accent-cyan)',
}) {
  return (
    <div className="glass-card kpi-card">
      <div className="kpi-header">
        <span>{title}</span>
        {Icon && <Icon size={18} style={{ color }} />}
      </div>
      <div className="kpi-value-row">
        <span className="kpi-value">{value}</span>
        {unit && <span className="kpi-unit">{unit}</span>}
      </div>
      {(detail || badge) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.2rem' }}>
          {detail && <span className="kpi-detail">{detail}</span>}
          {badge && <span className={`badge badge-${badgeType}`}>{badge}</span>}
        </div>
      )}
    </div>
  );
}
