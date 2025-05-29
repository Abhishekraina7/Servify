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
  logPath: process.env.LOG_PATH || path.join(__dirname, 'backend.log'),
  alerts: {
    cpu: {
      high: 90,    // CPU usage above 90% = high alert
      medium: 75,  // CPU usage above 75% = medium alert
      low: 60      // CPU usage above 60% = low alert
    },
    memory: {
      high: 85,    // Memory usage above 85% = high alert
      medium: 70,  // Memory usage above 70% = medium alert
      low: 60      // Memory usage above 60% = low alert
    },
    disk: {
      high: 90,    // Disk usage above 90% = high alert
      medium: 80,  // Disk usage above 80% = medium alert
      low: 70      // Disk usage above 70% = low alert
    }
  }
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

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Listen for message from client
  socket.on("client-message", (data) => {
    console.log("Message from client:", data);

    // Optional: Send a reply back to that client
    socket.emit("server-reply", `Hello client, I received your message: ${data}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

//serve a static HTML on the client when connection is established
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

log("Initializing monitoring backend server");

// In-memory storage for server metrics
const serversStore = {
  metrics: {}, // Latest metrics for each server
  status: {},  // Connected/disconnected status
  history: {}, // Recent history (last hour) - rolling window
  config: {},  // Server configurations
  alerts: {}   // Active alerts for each server
};

// Maximum history items to keep per server (12 items per minute × 60 minutes = 720 items)
const MAX_HISTORY_ITEMS = 720;

// Alert generation and management
function generateAlerts(serverId, metrics) {
  const currentAlerts = [];
  const timestamp = Date.now();

  // Check CPU alerts
  const cpuUsage = metrics.cpu.currentLoad;
  if (cpuUsage >= CONFIG.alerts.cpu.high) {
    currentAlerts.push({
      id: `${serverId}-cpu-${timestamp}`,
      serverId,
      type: 'cpu',
      severity: 'high',
      message: `Server CPU usage at ${cpuUsage.toFixed(1)}% (Critical threshold: ${CONFIG.alerts.cpu.high}%)`,
      value: cpuUsage,
      threshold: CONFIG.alerts.cpu.high,
      timestamp,
      acknowledged: false
    });
  } else if (cpuUsage >= CONFIG.alerts.cpu.medium) {
    currentAlerts.push({
      id: `${serverId}-cpu-${timestamp}`,
      serverId,
      type: 'cpu',
      severity: 'medium',
      message: `Server CPU usage at ${cpuUsage.toFixed(1)}% (Warning threshold: ${CONFIG.alerts.cpu.medium}%)`,
      value: cpuUsage,
      threshold: CONFIG.alerts.cpu.medium,
      timestamp,
      acknowledged: false
    });
  } else if (cpuUsage >= CONFIG.alerts.cpu.low) {
    currentAlerts.push({
      id: `${serverId}-cpu-${timestamp}`,
      serverId,
      type: 'cpu',
      severity: 'low',
      message: `Server CPU usage at ${cpuUsage.toFixed(1)}% (Info threshold: ${CONFIG.alerts.cpu.low}%)`,
      value: cpuUsage,
      threshold: CONFIG.alerts.cpu.low,
      timestamp,
      acknowledged: false
    });
  }

  // Check Memory alerts
  const memoryUsage = metrics.memory.usedPercent;
  if (memoryUsage >= CONFIG.alerts.memory.high) {
    currentAlerts.push({
      id: `${serverId}-memory-${timestamp}`,
      serverId,
      type: 'memory',
      severity: 'high',
      message: `Server memory usage at ${memoryUsage.toFixed(1)}% (Critical threshold: ${CONFIG.alerts.memory.high}%)`,
      value: memoryUsage,
      threshold: CONFIG.alerts.memory.high,
      timestamp,
      acknowledged: false
    });
  } else if (memoryUsage >= CONFIG.alerts.memory.medium) {
    currentAlerts.push({
      id: `${serverId}-memory-${timestamp}`,
      serverId,
      type: 'memory',
      severity: 'medium',
      message: `Server memory usage at ${memoryUsage.toFixed(1)}% (Warning threshold: ${CONFIG.alerts.memory.medium}%)`,
      value: memoryUsage,
      threshold: CONFIG.alerts.memory.medium,
      timestamp,
      acknowledged: false
    });
  } else if (memoryUsage >= CONFIG.alerts.memory.low) {
    currentAlerts.push({
      id: `${serverId}-memory-${timestamp}`,
      serverId,
      type: 'memory',
      severity: 'low',
      message: `Server memory usage at ${memoryUsage.toFixed(1)}% (Info threshold: ${CONFIG.alerts.memory.low}%)`,
      value: memoryUsage,
      threshold: CONFIG.alerts.memory.low,
      timestamp,
      acknowledged: false
    });
  }

  // Check Disk alerts
  if (metrics.disk && metrics.disk.filesystems) {
    metrics.disk.filesystems.forEach((filesystem, index) => {
      const diskUsage = filesystem.usedPercent;
      if (diskUsage >= CONFIG.alerts.disk.high) {
        currentAlerts.push({
          id: `${serverId}-disk-${filesystem.mount}-${timestamp}`,
          serverId,
          type: 'disk',
          severity: 'high',
          message: `Disk usage on ${filesystem.mount} at ${diskUsage.toFixed(1)}% (Critical threshold: ${CONFIG.alerts.disk.high}%)`,
          value: diskUsage,
          threshold: CONFIG.alerts.disk.high,
          mount: filesystem.mount,
          timestamp,
          acknowledged: false
        });
      } else if (diskUsage >= CONFIG.alerts.disk.medium) {
        currentAlerts.push({
          id: `${serverId}-disk-${filesystem.mount}-${timestamp}`,
          serverId,
          type: 'disk',
          severity: 'medium',
          message: `Disk usage on ${filesystem.mount} at ${diskUsage.toFixed(1)}% (Warning threshold: ${CONFIG.alerts.disk.medium}%)`,
          value: diskUsage,
          threshold: CONFIG.alerts.disk.medium,
          mount: filesystem.mount,
          timestamp,
          acknowledged: false
        });
      } else if (diskUsage >= CONFIG.alerts.disk.low) {
        currentAlerts.push({
          id: `${serverId}-disk-${filesystem.mount}-${timestamp}`,
          serverId,
          type: 'disk',
          severity: 'low',
          message: `Disk usage on ${filesystem.mount} at ${diskUsage.toFixed(1)}% (Info threshold: ${CONFIG.alerts.disk.low}%)`,
          value: diskUsage,
          threshold: CONFIG.alerts.disk.low,
          mount: filesystem.mount,
          timestamp,
          acknowledged: false
        });
      }
    });
  }

  return currentAlerts;
}

// Update server alerts
function updateServerAlerts(serverId, newAlerts) {
  if (!serversStore.alerts[serverId]) {
    serversStore.alerts[serverId] = [];
  }

  // Remove old alerts of the same type (to avoid duplicates)
  const alertTypes = new Set(newAlerts.map(alert => `${alert.type}-${alert.mount || ''}`));
  serversStore.alerts[serverId] = serversStore.alerts[serverId].filter(alert =>
    !alertTypes.has(`${alert.type}-${alert.mount || ''}`) || alert.acknowledged
  );

  // Add new alerts
  serversStore.alerts[serverId].push(...newAlerts);

  // Log new alerts
  if (newAlerts.length > 0) {
    log(`Generated ${newAlerts.length} alerts for server ${serverId}`);
    newAlerts.forEach(alert => {
      log(`Alert [${alert.severity.toUpperCase()}] ${serverId}: ${alert.message}`, 'ALERT');
    });
  }

  return serversStore.alerts[serverId];
}

// Get all active alerts across all servers
function getAllActiveAlerts() {
  const allAlerts = [];
  Object.keys(serversStore.alerts).forEach(serverId => {
    const serverAlerts = serversStore.alerts[serverId] || [];
    serverAlerts.forEach(alert => {
      if (!alert.acknowledged) {
        allAlerts.push({
          ...alert,
          server: serverId,
          timeAgo: getTimeAgo(alert.timestamp)
        });
      }
    });
  });

  // Sort by severity (high -> medium -> low) and then by timestamp (newest first)
  const severityOrder = { high: 3, medium: 2, low: 1 };
  return allAlerts.sort((a, b) => {
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[b.severity] - severityOrder[a.severity];
    }
    return b.timestamp - a.timestamp;
  });
}

// Helper function to get time ago string
function getTimeAgo(timestamp) {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffMins > 0) {
    return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
}

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
    serversStore.alerts[serverId] = [];
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

    // Generate and update alerts based on metrics
    const newAlerts = generateAlerts(serverId, metrics);
    const allServerAlerts = updateServerAlerts(serverId, newAlerts);

    // Store in history at intervals to avoid too much data
    const lastHistoryPoint = serversStore.history[serverId]?.length > 0 ?
      serversStore.history[serverId][serversStore.history[serverId].length - 1] : null;

    if (!lastHistoryPoint || (metrics.timestamp - lastHistoryPoint.timestamp) >= CONFIG.historyInterval) {
      storeHistoryPoint(serverId, metrics);
    }

    // Forward to dashboards with alerts
    dashboardNamespace.emit('metrics_update', {
      serverId,
      metrics,
      alerts: allServerAlerts
    });
    log(`Forwarded metrics for ${serverId} to all dashboards`);

    // Send alerts update specifically
    if (newAlerts.length > 0) {
      dashboardNamespace.emit('alerts_update', {
        serverId,
        alerts: newAlerts,
        allAlerts: getAllActiveAlerts()
      });
      log(`Sent ${newAlerts.length} new alerts for ${serverId} to all dashboards`);
    }
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
      config: serversStore.config[serverId],
      alerts: serversStore.alerts[serverId] || []
    })),
    allAlerts: getAllActiveAlerts()
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

  // Handle alert acknowledgment
  socket.on('acknowledge_alert', (data) => {
    const { alertId, serverId } = data;
    log(`Alert acknowledgment request: ${alertId} for server ${serverId}`);

    if (serversStore.alerts[serverId]) {
      const alert = serversStore.alerts[serverId].find(a => a.id === alertId);
      if (alert) {
        alert.acknowledged = true;
        alert.acknowledgedAt = Date.now();
        log(`Alert ${alertId} acknowledged for server ${serverId}`);

        // Broadcast alert update
        dashboardNamespace.emit('alert_acknowledged', {
          alertId,
          serverId,
          allAlerts: getAllActiveAlerts()
        });
      }
    }
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
    connectedCount: Object.values(serversStore.status).filter(s => s.connected).length,
    totalAlerts: getAllActiveAlerts().length
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
    } : null,
    alertCount: (serversStore.alerts[serverId] || []).filter(a => !a.acknowledged).length
  }));

  res.json(servers);
  log(`Responded with list of ${servers.length} servers`);
  logData(`Servers list sample`, servers.slice(0, 2));
});

// Get all active alerts
app.get('/api/alerts', (req, res) => {
  log(`API request: GET /api/alerts from ${req.ip}`);

  const alerts = getAllActiveAlerts();

  res.json({
    total: alerts.length,
    alerts: alerts
  });
  log(`Responded with ${alerts.length} active alerts`);
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
    config: serversStore.config[serverId],
    alerts: serversStore.alerts[serverId] || []
  };

  res.json(serverData);
  log(`Responded with detailed metrics for server ${serverId}`);
  logData(`Server ${serverId} detailed metrics`, {
    cpu: serverData.metrics.cpu.currentLoad,
    memory: serverData.metrics.memory.usedPercent,
    uptime: serverData.metrics.server.uptime,
    alertCount: serverData.alerts.filter(a => !a.acknowledged).length
  });
});

// Add this to your existing API routes
app.post('/api/alerts/:id/acknowledge', (req, res) => {
  const alertId = req.params.id;
  // Update the alert status in your alerts store
  Object.keys(serversStore.alerts).forEach(serverId => {
    serversStore.alerts[serverId] = serversStore.alerts[serverId].map(alert => {
      if (alert.id === alertId) {
        return { ...alert, acknowledged: true };
      }
      return alert;
    });
  });
  res.json({ success: true });
});

// Start the server and listen on all port
server.listen(CONFIG.port, '0.0.0.0', () => {
  log(`Monitoring backend listening on port ${CONFIG.port}`, 'INFO');
  log(`Dashboard namespace: ${server.address().address || 'localhost'}:${CONFIG.port}/dashboard`);
  log(`Agent namespace: ${server.address().address || 'localhost'}:${CONFIG.port}/agents`);
});