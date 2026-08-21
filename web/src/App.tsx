import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { GaugeGrid } from './components/GaugeGrid';
import { LiveTelemetryChart } from './components/LiveTelemetryChart';
import { DigitalTwin } from './components/DigitalTwin';
import { DeviceManager } from './components/DeviceManager';
import { AlertFeed } from './components/AlertFeed';

interface TelemetryData {
  device_id: string;
  temperature: number;
  vibration: number;
  pressure: number;
  gas_ppm: number;
  voltage: number;
  rpm: number;
  is_anomaly: boolean;
  recorded_at: string;
}

interface Device {
  device_id: string;
  name: string;
  type: string;
  location: string;
  status: string;
  ip_address: string;
  mac_address: string;
}

interface AlertEvent {
  alert_id: string;
  device_id: string;
  severity: string;
  metric_type: string;
  actual_value: number;
  message: string;
  triggered_at: string;
}

export const App: React.FC = () => {
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [selectedDeviceID, setSelectedDeviceID] = useState<string>('DEV-TURBINE-01');
  
  const [devices, setDevices] = useState<Device[]>([
    { device_id: 'DEV-TURBINE-01', name: 'Gas Turbine Alpha-1', type: 'TURBINE', location: 'Facility Sector A-1', status: 'ONLINE', ip_address: '192.168.1.101', mac_address: '00:1A:2B:3C:4D:5E' },
    { device_id: 'DEV-GEN-02', name: 'High-Output Generator Bravo-2', type: 'GENERATOR', location: 'Power Substation B', status: 'ONLINE', ip_address: '192.168.1.102', mac_address: '00:1A:2B:3C:4D:5F' },
    { device_id: 'DEV-HVAC-03', name: 'Industrial Chiller HVAC-3', type: 'HVAC', location: 'Cooling Tower C', status: 'ONLINE', ip_address: '192.168.1.103', mac_address: '00:1A:2B:3C:4D:60' },
    { device_id: 'DEV-PUMP-04', name: 'Chemical Transfer Pump Delta-4', type: 'PUMP', location: 'Processing Plant D', status: 'WARNING', ip_address: '192.168.1.104', mac_address: '00:1A:2B:3C:4D:61' },
  ]);

  const [latestMetrics, setLatestMetrics] = useState<Record<string, TelemetryData>>({
    'DEV-TURBINE-01': { device_id: 'DEV-TURBINE-01', temperature: 78.5, vibration: 2.1, pressure: 45.0, gas_ppm: 12.0, voltage: 380, rpm: 3600, is_anomaly: false, recorded_at: new Date().toISOString() },
    'DEV-GEN-02': { device_id: 'DEV-GEN-02', temperature: 65.0, vibration: 1.4, pressure: 32.0, gas_ppm: 8.5, voltage: 380, rpm: 1800, is_anomaly: false, recorded_at: new Date().toISOString() },
    'DEV-HVAC-03': { device_id: 'DEV-HVAC-03', temperature: 42.0, vibration: 0.8, pressure: 60.0, gas_ppm: 5.0, voltage: 380, rpm: 1200, is_anomaly: false, recorded_at: new Date().toISOString() },
    'DEV-PUMP-04': { device_id: 'DEV-PUMP-04', temperature: 55.0, vibration: 4.8, pressure: 85.0, gas_ppm: 45.0, voltage: 380, rpm: 2400, is_anomaly: false, recorded_at: new Date().toISOString() },
  });

  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryData[]>([]);
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);

  // 1. Initial REST fetch for fallback & bootstrap
  const fetchRESTData = async () => {
    try {
      const [devRes, metRes, altRes] = await Promise.all([
        fetch('http://localhost:8081/api/v1/devices').catch(() => null),
        fetch('http://localhost:8081/api/v1/metrics/latest').catch(() => null),
        fetch('http://localhost:8081/api/v1/alerts').catch(() => null),
      ]);

      if (devRes && devRes.ok) {
        const dData = await devRes.json();
        if (Array.isArray(dData)) setDevices(dData);
      }

      if (metRes && metRes.ok) {
        const mData = await metRes.json();
        if (mData.latest) setLatestMetrics(mData.latest);
        if (mData.history) setTelemetryHistory(mData.history);
      }

      if (altRes && altRes.ok) {
        const aData = await altRes.json();
        if (Array.isArray(aData)) setAlerts(aData);
      }
    } catch (err) {
      console.log('Rest sync fallback:', err);
    }
  };

  useEffect(() => {
    fetchRESTData();

    // 2. WebSocket Real-Time Telemetry Stream
    const connectWS = () => {
      const ws = new WebSocket('ws://localhost:8082/ws');

      ws.onopen = () => {
        setWsConnected(true);
        console.log('🔌 WebSocket Connected to NexusIoT Gateway');
      };

      ws.onmessage = (event) => {
        try {
          const packet = JSON.parse(event.data);
          if (packet.event === 'telemetry' && packet.data) {
            const data: TelemetryData = packet.data;

            setLatestMetrics(prev => ({
              ...prev,
              [data.device_id]: data
            }));

            if (data.device_id === selectedDeviceID) {
              setTelemetryHistory(prev => [...prev.slice(-100), data]);
            }
          }
        } catch (e) {
          console.error('Error parsing WS telemetry:', e);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        setTimeout(connectWS, 3000);
      };

      ws.onerror = (err) => {
        ws.close();
      };
    };

    connectWS();
  }, [selectedDeviceID]);

  // Handle remote anomaly injection
  const handleTriggerAnomaly = async (deviceID: string, anomalyType: string, active: boolean) => {
    try {
      await fetch('http://localhost:8085/api/simulator/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: deviceID,
          anomaly_type: anomalyType,
          active: active
        })
      });
      fetchRESTData();
    } catch (e) {
      console.log('Simulator trigger endpoint:', e);
    }
  };

  const currentDevice = devices.find(d => d.device_id === selectedDeviceID) || devices[0];
  const currentTelemetry = latestMetrics[selectedDeviceID] || {
    device_id: selectedDeviceID,
    temperature: 75.0,
    vibration: 2.0,
    pressure: 45.0,
    gas_ppm: 10.0,
    voltage: 380,
    rpm: 3600,
    is_anomaly: false,
    recorded_at: new Date().toISOString()
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-obsidian)', color: 'var(--text-main)' }}>
      {/* Header Bar */}
      <Header
        wsConnected={wsConnected}
        activeNodeCount={devices.filter(d => d.status !== 'OFFLINE').length}
        criticalAlertCount={alerts.filter(a => a.severity === 'CRITICAL' || a.severity === 'FATAL').length}
        onRefreshDevices={fetchRESTData}
      />

      <main className="container-fluid" style={{ paddingTop: '24px', paddingBottom: '40px' }}>
        {/* Top 4 SVG Circular Telemetry Gauges */}
        <GaugeGrid telemetry={currentTelemetry} />

        {/* Oscilloscope & Digital Twin */}
        <div className="main-layout-grid">
          <LiveTelemetryChart history={telemetryHistory} />
          <DigitalTwin
            deviceID={currentDevice.device_id}
            name={currentDevice.name}
            rpm={currentTelemetry.rpm}
            temperature={currentTelemetry.temperature}
            vibration={currentTelemetry.vibration}
            status={currentDevice.status}
          />
        </div>

        {/* Bottom Alert Log & Device Registry */}
        <div className="main-layout-grid">
          <DeviceManager
            devices={devices}
            selectedDeviceID={selectedDeviceID}
            onSelectDevice={setSelectedDeviceID}
            onTriggerAnomaly={handleTriggerAnomaly}
          />
          <AlertFeed alerts={alerts} />
        </div>
      </main>
    </div>
  );
};
// Telemetry CSV Export Helper
