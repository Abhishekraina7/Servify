// monitoring-backend.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"]
  }
});

// In-memory storage for server metrics
// For MVP, we'll just keep the latest metrics in memory
const serversStore = {
  metrics: {}, // Latest metrics for each server
  status: {},  // Connected/disconnected status
  history: {}, // Recent history (last hour) - rolling window
  config: {}   // Server configurations
};

// Maximum history items to keep per server (12 items per minute × 60 minutes = 720 items)
const MAX_HISTORY_ITEMS = 720;

// Configuration
const CONFIG = {
  apiKeys: process.env.API_KEYS ? process.env.API_KEYS.split(',') : ['default-key'],
  port: process.env.PORT || 3000,
  historyInterval: 5000 // ms between history points (to avoid storing too much data)
};

// Store a history point for a server
function storeHistoryPoint(serverId, metrics) {
  if (!serversStore.history[serverId]) {
    serversStore.history[serverId] = [];
  }
  
  // Add metrics to history with timestamp
  serversStore.history[serverId].push({
    timestamp: metrics.timestamp,
    cpu: metrics.cpu.currentLoad,
    memory: metrics.memory.usedPercent,
    disk: metrics.disk.filesystems.map(fs => ({ 
      mount: fs.mount, 
      usedPercent: fs.usedPercent 
    })),
    network: metrics.network.reduce((acc, net) => {
      acc.rxSec = (acc.rxSec || 0) + (net.rxSec || 0);
      acc.txSec = (acc.txSec || 0) + (net.txSec || 0);
      return acc;
    }, {})
  });
  
  // Trim history if it's getting too long
  if (serversStore.history[serverId].length > MAX_HISTORY_ITEMS) {
    serversStore.history[serverId].shift();
  }
}

// Socket.io namespace for agents
const agentNamespace = io.of('/agents');

agentNamespace.use((socket, next) => {
  // Simple authentication middleware
  const apiKey = socket.handshake.auth.apiKey;
  if (CONFIG.apiKeys.includes(apiKey)) {
    next();
  } else {
    next(new Error('Authentication failed'));
  }
});

agentNamespace.on('connection', (socket) => {
  const serverId = socket.handshake.auth.serverName;
  const serverGroup = socket.handshake.auth.serverGroup || 'default';
  
  console.log(`Agent connected: ${serverId} (${serverGroup})`);
  
  // Initialize server data if needed
  if (!serversStore.metrics[serverId]) {
    serversStore.metrics[serverId] = null;
    serversStore.history[serverId] = [];
  }
  
  // Update server status
  serversStore.status[serverId] = { 
    connected: true, 
    lastSeen: Date.now(),
    group: serverGroup
  };
  
  // Store server config if provided
  serversStore.config[serverId] = {
    group: serverGroup,
    ...serversStore.config[serverId]
  };
  
  // Broadcast server status to dashboards
  dashboardNamespace.emit('server_status_update', {
    serverId,
    status: serversStore.status[serverId]
  });
  
  // Handle metrics from agent
  socket.on('metrics', (metrics) => {
    // Store latest metrics
    serversStore.metrics[serverId] = metrics;
    serversStore.status[serverId].lastSeen = Date.now();
    
    // Store in history at intervals to avoid too much data
    const lastHistoryPoint = serversStore.history[serverId]?.length > 0 ? 
      serversStore.history[serverId][serversStore.history[serverId].length - 1] : null;
    
    if (!lastHistoryPoint || (metrics.timestamp - lastHistoryPoint.timestamp) >= CONFIG.historyInterval) {
      storeHistoryPoint(serverId, metrics);
    }
    
    // Forward to dashboards
    dashboardNamespace.emit('metrics_update', {
      serverId,
      metrics
    });
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Agent disconnected: ${serverId}`);
    if (serversStore.status[serverId]) {
      serversStore.status[serverId].connected = false;
      serversStore.status[serverId].lastSeen = Date.now();
      
      // Broadcast disconnection to dashboards
      dashboardNamespace.emit('server_status_update', {
        serverId,
        status: serversStore.status[serverId]
      });
    }
  });
  
  // Handle errors
  socket.on('error', (error) => {
    console.error(`Error from agent ${serverId}:`, error);
  });
  
  // Ping agent to check if it's alive
  setInterval(() => {
    if (socket.connected) {
      socket.emit('ping', { time: Date.now() });
    }
  }, 30000);
});

// Socket.io namespace for dashboards
const dashboardNamespace = io.of('/dashboard');

dashboardNamespace.on('connection', (socket) => {
  console.log('Dashboard connected');
  
  // Send initial data to the dashboard
  socket.emit('initial_data', {
    servers: Object.keys(serversStore.status).map(serverId => ({
      id: serverId,
      status: serversStore.status[serverId],
      metrics: serversStore.metrics[serverId],
      config: serversStore.config[serverId]
    }))
  });
  
  // Handle dashboard commands to agents
  socket.on('command', (data) => {
    const { serverId, command } = data;
    console.log(`Received command for ${serverId}: ${command.type}`);
    
    // Forward command to the specific agent
    agentNamespace.to(serverId).emit('command', command);
  });
  
  // Handle history request
  socket.on('get_history', (data) => {
    const { serverId, timeRange } = data;
    let history = serversStore.history[serverId] || [];
    
    // Filter by time range if specified
    if (timeRange) {
      const startTime = Date.now() - timeRange;
      history = history.filter(point => point.timestamp >= startTime);
    }
    
    socket.emit('history_data', {
      serverId,
      history
    });
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Dashboard disconnected');
  });
});

// API routes
app.get('/api/status', (req, res) => {
  res.json({
    uptime: process.uptime(),
    serverCount: Object.keys(serversStore.status).length,
    connectedCount: Object.values(serversStore.status).filter(s => s.connected).length
  });
});

// Get list of servers
app.get('/api/servers', (req, res) => {
  const servers = Object.keys(serversStore.status).map(serverId => ({
    id: serverId,
    status: serversStore.status[serverId],
    lastMetrics: serversStore.metrics[serverId] ? {
      cpu: serversStore.metrics[serverId].cpu.currentLoad,
      memory: serversStore.metrics[serverId].memory.usedPercent,
      uptime: serversStore.metrics[serverId].server.uptime
    } : null
  }));
  
  res.json(servers);
});

// Get detailed metrics for a specific server
app.get('/api/servers/:serverId', (req, res) => {
  const { serverId } = req.params;
  
  if (!serversStore.metrics[serverId]) {
    return res.status(404).json({ error: 'Server not found or no metrics available' });
  }
  
  res.json({
    status: serversStore.status[serverId],
    metrics: serversStore.metrics[serverId],
    config: serversStore.config[serverId]
  });
});

// Start the server
server.listen(CONFIG.port, () => {
  console.log(`Monitoring backend listening on port ${CONFIG.port}`);
  console.log(`Dashboard namespace: ${server.address().address}:${CONFIG.port}/dashboard`);
  console.log(`Agent namespace: ${server.address().address}:${CONFIG.port}/agents`);
});