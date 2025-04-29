// server-monitoring-agent.js
const si = require('systeminformation');
const io = require('socket.io-client');
const os = require('os');
const fs = require('fs');
const path = require('path');

// Configuration (can be moved to a config file)
const CONFIG = {
  serverName: process.env.SERVER_NAME || os.hostname(),
  serverGroup: process.env.SERVER_GROUP || 'production',
  backendUrl: process.env.BACKEND_URL || 'ws://localhost:3000/agents',
  apiKey: process.env.API_KEY || 'default-key',
  interval: process.env.COLLECTION_INTERVAL ? parseInt(process.env.COLLECTION_INTERVAL) : 2000,
  logPath: process.env.LOG_PATH || path.join(__dirname, 'agent.log')
};

// Simple logging
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${message}\n`;
  console.log(logMessage.trim());
  fs.appendFileSync(CONFIG.logPath, logMessage);
}

// Initialize WebSocket connection
log(`Initializing agent for server: ${CONFIG.serverName}`);
const socket = io(CONFIG.backendUrl, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: Infinity,
  auth: {
    apiKey: CONFIG.apiKey,
    serverName: CONFIG.serverName,
    serverGroup: CONFIG.serverGroup
  }
});

// Connection status handling
socket.on('connect', () => {
  log(`Connected to monitoring backend at ${CONFIG.backendUrl}`);
  startMetricsCollection();
});

socket.on('disconnect', (reason) => {
  log(`Disconnected from backend: ${reason}`);
});

socket.on('error', (error) => {
  log(`Socket error: ${error}`);
});

socket.on('reconnect', (attemptNumber) => {
  log(`Reconnected to backend after ${attemptNumber} attempts`);
});

// Handle server commands
socket.on('command', async (command) => {
  log(`Received command: ${command.type}`);

  switch (command.type) {
    case 'collect_now':
      // Immediately collect and send metrics
      sendMetrics();
      break;
    case 'update_config':
      // Update configuration
      Object.assign(CONFIG, command.config);
      log(`Configuration updated: ${JSON.stringify(command.config)}`);
      break;
    case 'restart_agent':
      // In a production scenario, you'd use a process manager like PM2
      log('Restart command received - would restart in production setup');
      break;
    default:
      log(`Unknown command: ${command.type}`);
  }
});

// Metrics collection function
async function collectMetrics() {
  try {
    // Collect basic system information
    const [cpu, mem, disksIO, netStats, fsSize, processes, osInfo, uptime] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.disksIO().catch(err => {
        log(`Error getting disks IO: ${err.message}`);
        return null;
      }),
      si.networkStats(),
      si.fsSize(),
      si.processes(),
      si.osInfo(),
      si.time().uptime
    ]);

    // Get top 5 CPU-consuming processes
    const topProcesses = processes.list
      .sort((a, b) => b.cpu - a.cpu)
      .slice(0, 5)
      .map(p => ({
        name: p.name,
        pid: p.pid,
        cpu: p.cpu,
        mem: p.mem
      }));

    // Format network stats
    const network = netStats.map(n => ({
      interface: n.iface,
      rxBytes: n.rx_bytes,
      txBytes: n.tx_bytes,
      rxSec: n.rx_sec,
      txSec: n.tx_sec
    }));

    // Prepare the disk IO data with null checks
    const diskIO = disksIO ? {
      readIO: disksIO.rIO !== undefined ? disksIO.rIO : 0,
      writeIO: disksIO.wIO !== undefined ? disksIO.wIO : 0,
      readSpeed: disksIO.rIO_sec !== undefined ? disksIO.rIO_sec : 0,
      writeSpeed: disksIO.wIO_sec !== undefined ? disksIO.wIO_sec : 0
    } : {
      readIO: 0,
      writeIO: 0,
      readSpeed: 0,
      writeSpeed: 0
    };

    // Prepare the metrics payload
    return {
      timestamp: Date.now(),
      server: {
        id: CONFIG.serverName,
        group: CONFIG.serverGroup,
        os: {
          platform: osInfo.platform,
          distro: osInfo.distro,
          release: osInfo.release,
          arch: osInfo.arch
        },
        uptime: uptime
      },
      cpu: {
        currentLoad: cpu.currentLoad,
        coreLoads: cpu.cpus.map(core => core.load),
        avgLoad: os.loadavg()
      },
      memory: {
        total: mem.total,
        used: mem.used,
        free: mem.free,
        usedPercent: (mem.used / mem.total) * 100
      },
      disk: {
        io: diskIO,
        filesystems: fsSize.map(fs => ({
          fs: fs.fs,
          type: fs.type,
          size: fs.size,
          used: fs.used,
          mount: fs.mount,
          usedPercent: fs.use
        }))
      },
      network,
      topProcesses
    };
  } catch (error) {
    log(`Error collecting metrics: ${error.message}`);
    return null;
  }
}

// Send metrics to the backend
async function sendMetrics() {
  try {
    const metrics = await collectMetrics();
    if (metrics) {
      socket.emit('metrics', metrics);
      log(`Metrics sent successfully at ${new Date().toISOString()}`);
    }
  } catch (error) {
    log(`Failed to send metrics: ${error.message}`);
  }
}

// Start the metrics collection interval
function startMetricsCollection() {
  // Initial collection
  sendMetrics();

  // Set up interval for regular collection
  setInterval(sendMetrics, CONFIG.interval);
  log(`Metrics collection started, interval: ${CONFIG.interval}ms`);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('Agent shutting down...');
  socket.disconnect();
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  log(`Uncaught exception: ${error.message}`);
  log(error.stack);
});

// Start connection
log('Agent starting up...');