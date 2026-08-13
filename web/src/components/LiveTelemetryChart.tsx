import React, { useEffect, useRef } from 'react';

interface TelemetryPoint {
  recorded_at: string;
  temperature: number;
  vibration: number;
  pressure: number;
}

interface ChartProps {
  history: TelemetryPoint[];
}

export const LiveTelemetryChart: React.FC<ChartProps> = ({ history }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Background Grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;

    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y < height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    if (!history || history.length < 2) return;

    // Slice last 40 data points
    const points = history.slice(-40);
    const stepX = width / (points.length - 1);

    // 1. Draw Temperature Waveform (Gold)
    ctx.beginPath();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    points.forEach((p, i) => {
      const x = i * stepX;
      // Map 20°C - 120°C to canvas height
      const y = height - ((p.temperature - 20) / 100) * (height - 20) - 10;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // 2. Draw Vibration Waveform (Cyan)
    ctx.beginPath();
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    points.forEach((p, i) => {
      const x = i * stepX;
      // Map 0 - 15 mm/s to canvas height
      const y = height - (p.vibration / 15) * (height - 20) - 10;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // 3. Draw Pressure Waveform (Green)
    ctx.beginPath();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    points.forEach((p, i) => {
      const x = i * stepX;
      // Map 0 - 120 PSI to canvas height
      const y = height - (p.pressure / 120) * (height - 20) - 10;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, [history]);

  return (
    <div className="cyber-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 className="font-heading" style={{ fontSize: '1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fas fa-chart-line" style={{ color: 'var(--accent-gold)' }}></i>
          Real-Time Multi-Sensor Telemetry Oscilloscope
        </h3>
        <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', fontWeight: 600 }}>
          <span style={{ color: '#f59e0b' }}><i className="fas fa-minus"></i> Temperature (°C)</span>
          <span style={{ color: '#06b6d4' }}><i className="fas fa-minus"></i> Vibration (mm/s)</span>
          <span style={{ color: '#10b981' }}><i className="fas fa-minus"></i> Pressure (PSI)</span>
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%', background: '#080d16', borderRadius: '8px', border: '1px solid #1e293b', padding: '8px' }}>
        <canvas ref={canvasRef} width="760" height="220" style={{ width: '100%', height: '220px', display: 'block' }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '12px' }}>
        <span>Sampling Rate: 1.5 Hz</span>
        <span>Stream Buffer: 500 Records</span>
      </div>
    </div>
  );
};
