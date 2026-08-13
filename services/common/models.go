package common

import (
	"time"
)

// Device represents an industrial hardware node registered in NexusIoT
type Device struct {
	DeviceID        string    `json:"device_id"`
	Name            string    `json:"name"`
	Type            string    `json:"type"`
	Location        string    `json:"location"`
	Status          string    `json:"status"` // ONLINE, WARNING, CRITICAL, OFFLINE
	FirmwareVersion string    `json:"firmware_version"`
	IPAddress       string    `json:"ip_address"`
	MACAddress      string    `json:"mac_address"`
	LastSeen        time.Time `json:"last_seen"`
	CreatedAt       time.Time `json:"created_at"`
}

// TelemetryData represents a time-series metric payload emitted by sensors
type TelemetryData struct {
	ID          int64     `json:"id"`
	DeviceID    string    `json:"device_id"`
	Temperature float64   `json:"temperature"` // Celsius
	Vibration   float64   `json:"vibration"`   // mm/s RMS
	Pressure    float64   `json:"pressure"`    // PSI / Bar
	GasPPM      float64   `json:"gas_ppm"`     // Methane / CO PPM
	Voltage     float64   `json:"voltage"`     // Volts
	RPM         int       `json:"rpm"`         // Rotations Per Minute
	IsAnomaly   bool      `json:"is_anomaly"`
	RecordedAt  time.Time `json:"recorded_at"`
}

// AlertEvent represents a triggered anomaly or threshold breach
type AlertEvent struct {
	AlertID        string     `json:"alert_id"`
	DeviceID       string     `json:"device_id"`
	Severity       string     `json:"severity"`    // WARNING, CRITICAL, FATAL
	MetricType     string     `json:"metric_type"` // TEMPERATURE, VIBRATION, GAS_PPM, PRESSURE
	ThresholdValue float64    `json:"threshold_value"`
	ActualValue    float64    `json:"actual_value"`
	Message        string     `json:"message"`
	Status         string     `json:"status"` // ACTIVE, ACKNOWLEDGED, RESOLVED
	TriggeredAt    time.Time  `json:"triggered_at"`
	ResolvedAt     *time.Time `json:"resolved_at,omitempty"`
}

// MaintenanceLog represents technician action records
type MaintenanceLog struct {
	LogID          string    `json:"log_id"`
	DeviceID       string    `json:"device_id"`
	TechnicianName string    `json:"technician_name"`
	ActionTaken    string    `json:"action_taken"`
	PartsReplaced  string    `json:"parts_replaced"`
	LoggedAt       time.Time `json:"logged_at"`
}

// TelemetryStreamPayload is the WebSocket broadcast packet
type TelemetryStreamPayload struct {
	Event     string        `json:"event"` // "telemetry", "alert", "device_status"
	Timestamp time.Time     `json:"timestamp"`
	Data      interface{}   `json:"data"`
}
