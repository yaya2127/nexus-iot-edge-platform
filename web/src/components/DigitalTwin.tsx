import React, { useEffect, useRef } from 'react';

interface DigitalTwinProps {
  deviceID: string;
  name: string;
  rpm: number;
  temperature: number;
  vibration: number;
  status: string;
}

export const DigitalTwin: React.FC<DigitalTwinProps> = ({
  deviceID,
  name,
  rpm,
  temperature,
  vibration,
  status
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let angle = 0;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      // Thermal Heat Aura Gradient
      const heatIntensity = Math.min(temperature / 120, 1);
      const heatRadius = 90 + vibration * 3;
      const grad = ctx.createRadialGradient(cx, cy, 20, cx, cy, heatRadius);

      if (temperature > 100) {
        grad.addColorStop(0, 'rgba(239, 68, 68, 0.6)');
        grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      } else if (temperature > 80) {
        grad.addColorStop(0, 'rgba(245, 158, 11, 0.4)');
        grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
      } else {
        grad.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
        grad.addColorStop(1, 'rgba(16, 185, 129, 0)');
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, heatRadius, 0, Math.PI * 2);
      ctx.fill();

      // Outer Stator Housing Ring
      ctx.strokeStyle = status === 'CRITICAL' ? '#ef4444' : '#1e293b';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(cx, cy, 65, 0, Math.PI * 2);
      ctx.stroke();

      // Vibration Ripple Effect
      if (vibration > 5.0) {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 75 + Math.sin(Date.now() / 100) * 4, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Rotating Turbine Blades
      ctx.save();
      ctx.translate(cx, cy);
      // Speed proportional to RPM
      angle += (rpm / 3600) * 0.15;
      ctx.rotate(angle);

      const blades = 6;
      ctx.fillStyle = '#06b6d4';
      for (let i = 0; i < blades; i++) {
        ctx.rotate((Math.PI * 2) / blades);
        ctx.beginPath();
        ctx.ellipse(0, -32, 8, 26, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Center Shaft Hub
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#06090e';
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fill();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [rpm, temperature, vibration, status]);

  return (
    <div className="cyber-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <h3 className="font-heading" style={{ fontSize: '0.95rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fas fa-cube" style={{ color: 'var(--accent-gold)' }}></i>
          Hardware Digital Twin Visualizer
        </h3>
        <span className={`status-pill ${status === 'CRITICAL' ? 'status-critical' : status === 'WARNING' ? 'status-warning' : 'status-online'}`}>
          {status}
        </span>
      </div>

      <div style={{ background: '#06090e', borderRadius: '8px', border: '1px solid #1e293b', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <canvas ref={canvasRef} width="220" height="220" style={{ width: '220px', height: '220px' }} />
        
        <div style={{ textAlign: 'center', marginTop: '12px', width: '100%' }}>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>{name}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{deviceID}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%', marginTop: '16px', fontSize: '0.78rem', background: '#0d131f', padding: '10px', borderRadius: '6px' }}>
          <div>Rotor Speed: <strong style={{ color: 'var(--accent-cyan)' }}>{rpm} RPM</strong></div>
          <div>Thermal: <strong style={{ color: temperature > 100 ? 'var(--accent-red)' : 'var(--accent-gold)' }}>{temperature}°C</strong></div>
          <div>Vibration: <strong style={{ color: vibration > 8 ? 'var(--accent-red)' : 'var(--accent-green)' }}>{vibration} mm/s</strong></div>
          <div>Telemetry: <strong style={{ color: 'var(--accent-green)' }}>SYNCED</strong></div>
        </div>
      </div>
    </div>
  );
};
