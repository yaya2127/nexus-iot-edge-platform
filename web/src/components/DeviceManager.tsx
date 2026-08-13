import React from 'react';

interface Device {
  device_id: string;
  name: string;
  type: string;
  location: string;
  status: string;
  ip_address: string;
  mac_address: string;
}

interface DeviceManagerProps {
  devices: Device[];
  selectedDeviceID: string;
  onSelectDevice: (deviceID: string) => void;
  onTriggerAnomaly: (deviceID: string, anomalyType: string, active: boolean) => void;
}

export const DeviceManager: React.FC<DeviceManagerProps> = ({
  devices,
  selectedDeviceID,
  onSelectDevice,
  onTriggerAnomaly
}) => {
  return (
    <div className="cyber-card" style={{ marginTop: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 className="font-heading" style={{ fontSize: '1.05rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fas fa-server" style={{ color: 'var(--accent-gold)' }}></i>
          Cluster Hardware Device Registry & Anomaly Injector
        </h3>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Select device to view digital twin & trigger edge simulations
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1e293b', textAlign: 'left', color: 'var(--text-muted)' }}>
              <th style={{ padding: '12px' }}>Device ID / Name</th>
              <th style={{ padding: '12px' }}>Type</th>
              <th style={{ padding: '12px' }}>Location</th>
              <th style={{ padding: '12px' }}>Network IP</th>
              <th style={{ padding: '12px' }}>Health Status</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Simulator Actions</th>
            </tr>
          </thead>
          <tbody>
            {devices.map(dev => {
              const isSelected = dev.device_id === selectedDeviceID;
              return (
                <tr
                  key={dev.device_id}
                  onClick={() => onSelectDevice(dev.device_id)}
                  style={{
                    borderBottom: '1px solid #1e293b',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                    transition: 'background 0.2s ease'
                  }}
                >
                  <td style={{ padding: '14px' }}>
                    <div style={{ fontWeight: 700, color: isSelected ? 'var(--accent-gold)' : '#fff' }}>
                      {dev.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {dev.device_id}
                    </div>
                  </td>

                  <td style={{ padding: '14px' }}>
                    <span style={{ fontSize: '0.75rem', background: '#1e293b', padding: '3px 8px', borderRadius: '4px' }}>
                      {dev.type}
                    </span>
                  </td>

                  <td style={{ padding: '14px', color: 'var(--text-muted)' }}>{dev.location}</td>
                  <td style={{ padding: '14px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{dev.ip_address}</td>

                  <td style={{ padding: '14px' }}>
                    <span className={`status-pill ${dev.status === 'CRITICAL' ? 'status-critical' : dev.status === 'WARNING' ? 'status-warning' : 'status-online'}`}>
                      {dev.status}
                    </span>
                  </td>

                  <td style={{ padding: '14px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTriggerAnomaly(dev.device_id, 'THERMAL', true);
                        }}
                        className="btn-danger"
                        title="Simulate Overheat Failure"
                      >
                        🔥 Overheat
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTriggerAnomaly(dev.device_id, 'VIBRATION', true);
                        }}
                        className="btn-danger"
                        title="Simulate Bearing Failure"
                      >
                        ⚡ Vibration
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTriggerAnomaly(dev.device_id, 'GAS_LEAK', true);
                        }}
                        className="btn-danger"
                        title="Simulate Gas Leak"
                      >
                        ☣️ Gas Leak
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTriggerAnomaly(dev.device_id, 'CLEAR', false);
                        }}
                        style={{ background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '6px 10px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}
                      >
                        Clear
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
