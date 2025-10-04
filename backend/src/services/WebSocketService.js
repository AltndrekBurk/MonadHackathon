/**
 * @file services/WebSocketService.js
 * @description WebSocket service for real-time communication
 */

export class WebSocketService {
  constructor() {
    this.clients = new Set();
    this.heartbeatInterval = null;
    this.startHeartbeat();
  }

  addClient(ws) {
    this.clients.add(ws);
    console.log(`📊 Total clients: ${this.clients.size}`);
  }

  removeClient(ws) {
    this.clients.delete(ws);
    console.log(`📊 Total clients: ${this.clients.size}`);
  }

  broadcast(message) {
    const messageStr = JSON.stringify(message);
    let sentCount = 0;
    
    this.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        try {
          client.send(messageStr);
          sentCount++;
        } catch (error) {
          console.error('Failed to send message to client:', error);
          this.clients.delete(client);
        }
      }
    });
    
    if (sentCount > 0) {
      console.log(`📡 Broadcasted to ${sentCount} clients`);
    }
  }

  sendToClient(ws, message) {
    if (ws && ws.readyState === 1) {
      try {
        ws.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error('Failed to send message to specific client:', error);
        this.clients.delete(ws);
        return false;
      }
    }
    return false;
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.broadcast({
        type: 'heartbeat',
        timestamp: Date.now(),
        clients: this.clients.size
      });
    }, 30000); // 30 seconds
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  getClientCount() {
    return this.clients.size;
  }

  getConnectedClients() {
    return Array.from(this.clients).filter(ws => ws.readyState === 1);
  }

  closeAllConnections() {
    this.clients.forEach(client => {
      if (client.readyState === 1) {
        client.close(1000, 'Server shutting down');
      }
    });
    this.clients.clear();
  }
}
