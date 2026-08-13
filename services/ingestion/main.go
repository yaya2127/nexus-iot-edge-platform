package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/yaya2127/nexus-iot-edge-platform/services/common"
)

type IngestionService struct {
	mu             sync.RWMutex
	recentMetrics  []common.TelemetryData
	deviceLatest   map[string]common.TelemetryData
	activeAlerts   []common.AlertEvent
	registeredDevs map[string]common.Device
}

var service = &IngestionService{
	recentMetrics:  make([]common.TelemetryData, 0),
	deviceLatest:   make(map[string]common.TelemetryData),
	activeAlerts:   make([]common.AlertEvent, 0),
	registeredDevs: make(map[string]common.Device),
}

func init() {
	// Initialize default registered industrial devices
	devs := []common.Device{
		{
			DeviceID:        "DEV-TURBINE-01",
			Name:            "Gas Turbine Alpha-1",
			Type:            "TURBINE",
			Location:        "Facility Sector A-1",
			Status:          "ONLINE",
			FirmwareVersion: "v2.4.1",
			IPAddress:       "192.168.1.101",
			MACAddress:      "00:1A:2B:3C:4D:5E",
			LastSeen:        time.Now(),
		},
		{
			DeviceID:        "DEV-GEN-02",
			Name:            "High-Output Generator Bravo-2",
			Type:            "GENERATOR",
			Location:        "Power Substation B",
			Status:          "ONLINE",
			FirmwareVersion: "v2.4.1",
			IPAddress:       "192.168.1.102",
			MACAddress:      "00:1A:2B:3C:4D:5F",
			LastSeen:        time.Now(),
		},
		{
			DeviceID:        "DEV-HVAC-03",
			Name:            "Industrial Chiller HVAC-3",
			Type:            "HVAC",
			Location:        "Cooling Tower C",
			Status:          "ONLINE",
			FirmwareVersion: "v2.4.1",
			IPAddress:       "192.168.1.103",
			MACAddress:      "00:1A:2B:3C:4D:60",
			LastSeen:        time.Now(),
		},
		{
			DeviceID:        "DEV-PUMP-04",
			Name:            "Chemical Transfer Pump Delta-4",
			Type:            "PUMP",
			Location:        "Processing Plant D",
			Status:          "WARNING",
			FirmwareVersion: "v2.4.1",
			IPAddress:       "192.168.1.104",
			MACAddress:      "00:1A:2B:3C:4D:61",
			LastSeen:        time.Now(),
		},
	}

	for _, d := range devs {
		service.registeredDevs[d.DeviceID] = d
	}
}

func main() {
	log.Println("==================================================================")
	log.Println("⚡ NexusIoT - High-Throughput Telemetry Ingestion Microservice...")
	log.Println("==================================================================")

	http.HandleFunc("/api/v1/telemetry", service.handleIngestTelemetry)
	http.HandleFunc("/api/v1/devices", service.handleGetDevices)
	http.HandleFunc("/api/v1/metrics/latest", service.handleGetLatestMetrics)
	http.HandleFunc("/api/v1/alerts", service.handleGetAlerts)

	log.Println("🌐 Telemetry Ingestion API listening on http://localhost:8081")
	if err := http.ListenAndServe(":8081", nil); err != nil {
		log.Fatalf("Ingestion service failed to start: %v", err)
	}
}

func (s *IngestionService) handleIngestTelemetry(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		return
	}

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var data common.TelemetryData
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if data.RecordedAt.IsZero() {
		data.RecordedAt = time.Now()
	}

	s.mu.Lock()
	s.recentMetrics = append(s.recentMetrics, data)
	if len(s.recentMetrics) > 500 {
		s.recentMetrics = s.recentMetrics[len(s.recentMetrics)-500:]
	}
	s.deviceLatest[data.DeviceID] = data

	// Update device last seen and status
	if dev, exists := s.registeredDevs[data.DeviceID]; exists {
		dev.LastSeen = time.Now()
		if data.IsAnomaly || data.Temperature > 100.0 || data.Vibration > 8.0 || data.GasPPM > 150.0 {
			dev.Status = "CRITICAL"
			s.triggerAlert(data)
		} else if data.Vibration > 5.0 || data.Temperature > 85.0 {
			dev.Status = "WARNING"
		} else {
			dev.Status = "ONLINE"
		}
		s.registeredDevs[data.DeviceID] = dev
	}
	s.mu.Unlock()

	// Broadcast payload to Gateway WebSocket service
	go broadcastToGateway(data)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "accepted"})
}

func (s *IngestionService) triggerAlert(data common.TelemetryData) {
	var alert common.AlertEvent
	alert.AlertID = fmt.Sprintf("ALT-%d", time.Now().UnixNano()/1e6)
	alert.DeviceID = data.DeviceID
	alert.Status = "ACTIVE"
	alert.TriggeredAt = time.Now()

	if data.Temperature > 100.0 {
		alert.Severity = "CRITICAL"
		alert.MetricType = "TEMPERATURE"
		alert.ThresholdValue = 100.0
		alert.ActualValue = data.Temperature
		alert.Message = fmt.Sprintf("Thermal runaway detected on %s: %.1f°C exceeds safety threshold (100°C)", data.DeviceID, data.Temperature)
	} else if data.Vibration > 8.0 {
		alert.Severity = "CRITICAL"
		alert.MetricType = "VIBRATION"
		alert.ThresholdValue = 8.0
		alert.ActualValue = data.Vibration
		alert.Message = fmt.Sprintf("Severe mechanical vibration bearing failure on %s: %.2f mm/s RMS", data.DeviceID, data.Vibration)
	} else if data.GasPPM > 150.0 {
		alert.Severity = "FATAL"
		alert.MetricType = "GAS_PPM"
		alert.ThresholdValue = 150.0
		alert.ActualValue = data.GasPPM
		alert.Message = fmt.Sprintf("Hazardous atmospheric gas leak detected on %s: %.1f PPM", data.DeviceID, data.GasPPM)
	}

	if alert.Severity != "" {
		s.activeAlerts = append([]common.AlertEvent{alert}, s.activeAlerts...)
		if len(s.activeAlerts) > 50 {
			s.activeAlerts = s.activeAlerts[:50]
		}
		log.Printf("🚨 ALERT TRIGGERED: [%s] %s - %s", alert.Severity, alert.DeviceID, alert.Message)
	}
}

func (s *IngestionService) handleGetDevices(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")

	s.mu.RLock()
	defer s.mu.RUnlock()

	devList := make([]common.Device, 0)
	for _, dev := range s.registeredDevs {
		devList = append(devList, dev)
	}

	json.NewEncoder(w).Encode(devList)
}

func (s *IngestionService) handleGetLatestMetrics(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")

	s.mu.RLock()
	defer s.mu.RUnlock()

	json.NewEncoder(w).Encode(map[string]interface{}{
		"latest":  s.deviceLatest,
		"history": s.recentMetrics,
	})
}

func (s *IngestionService) handleGetAlerts(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")

	s.mu.RLock()
	defer s.mu.RUnlock()

	json.NewEncoder(w).Encode(s.activeAlerts)
}

func broadcastToGateway(data common.TelemetryData) {
	payload := map[string]interface{}{
		"event":     "telemetry",
		"timestamp": time.Now(),
		"data":      data,
	}
	jsonData, _ := json.Marshal(payload)
	http.Post("http://localhost:8082/api/broadcast", "application/json", bytes.NewBuffer(jsonData))
}
