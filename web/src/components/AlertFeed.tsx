import React from 'react';

interface AlertEvent {
  alert_id: string;
  device_id: string;
  severity: string;
  metric_type: string;
  actual_value: number;
  message: string;
  triggered_at: string;
}

interface AlertFeedProps {
  alerts: AlertEvent[];
}

export const AlertFeed: React.FC<AlertFeedProps> = ({ alerts }) => {
  return (
    <div className="cyber-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 className="font-heading" style={{ fontSize: '0.95rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fas fa-exclamation-triangle" style={{ color: 'var(--accent-red)' }}></i>
          Hardware Anomaly Alert Log
        </h3>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          {alerts.length} Recorded Event(s)
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto' }}>
        {alerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <i className="fas fa-check-circle" style={{ color: 'var(--accent-green)', fontSize: '1.5rem', marginBottom: '8px', display: 'block' }}></i>
            No active hardware anomalies detected. All cluster devices operating within nominal parameters.
          </div>
        ) : (
          alerts.map(alt => (
            <div
              key={alt.alert_id}
              style={{
                background: '#06090e',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '6px',
                padding: '12px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}
            >
              <div style={{ color: 'var(--accent-red)', fontSize: '1.2rem', marginTop: '2px' }}>
                <i className="fas fa-bell"></i>
              </div>
              <div style={{ flexGrow: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--accent-red)' }}>
                    [{alt.severity}] {alt.device_id}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {new Date(alt.triggered_at).toLocaleTimeString()}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#fff', lineHeight: 1.3 }}>
                  {alt.message}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
