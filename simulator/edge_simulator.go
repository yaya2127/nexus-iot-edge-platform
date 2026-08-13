package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"math/rand"
	"net/http"
	"sync"
	"time"

	"github.com/yaya2127/nexus-iot-edge-platform/services/common"
)

type EdgeDeviceSimulator struct {
	DeviceID        string
	Name            string
	Type            string
	Location        string
	BaseTemp        float64
	BaseVibe        float64
	BasePressure    float64
	BaseGas         float64
	BaseRPM         int
	InjectAnomaly   bool
	AnomalyType     string // "THERMAL", "VIBRATION", "GAS_LEAK"
	mu              sync.Mutex
}

var (
	simulatedDevices = []*EdgeDeviceSimulator{
		{
			DeviceID:     "DEV-TURBINE-01",
			Name:         "Gas Turbine Alpha-1",
			Type:         "TURBINE",
			Location:     "Facility Sector A-1",
			BaseTemp:     78.5,
			BaseVibe:     2.1,
			BasePressure: 45.0,
			BaseGas:      12.0,
			BaseRPM:      3600,
		},
		{
			DeviceID:     "DEV-GEN-02",
			Name:         "High-Output Generator Bravo-2",
			Type:         "GENERATOR",
			Location:     "Power Substation B",
			BaseTemp:     65.0,
			BaseVibe:     1.4,
			BasePressure: 32.0,
			BaseGas:      8.5,
			BaseRPM:      1800,
		},
		{
			DeviceID:     "DEV-HVAC-03",
			Name:         "Industrial Chiller HVAC-3",
			Type:         "HVAC",
			Location:     "Cooling Tower C",
			BaseTemp:     42.0,
			BaseVibe:     0.8,
			BasePressure: 60.0,
			BaseGas:      5.0,
			BaseRPM:      1200,
		},
		{
			DeviceID:     "DEV-PUMP-04",
			Name:         "Chemical Transfer Pump Delta-4",
			Type:         "PUMP",
			Location:     "Processing Plant D",
			BaseTemp:     55.0,
			BaseVibe:     4.8, // Slightly elevated baseline
			BasePressure: 85.0,
			BaseGas:      45.0,
			BaseRPM:      2400,
		},
	}

	ingestionEndpoint = "http://localhost:8081/api/v1/telemetry"
)

func (dev *EdgeDeviceSimulator) GeneratePayload(step int) common.TelemetryData {
	dev.mu.Lock()
	defer dev.mu.Unlock()

	// Sine wave oscillation for realistic physical telemetry
	sineVal := math.Sin(float64(step) * 0.1)
	noise := (rand.Float64() - 0.5) * 0.8

	temp := dev.BaseTemp + (sineVal * 3.0) + noise
	vibe := dev.BaseVibe + (math.Abs(sineVal) * 0.4) + (noise * 0.1)
	pressure := dev.BasePressure + (sineVal * 2.0)
	gas := dev.BaseGas + (rand.Float64() * 1.5)
	rpm := dev.BaseRPM + int(sineVal*25.0) + rand.Intn(10)
	isAnomaly := false

	// Inject active anomaly if triggered
	if dev.InjectAnomaly {
		isAnomaly = true
		switch dev.AnomalyType {
		case "THERMAL":
			temp += 45.0 + rand.Float64()*15.0 // Spikes above 120°C
		case "VIBRATION":
			vibe += 8.5 + rand.Float64()*4.0   // Bearing failure (>10 mm/s)
		case "GAS_LEAK":
			gas += 180.0 + rand.Float64()*50.0 // Methane hazard (>200 PPM)
		}
	}

	return common.TelemetryData{
		DeviceID:    dev.DeviceID,
		Temperature: math.Round(temp*100) / 100,
		Vibration:   math.Round(vibe*100) / 100,
		Pressure:    math.Round(pressure*100) / 100,
		GasPPM:      math.Round(gas*100) / 100,
		Voltage:     380.0 + (rand.Float64() * 4.0 - 2.0),
		RPM:         rpm,
		IsAnomaly:   isAnomaly,
		RecordedAt:  time.Now(),
	}
}

func main() {
	log.Println("==================================================================")
	log.Println("🚀 NexusIoT - Industrial Edge Hardware Simulator Node Running...")
	log.Println("==================================================================")

	// HTTP API server for remote anomaly trigger from the React Dashboard
	http.HandleFunc("/api/simulator/trigger", handleAnomalyTrigger)
	http.HandleFunc("/api/simulator/status", handleSimulatorStatus)

	go func() {
		log.Println("📡 Simulator Control API listening on http://localhost:8085")
		if err := http.ListenAndServe(":8085", nil); err != nil {
			log.Fatalf("Simulator API server failed: %v", err)
		}
	}()

	// Continuous telemetry emission loop (1 emission every 1.5 seconds)
	step := 0
	ticker := time.NewTicker(1500 * time.Millisecond)
	defer ticker.Stop()

	for range ticker.C {
		step++
		for _, dev := range simulatedDevices {
			payload := dev.GeneratePayload(step)
			go sendTelemetryToIngestion(payload)
		}
	}
}

func sendTelemetryToIngestion(data common.TelemetryData) {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return
	}

	req, err := http.NewRequest("POST", ingestionEndpoint, bytes.NewBuffer(jsonData))
	if err != nil {
		return
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 3 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		// Log locally if ingestion backend is initializing
		log.Printf("⚠️ [%s] Telemetry emitted (Ingestion service offline): Temp=%.1f°C, Vibe=%.2fmm/s",
			data.DeviceID, data.Temperature, data.Vibration)
		return
	}
	defer resp.Body.Close()
}

func handleAnomalyTrigger(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Content-Type", "application/json")

	if r.Method == "OPTIONS" {
		return
	}

	var req struct {
		DeviceID    string `json:"device_id"`
		AnomalyType string `json:"anomaly_type"`
		Active      bool   `json:"active"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	for _, dev := range simulatedDevices {
		if dev.DeviceID == req.DeviceID {
			dev.mu.Lock()
			dev.InjectAnomaly = req.Active
			dev.AnomalyType = req.AnomalyType
			dev.mu.Unlock()

			log.Printf("🚨 SIMULATOR TRIGGER: Device [%s] Anomaly [%s] set to %v",
				req.DeviceID, req.AnomalyType, req.Active)

			json.NewEncoder(w).Encode(map[string]interface{}{
				"status":    "success",
				"device_id": req.DeviceID,
				"anomaly":   req.AnomalyType,
				"active":    req.Active,
			})
			return
		}
	}

	http.Error(w, "Device not found", http.StatusNotFound)
}

func handleSimulatorStatus(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")

	devicesStatus := make([]map[string]interface{}, 0)
	for _, dev := range simulatedDevices {
		dev.mu.Lock()
		devicesStatus = append(devicesStatus, map[string]interface{}{
			"device_id":      dev.DeviceID,
			"name":           dev.Name,
			"type":           dev.Type,
			"location":       dev.Location,
			"inject_anomaly": dev.InjectAnomaly,
			"anomaly_type":   dev.AnomalyType,
		})
		dev.mu.Unlock()
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "running",
		"devices": devicesStatus,
	})
}
