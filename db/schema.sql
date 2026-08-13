-- ============================================================================
-- NexusIoT - Distributed Industrial IoT Edge & Telemetry Platform
-- Enterprise PostgreSQL Database Schema
-- ============================================================================

-- Extension for UUID generation and Time-Series indexing
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Device Registry Table
CREATE TABLE IF NOT EXISTS devices (
    device_id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    type VARCHAR(64) NOT NULL, -- e.g., 'TURBINE', 'GENERATOR', 'HVAC', 'PUMP'
    location VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ONLINE', -- 'ONLINE', 'WARNING', 'CRITICAL', 'OFFLINE'
    firmware_version VARCHAR(32) NOT NULL DEFAULT 'v2.4.1',
    ip_address VARCHAR(45) NOT NULL,
    mac_address VARCHAR(17) UNIQUE NOT NULL,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Time-Series Telemetry Data Table
CREATE TABLE IF NOT EXISTS telemetry_data (
    id BIGSERIAL PRIMARY KEY,
    device_id VARCHAR(64) REFERENCES devices(device_id) ON DELETE CASCADE,
    temperature NUMERIC(5,2) NOT NULL, -- Celsius
    vibration NUMERIC(5,2) NOT NULL,   -- mm/s RMS
    pressure NUMERIC(6,2) NOT NULL,    -- PSI / Bar
    gas_ppm NUMERIC(6,2) NOT NULL,     -- Methane / CO PPM
    voltage NUMERIC(5,2) NOT NULL,     -- Volts
    rpm INT NOT NULL,                  -- Rotations Per Minute
    is_anomaly BOOLEAN DEFAULT FALSE,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast time-series queries by device and timestamp
CREATE INDEX IF NOT EXISTS idx_telemetry_device_time ON telemetry_data(device_id, recorded_at DESC);

-- 3. Alert Events Table
CREATE TABLE IF NOT EXISTS alert_events (
    alert_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(64) REFERENCES devices(device_id) ON DELETE CASCADE,
    severity VARCHAR(32) NOT NULL, -- 'WARNING', 'CRITICAL', 'FATAL'
    metric_type VARCHAR(32) NOT NULL, -- 'TEMPERATURE', 'VIBRATION', 'GAS_PPM', 'PRESSURE'
    threshold_value NUMERIC(7,2) NOT NULL,
    actual_value NUMERIC(7,2) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_alerts_status ON alert_events(status, triggered_at DESC);

-- 4. Maintenance Logs Table
CREATE TABLE IF NOT EXISTS maintenance_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(64) REFERENCES devices(device_id) ON DELETE CASCADE,
    technician_name VARCHAR(128) NOT NULL,
    action_taken TEXT NOT NULL,
    parts_replaced TEXT,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Industrial Devices
INSERT INTO devices (device_id, name, type, location, status, ip_address, mac_address)
VALUES 
    ('DEV-TURBINE-01', 'Gas Turbine Alpha-1', 'TURBINE', 'Facility Sector A-1', 'ONLINE', '192.168.1.101', '00:1A:2B:3C:4D:5E'),
    ('DEV-GEN-02', 'High-Output Generator Bravo-2', 'GENERATOR', 'Power Substation B', 'ONLINE', '192.168.1.102', '00:1A:2B:3C:4D:5F'),
    ('DEV-HVAC-03', 'Industrial Chiller HVAC-3', 'HVAC', 'Cooling Tower C', 'ONLINE', '192.168.1.103', '00:1A:2B:3C:4D:60'),
    ('DEV-PUMP-04', 'Chemical Transfer Pump Delta-4', 'PUMP', 'Processing Plant D', 'WARNING', '192.168.1.104', '00:1A:2B:3C:4D:61')
ON CONFLICT (device_id) DO NOTHING;
