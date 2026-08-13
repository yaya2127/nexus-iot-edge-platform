package main

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type GatewayHub struct {
	mu         sync.Mutex
	clients    map[*websocket.Conn]bool
	broadcast  chan []byte
	upgrader   websocket.Upgrader
}

var hub = &GatewayHub{
	clients:   make(map[*websocket.Conn]bool),
	broadcast: make(chan []byte, 256),
	upgrader: websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool { return true },
	},
}

func main() {
	log.Println("==================================================================")
	log.Println("📡 NexusIoT - Real-Time WebSocket Gateway Service Starting...")
	log.Println("==================================================================")

	go hub.runBroadcaster()

	http.HandleFunc("/ws", hub.handleWebSocket)
	http.HandleFunc("/api/broadcast", hub.handleHTTPBroadcast)

	log.Println("🌐 WebSocket Gateway API listening on http://localhost:8082/ws")
	if err := http.ListenAndServe(":8082", nil); err != nil {
		log.Fatalf("Gateway server failed to start: %v", err)
	}
}

func (h *GatewayHub) runBroadcaster() {
	for {
		msg := <-h.broadcast
		h.mu.Lock()
		for client := range h.clients {
			err := client.WriteMessage(websocket.TextMessage, msg)
			if err != nil {
				client.Close()
				delete(h.clients, client)
			}
		}
		h.mu.Unlock()
	}
}

func (h *GatewayHub) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := h.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
		return
	}

	h.mu.Lock()
	h.clients[conn] = true
	h.mu.Unlock()

	log.Printf("🔌 Dashboard client connected to WebSocket. Total active: %d", len(h.clients))

	// Send initial greeting packet
	greeting, _ := json.Marshal(map[string]interface{}{
		"event":     "connected",
		"timestamp": time.Now(),
		"message":   "Connected to NexusIoT Real-Time Industrial Telemetry Stream Gateway",
	})
	conn.WriteMessage(websocket.TextMessage, greeting)

	// Keep-alive read loop
	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			h.mu.Lock()
			delete(h.clients, conn)
			h.mu.Unlock()
			conn.Close()
			log.Printf("🔌 Client disconnected. Total active: %d", len(h.clients))
			break
		}
	}
}

func (h *GatewayHub) handleHTTPBroadcast(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var buf map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&buf); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	jsonData, err := json.Marshal(buf)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	h.broadcast <- jsonData
	w.WriteHeader(http.StatusOK)
}
