"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import CpuChart from "./components/CpuChart"
import MemoryChart from "./components/MemoryChart"
import NetworkChart from "./components/NetworkChart"
import { io } from "socket.io-client"
import "./App.css"

function App() {
  const [cpuExpanded, setCpuExpanded] = useState(true)
  const [memoryExpanded, setMemoryExpanded] = useState(true)
  const [networkExpanded, setNetworkExpanded] = useState(true)

  // State for system stats
  const [systemStats, setSystemStats] = useState({
    cpu: 0,
    mem: 0,
    disk: 0,
    uptime: 0,
    cpuCores: [],
    memoryDetails: {
      total: "0 B",
      used: "0 B",
      usedPercentage: "0",
      cache: "0 B",
      swap: {
        total: "0 B",
        used: "0 B",
        usedPercentage: "0"
      }
    },
    networkDetails: {
      receiving: 0,
      sending: 0,
      totalReceived: "0 B",
      totalSent: "0 B"
    }
  })

  // Connect to socket.io server
  useEffect(() => {
    // Connect to the backend server
    const socket = io('http://localhost:5000');

    socket.on('connect', () => {
      console.log('Connected to server');
    });

    // Listen for system stats
    socket.on('stats', (data) => {
      console.log('Received stats:', data);
      setSystemStats(data);
    });

    socket.on('connect_error', (error) => {
      console.error('Connection Error:', error);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    // Cleanup function
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="container">
      <div className="card">
        <div className="section-header" onClick={() => setCpuExpanded(!cpuExpanded)}>
          {cpuExpanded ? <ChevronDown className="icon" /> : <ChevronRight className="icon" />}
          <h2 className="section-title">CPU</h2>
        </div>

        {cpuExpanded && (
          <div className="section-content">
            <div className="chart-container">
              <CpuChart systemStats={systemStats} />
            </div>
            <div className="cpu-legend">
              {systemStats.cpuCores.map((core) => (
                <div className="cpu-item" key={core.id}>
                  <div
                    className="color-box"
                    style={{
                      backgroundColor: getCpuColor(core.id)
                    }}
                  ></div>
                  <span>{core.id}</span>
                  <span className="cpu-value">{core.usage}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="section-header" onClick={() => setMemoryExpanded(!memoryExpanded)}>
          {memoryExpanded ? <ChevronDown className="icon" /> : <ChevronRight className="icon" />}
          <h2 className="section-title">Memory and Swap</h2>
        </div>

        {memoryExpanded && (
          <div className="section-content">
            <div className="chart-container">
              <MemoryChart systemStats={systemStats} />
            </div>
            <div className="memory-stats">
              <div className="memory-item">
                <div className="pie-chart memory-pie">
                  <div
                    className="pie-segment"
                    style={{
                      transform: "rotate(0deg)",
                      backgroundColor: "#ec4899"
                    }}
                  ></div>
                  <div
                    className="pie-segment"
                    style={{
                      transform: `rotate(${3.6 * systemStats.memoryDetails.usedPercentage}deg)`,
                      backgroundColor: "transparent"
                    }}
                  ></div>
                </div>
                <div className="memory-details">
                  <div>Memory</div>
                  <div>
                    {systemStats.memoryDetails.used} ({systemStats.memoryDetails.usedPercentage}%)
                    of {systemStats.memoryDetails.total}
                  </div>
                  <div>Cache {systemStats.memoryDetails.cache}</div>
                </div>
              </div>
              <div className="memory-item">
                <div className="pie-chart swap-pie">
                  <div
                    className="pie-segment"
                    style={{
                      transform: "rotate(0deg)",
                      backgroundColor: "#22c55e"
                    }}
                  ></div>
                  <div
                    className="pie-segment"
                    style={{
                      transform: `rotate(${3.6 * systemStats.memoryDetails.swap.usedPercentage}deg)`,
                      backgroundColor: "transparent"
                    }}
                  ></div>
                </div>
                <div className="memory-details">
                  <div>Swap</div>
                  <div>
                    {systemStats.memoryDetails.swap.used} ({systemStats.memoryDetails.swap.usedPercentage}%)
                    of {systemStats.memoryDetails.swap.total}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="section-header" onClick={() => setNetworkExpanded(!networkExpanded)}>
          {networkExpanded ? <ChevronDown className="icon" /> : <ChevronRight className="icon" />}
          <h2 className="section-title">Network</h2>
        </div>

        {networkExpanded && (
          <div className="section-content">
            <div className="chart-container">
              <NetworkChart systemStats={systemStats} />
            </div>
            <div className="network-stats">
              <div className="network-item">
                <div className="network-icon receiving">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="network-details">
                  <div>Receiving</div>
                  <div>{formatBytes(systemStats.networkDetails.receiving)}/s</div>
                  <div>Total Received {systemStats.networkDetails.totalReceived}</div>
                </div>
              </div>
              <div className="network-item">
                <div className="network-icon sending">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="network-details">
                  <div>Sending</div>
                  <div>{formatBytes(systemStats.networkDetails.sending)}/s</div>
                  <div>Total Sent {systemStats.networkDetails.totalSent}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Helper function to get color for CPU cores
function getCpuColor(cpuId) {
  const colors = {
    "CPU1": "#ef4444", // red
    "CPU2": "#f97316", // orange
    "CPU3": "#eab308", // yellow
    "CPU4": "#84cc16", // lime
    "CPU5": "#ec4899", // pink
    "CPU6": "#06b6d4", // cyan
    "CPU7": "#3b82f6", // blue
    "CPU8": "#6366f1", // indigo
    "CPU9": "#9333ea", // purple
    "CPU10": "#f472b6", // pink
    "CPU11": "#9ca3af", // gray
    "CPU12": "#8b5cf6", // violet
  };

  return colors[cpuId] || "#9ca3af"; // default to gray
}

// Helper function to format bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default App