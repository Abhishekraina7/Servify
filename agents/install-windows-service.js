
const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
  name: 'ServerMonitoringAgent',
  description: 'Server metrics monitoring agent',
  script: path.join('C:\\Server Monitoring System\\Servify\\agents', 'server-monitoring-agent.js'),
  env: {
    name: "NODE_ENV",
    value: "production"
  }
});

// Listen for service events
svc.on('install', function() {
  svc.start();
  console.log('Service installed and started.');
});

svc.on('error', function(err) {
  console.error('Service error:', err);
});

// Install the service
svc.install();
