import React from 'react';

interface TelemetryData {
  temperature: number;
  vibration: number;
  pressure: number;
  gas_ppm: number;
  voltage: number;
  rpm: number;
}

interface GaugeGridProps {
  telemetry: TelemetryData;
}

export const GaugeGrid: React.FC<GaugeGridProps> = ({ telemetry }) => {
  const getGaugeColor = (val: number, max: number, warnThresh: number, critThresh: number) => {
    if (val >= critThresh) return 'var(--accent-red)';
    if (val >= warnThresh) return 'var(--accent-gold)';
    return 'var(--accent-green)';
  };

  const renderGauge = (
    title: string,
    val: number,
    unit: string,
    max: number,
    warn: number,
    crit: number,
    iconClass: string
  ) => {
    const strokeColor = getGaugeColor(val, max, warn, crit);
    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    const percent = Math.min(val / max, 1);
    const offset = circumference - percent * circumference;

    return (
      <div className="cyber-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            <i className={`${iconClass}`} style={{ color: strokeColor, marginRight: '8px' }}></i>
            {title}
          </span>
          <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: strokeColor }}>
            MAX {max}{unit}
          </span>
        </div>

        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '120px' }}>
          <svg width="120" height="120" viewBox="0 0 100 100">
            {/* Background ring */}
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#1e293b" strokeWidth="8" />
            {/* Value stroke ring */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={strokeColor}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease' }}
            />
          </svg>
          <div style={{ position: 'absolute', textAlign: 'center' }}>
            <div className="font-heading" style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
              {val}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>
              {unit}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '12px', borderTop: '1px solid #1e293b', paddingTop: '8px' }}>
          <span>Status:</span>
          <span style={{ color: strokeColor, fontWeight: 700 }}>
            {val >= crit ? 'CRITICAL OVERHEAD' : val >= warn ? 'ELEVATED' : 'NOMINAL'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-grid">
      {renderGauge('Thermal Sensor', telemetry.temperature, '°C', 150, 85, 100, 'fas fa-thermometer-half')}
      {renderGauge('Bearing Vibration', telemetry.vibration, 'mm/s', 15, 5.0, 8.0, 'fas fa-wave-square')}
      {renderGauge('Hydraulic Pressure', telemetry.pressure, 'PSI', 120, 80, 100, 'fas fa-compress-arrows-alt')}
      {renderGauge('Atmospheric Gas', telemetry.gas_ppm, 'PPM', 300, 100, 150, 'fas fa-smog')}
    </div>
  );
};
