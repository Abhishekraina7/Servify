// install-service.js
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// Detect operating system
const isWindows = os.platform() === 'win32';
const isLinux = os.platform() === 'linux';
const isMac = os.platform() === 'darwin';

// Create a config file
function createConfigFile() {
  const configPath = path.join(__dirname, 'config.env');
  const hostname = os.hostname();
  
  const configTemplate = `
# Server Monitoring Agent Configuration
SERVER_NAME=${hostname}
SERVER_GROUP=production
BACKEND_URL=ws://your-backend-server:3000
API_KEY=change-this-to-your-api-key
COLLECTION_INTERVAL=5000
LOG_PATH=${path.join(__dirname, 'agent.log').replace(/\\/g, '/')}
`;

  fs.writeFileSync(configPath, configTemplate.trim());
  console.log(`Created config file at: ${configPath}`);
  console.log('Please edit this file with your actual backend URL and API key.');
}

// Windows service installation
function installWindowsService() {
  try {
    // Check if node-windows is installed
    try {
      require.resolve('node-windows');
    } catch (e) {
      console.log('Installing node-windows package...');
      execSync('npm install node-windows --save-dev', { stdio: 'inherit' });
    }

    // Create service installer script
    const serviceScript = `
const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
  name: 'ServerMonitoringAgent',
  description: 'Server metrics monitoring agent',
  script: path.join('${__dirname.replace(/\\/g, '\\\\')}', 'server-monitoring-agent.js'),
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
`;

    fs.writeFileSync(path.join(__dirname, 'install-windows-service.js'), serviceScript);
    console.log('Created Windows service installer script.');
    console.log('To install as a Windows service, run: node install-windows-service.js');
    
  } catch (error) {
    console.error('Failed to set up Windows service script:', error);
  }
}

// Linux systemd service installation
function installLinuxService() {
  try {
    // Create systemd service file
    const serviceFile = `
[Unit]
Description=Server Monitoring Agent
After=network.target

[Service]
ExecStart=/usr/bin/node ${path.join(__dirname, 'server-monitoring-agent.js')}
Restart=always
User=${process.env.USER || 'root'}
Environment=NODE_ENV=production
EnvironmentFile=${path.join(__dirname, 'config.env')}
WorkingDirectory=${__dirname}

[Install]
WantedBy=multi-user.target
`;

    const serviceFilePath = path.join(__dirname, 'server-monitoring-agent.service');
    fs.writeFileSync(serviceFilePath, serviceFile.trim());
    
    console.log(`Created systemd service file at: ${serviceFilePath}`);
    console.log('To install the service, run these commands as root:');
    console.log(`sudo cp ${serviceFilePath} /etc/systemd/system/`);
    console.log('sudo systemctl daemon-reload');
    console.log('sudo systemctl enable server-monitoring-agent');
    console.log('sudo systemctl start server-monitoring-agent');
    
  } catch (error) {
    console.error('Failed to create Linux service file:', error);
  }
}

// MacOS launchd service installation
function installMacService() {
  try {
    // Create launchd plist file
    const plistFile = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.monitor.agent</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/node</string>
    <string>${path.join(__dirname, 'server-monitoring-agent.js')}</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardErrorPath</key>
  <string>${path.join(__dirname, 'agent-error.log')}</string>
  <key>StandardOutPath</key>
  <string>${path.join(__dirname, 'agent-output.log')}</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>NODE_ENV</key>
    <string>production</string>
  </dict>
  <key>WorkingDirectory</key>
  <string>${__dirname}</string>
</dict>
</plist>`;

    const plistPath = path.join(__dirname, 'com.monitor.agent.plist');
    fs.writeFileSync(plistPath, plistFile);
    
    console.log(`Created macOS service file at: ${plistPath}`);
    console.log('To install the service, run:');
    console.log(`cp ${plistPath} ~/Library/LaunchAgents/`);
    console.log('launchctl load ~/Library/LaunchAgents/com.monitor.agent.plist');
    
  } catch (error) {
    console.error('Failed to create macOS service file:', error);
  }
}

// Main installation flow
function install() {
  console.log('Setting up server monitoring agent...');
  
  // Create configuration file
  createConfigFile();
  
  // Install as a service based on OS
  if (isWindows) {
    installWindowsService();
  } else if (isLinux) {
    installLinuxService();
  } else if (isMac) {
    installMacService();
  } else {
    console.log('Automatic service installation not supported for this OS.');
    console.log('You can manually start the agent by running: node server-monitoring-agent.js');
  }
  
  console.log('\nSetup complete!');
}

// Run the installation
install();