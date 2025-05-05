// monitoring-backend.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Configuration
const CONFIG = {
  apiKeys: process.env.API_KEYS ? process.env.API_KEYS.split(',') : ['default-key'],
  port: process.env.PORT || 3000,
  historyInterval: 5000, // ms between history points (to avoid storing too much data)
  logPath: process.env.LOG_PATH || path.join(__dirname, 'backend.log')
};

// Logging function
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${level} - ${message}\n`;
  console.log(logMessage.trim());
  fs.appendFileSync(CONFIG.logPath, logMessage);
}

// Log important data
function logData(context, data) {
  log(`${context}: ${JSON.stringify(data, null, 2)}`, 'DATA');
}

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"]
  }
});

//serve a static HTML on the client when connection is established
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});


log("Initializing monitoring backend server");

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

// Store a history point for a server
function storeHistoryPoint(serverId, metrics) {
  if (!serversStore.history[serverId]) {
    serversStore.history[serverId] = [];
  }

  // Add metrics to history with timestamp
  const historyPoint = {
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
  };

  serversStore.history[serverId].push(historyPoint);
  log(`History point stored for ${serverId}`);

  // Trim history if it's getting too long
  if (serversStore.history[serverId].length > MAX_HISTORY_ITEMS) {
    serversStore.history[serverId].shift();
    log(`History trimmed for ${serverId}, now at ${serversStore.history[serverId].length} points`);
  }
}

// Socket.io namespace for agents
const agentNamespace = io.of('/agents');

agentNamespace.use((socket, next) => {
  // Simple authentication middleware
  const apiKey = socket.handshake.auth.apiKey;
  if (CONFIG.apiKeys.includes(apiKey)) {
    log(`Authentication successful for client ${socket.id}`);
    next();
  } else {
    log(`Authentication failed for client ${socket.id}`, 'ERROR');
    next(new Error('Authentication failed'));
  }
});

agentNamespace.on('connection', (socket) => {
  const serverId = socket.handshake.auth.serverName;
  const serverGroup = socket.handshake.auth.serverGroup || 'default';

  log(`Agent connected: ${serverId} (${serverGroup}) with socket ID: ${socket.id}`);

  // Initialize server data if needed
  if (!serversStore.metrics[serverId]) {
    serversStore.metrics[serverId] = null;
    serversStore.history[serverId] = [];
    log(`Initialized data structures for new server: ${serverId}`);
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

  log(`Updated status and config for server: ${serverId}`);

  // Broadcast server status to dashboards
  dashboardNamespace.emit('server_status_update', {
    serverId,
    status: serversStore.status[serverId]
  });
  log(`Broadcast status update for ${serverId} to all dashboards`);

  // Handle metrics from agent
  socket.on('metrics', (metrics) => {
    log(`Received metrics from ${serverId}`);
    logData(`Metrics from ${serverId}`, metrics);

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
    log(`Forwarded metrics for ${serverId} to all dashboards`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    log(`Agent disconnected: ${serverId}`);
    if (serversStore.status[serverId]) {
      serversStore.status[serverId].connected = false;
      serversStore.status[serverId].lastSeen = Date.now();

      // Broadcast disconnection to dashboards
      dashboardNamespace.emit('server_status_update', {
        serverId,
        status: serversStore.status[serverId]
      });
      log(`Broadcast disconnection of ${serverId} to all dashboards`);
    }
  });

  // Handle errors
  socket.on('error', (error) => {
    log(`Error from agent ${serverId}: ${error}`, 'ERROR');
  });

  // Ping agent to check if it's alive
  setInterval(() => {
    if (socket.connected) {
      socket.emit('ping', { time: Date.now() });
      log(`Pinged agent ${serverId}`, 'DEBUG');
    }
  }, 30000);
});

// Socket.io namespace for dashboards
const dashboardNamespace = io.of('/dashboard');

dashboardNamespace.on('connection', (socket) => {
  log(`Dashboard connected with socket ID: ${socket.id}`);

  // Send initial data to the dashboard
  const initialData = {
    servers: Object.keys(serversStore.status).map(serverId => ({
      id: serverId,
      status: serversStore.status[serverId],
      metrics: serversStore.metrics[serverId],
      config: serversStore.config[serverId]
    }))
  };

  socket.emit('initial_data', initialData);
  log(`Sent initial data to dashboard ${socket.id}`);
  logData(`Initial dashboard data`, initialData);

  // Handle dashboard commands to agents
  socket.on('command', (data) => {
    const { serverId, command } = data;
    log(`Received command for ${serverId}: ${command.type} from dashboard ${socket.id}`);
    logData(`Command details`, command);

    // Forward command to the specific agent
    agentNamespace.to(serverId).emit('command', command);
    log(`Forwarded command to agent ${serverId}`);
  });

  // Handle history request
  socket.on('get_history', (data) => {
    const { serverId, timeRange } = data;
    log(`History request for ${serverId} with timeRange ${timeRange} from dashboard ${socket.id}`);

    let history = serversStore.history[serverId] || [];

    // Filter by time range if specified
    if (timeRange) {
      const startTime = Date.now() - timeRange;
      history = history.filter(point => point.timestamp >= startTime);
      log(`Filtered history to ${history.length} points for timeRange ${timeRange}`);
    }

    const historyData = {
      serverId,
      history
    };

    socket.emit('history_data', historyData);
    log(`Sent history data for ${serverId} to dashboard ${socket.id}`);
    logData(`History data sample (first 2 points)`, history.slice(0, 2));
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    log(`Dashboard disconnected: ${socket.id}`);
  });
});

// API routes
app.get('/api/status', (req, res) => {
  log(`API request: GET /api/status from ${req.ip}`);

  const statusData = {
    uptime: process.uptime(),
    serverCount: Object.keys(serversStore.status).length,
    connectedCount: Object.values(serversStore.status).filter(s => s.connected).length
  };

  res.json(statusData);
  log(`Responded to status request`);
  logData(`Status response`, statusData);
});

// Get list of servers
app.get('/api/servers', (req, res) => {
  log(`API request: GET /api/servers from ${req.ip}`);

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
  log(`Responded with list of ${servers.length} servers`);
  logData(`Servers list sample`, servers.slice(0, 2));
});

// Get detailed metrics for a specific server
app.get('/api/servers/:serverId', (req, res) => {
  const { serverId } = req.params;
  log(`API request: GET /api/servers/${serverId} from ${req.ip}`);

  if (!serversStore.metrics[serverId]) {
    log(`Server not found or no metrics available: ${serverId}`, 'WARN');
    return res.status(404).json({ error: 'Server not found or no metrics available' });
  }

  const serverData = {
    status: serversStore.status[serverId],
    metrics: serversStore.metrics[serverId],
    config: serversStore.config[serverId]
  };

  res.json(serverData);
  log(`Responded with detailed metrics for server ${serverId}`);
  logData(`Server ${serverId} detailed metrics`, {
    cpu: serverData.metrics.cpu.currentLoad,
    memory: serverData.metrics.memory.usedPercent,
    uptime: serverData.metrics.server.uptime
  });
});

// Start the server
server.listen(CONFIG.port, () => {
  log(`Monitoring backend listening on port ${CONFIG.port}`, 'INFO');
  log(`Dashboard namespace: ${server.address().address || 'localhost'}:${CONFIG.port}/dashboard`);
  log(`Agent namespace: ${server.address().address || 'localhost'}:${CONFIG.port}/agents`);
});