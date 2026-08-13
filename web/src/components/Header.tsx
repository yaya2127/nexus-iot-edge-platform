import React from 'react';

interface HeaderProps {
  wsConnected: boolean;
  activeNodeCount: number;
  criticalAlertCount: number;
  onRefreshDevices: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  wsConnected,
  activeNodeCount,
  criticalAlertCount,
  onRefreshDevices
}) => {
  return (
    <header className="app-header">
      <div className="container-fluid header-flex">
        <div className="brand-title">
          <i className="fas fa-bolt" style={{ color: 'var(--accent-gold)' }}></i>
          NEXUS<span>IoT</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, marginLeft: '8px' }}>
            v2.4 Enterprise Edge Platform
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* WebSocket Status */}
          <div className={`status-pill ${wsConnected ? 'status-online' : 'status-critical'}`}>
            <span className="pulse-dot" style={{ background: wsConnected ? 'var(--accent-green)' : 'var(--accent-red)' }}></span>
            {wsConnected ? 'WebSocket Live (1.5s)' : 'Connecting...'}
          </div>

          {/* Active Nodes */}
          <div className="status-pill status-online">
            <i className="fas fa-network-wired"></i>
            {activeNodeCount}/4 Nodes Online
          </div>

          {/* Alert Counter */}
          {criticalAlertCount > 0 ? (
            <div className="status-pill status-critical" style={{ animation: 'pulse 1s infinite' }}>
              <i className="fas fa-exclamation-triangle"></i>
              {criticalAlertCount} Critical Alert(s)
            </div>
          ) : (
            <div className="status-pill status-online">
              <i className="fas fa-shield-alt"></i>
              System Nominal
            </div>
          )}

          <button onClick={onRefreshDevices} className="btn-cyber" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
            <i className="fas fa-sync-alt"></i> Sync Cluster
          </button>
        </div>
      </div>
    </header>
  );
};
