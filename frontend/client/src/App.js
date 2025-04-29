"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronRight, Layers, Server, RefreshCw } from "lucide-react"
import CpuChart from "./components/CpuChart"
import MemoryChart from "./components/MemoryChart"
import NetworkChart from "./components/NetworkChart"
import Navbar from "./components/Navbar"
import AiChat from "./components/AiChat"
import { io } from "socket.io-client"
import "./App.css"

function App() {
  const [cpuExpanded, setCpuExpanded] = useState(true)
  const [memoryExpanded, setMemoryExpanded] = useState(true)
  const [networkExpanded, setNetworkExpanded] = useState(true)
  const [serverListExpanded, setServerListExpanded] = useState(true)

  // State for selected server
  const [selectedServer, setSelectedServer] = useState(null)

  // State for server list
  const [servers, setServers] = useState([])

  // State for system stats
  const [systemStats, setSystemStats] = useState({
    cpu: {
      currentLoad: 0,
      cores: [],
    },
    memory: {
      total: 0,
      used: 0,
      usedPercent: 0,
      cache: 0,
      swap: {
        total: 0,
        used: 0,
        usedPercent: 0,
      },
    },
    disk: {
      filesystems: [],
    },
    network: [],
    server: {
      uptime: 0,
    },
  })

  // Connect to socket.io server
  useEffect(() => {
    // Connect to the backend server's dashboard namespace
    const socket = io("http://localhost:3000/dashboard")

    socket.on("connect", () => {
      console.log("Connected to server dashboard namespace")

      // Request initial data after connection
      fetch("http://localhost:3000/api/servers")
        .then((response) => response.json())
        .then((data) => {
          setServers(data)
          if (data.length > 0) {
            setSelectedServer(data[0].id)
          }
        })
        .catch((error) => console.error("Error fetching servers:", error))
    })

    // Listen for initial data
    socket.on("initial_data", (data) => {
      console.log("Received initial data:", data)
      setServers(data.servers)
      if (data.servers.length > 0 && !selectedServer) {
        setSelectedServer(data.servers[0].id)
      }
    })

    // Listen for metrics updates
    socket.on("metrics_update", (data) => {
      console.log("Received metrics update:", data)
      if (data.serverId === selectedServer) {
        setSystemStats(data.metrics)
      }
    })

    // Listen for server status updates
    socket.on("server_status_update", (data) => {
      setServers((prevServers) => {
        return prevServers.map((server) => {
          if (server.id === data.serverId) {
            return {
              ...server,
              status: data.status,
            }
          }
          return server
        })
      })
    })

    socket.on("connect_error", (error) => {
      console.error("Connection Error:", error)
    })

    socket.on("disconnect", () => {
      console.log("Disconnected from server")
    })

    // Cleanup function
    return () => {
      socket.disconnect()
    }
  }, [selectedServer]) // Add selectedServer as dependency

  // Effect to request specific server data when selected server changes
  useEffect(() => {
    if (selectedServer) {
      fetch(`http://localhost:3000/api/servers/${selectedServer}`)
        .then((response) => response.json())
        .then((data) => {
          setSystemStats(data.metrics || systemStats)
        })
        .catch((error) => console.error(`Error fetching server data for ${selectedServer}:`, error))
    }
  }, [selectedServer])

  // Format CPU cores data for display
  const cpuCores =
    systemStats?.cpu?.cores ||
    Array.from({ length: 4 }, (_, i) => ({
      id: `CPU${i + 1}`,
      usage: Math.floor(Math.random() * 20), // placeholder data
    }))

  // Process memory details for display
  const memoryDetails = {
    total: formatBytes(systemStats?.memory?.total || 0),
    used: formatBytes(systemStats?.memory?.used || 0),
    usedPercentage: systemStats?.memory?.usedPercent?.toFixed(1) || "0",
    cache: formatBytes(systemStats?.memory?.cache || 0),
    swap: {
      total: formatBytes(systemStats?.memory?.swap?.total || 0),
      used: formatBytes(systemStats?.memory?.swap?.used || 0),
      usedPercentage: systemStats?.memory?.swap?.usedPercent?.toFixed(1) || "0",
    },
  }

  // Process network data for display
  const networkData = systemStats?.network || []
  const networkDetails = {
    receiving: networkData.reduce((acc, net) => acc + (net.rxSec || 0), 0),
    sending: networkData.reduce((acc, net) => acc + (net.txSec || 0), 0),
    totalReceived: formatBytes(networkData.reduce((acc, net) => acc + (net.totalRx || 0), 0)),
    totalSent: formatBytes(networkData.reduce((acc, net) => acc + (net.totalTx || 0), 0)),
  }

  // Create processed system stats for child components
  const processedStats = {
    cpu: systemStats?.cpu?.currentLoad || 0,
    memory: systemStats?.memory || {},
    disk: systemStats?.disk || {},
    network: networkData,
    server: systemStats?.server || {},
    cpuCores: cpuCores,
    memoryDetails: memoryDetails,
    networkDetails: networkDetails,
  }

  return (
    <div className="app-container">
      <Navbar />
      <div className="container">
        <div className="card">
          <div className="section-header" onClick={() => setServerListExpanded(!serverListExpanded)}>
            {serverListExpanded ? <ChevronDown className="icon" /> : <ChevronRight className="icon" />}
            <h2 className="section-title">Servers</h2>
          </div>

          {serverListExpanded && (
            <div className="section-content">
              <div className="server-list">
                {servers.map((server) => (
                  <div
                    key={server.id}
                    className={`server-item ${selectedServer === server.id ? "selected" : ""} ${server.status?.connected ? "connected" : "disconnected"}`}
                    onClick={() => setSelectedServer(server.id)}
                  >
                    <Server className="server-icon" />
                    <div className="server-info">
                      <div className="server-name">{server.id}</div>
                      <div className="server-status">
                        {server.status?.connected ? (
                          <span className="status-badge connected">Connected</span>
                        ) : (
                          <span className="status-badge disconnected">Disconnected</span>
                        )}
                        {server.status?.group && <span className="server-group">{server.status.group}</span>}
                      </div>
                    </div>
                    {server.lastMetrics && (
                      <div className="server-metrics">
                        <div className="metric">CPU: {server.lastMetrics.cpu.toFixed(1)}%</div>
                        <div className="metric">Memory: {server.lastMetrics.memory.toFixed(1)}%</div>
                      </div>
                    )}
                  </div>
                ))}
                {servers.length === 0 && (
                  <div className="no-servers">
                    <Layers className="icon" />
                    <p>No servers connected</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {selectedServer && (
          <>
            <div className="server-header">
              <h2>Server: {selectedServer}</h2>
              <div className="server-uptime">
                <RefreshCw className="icon" />
                Uptime: {formatUptime(processedStats.server.uptime)}
              </div>
            </div>

            <div className="card">
              <div className="section-header" onClick={() => setCpuExpanded(!cpuExpanded)}>
                {cpuExpanded ? <ChevronDown className="icon" /> : <ChevronRight className="icon" />}
                <h2 className="section-title">CPU</h2>
              </div>

              {cpuExpanded && (
                <div className="section-content">
                  <div className="chart-container">
                    <CpuChart systemStats={processedStats} />
                  </div>
                  <div className="cpu-legend">
                    {processedStats.cpuCores.map((core) => (
                      <div className="cpu-item" key={core.id}>
                        <div
                          className="color-box"
                          style={{
                            backgroundColor: getCpuColor(core.id),
                          }}
                        ></div>
                        <span>{core.id}</span>
                        <span className="cpu-value">{core.usage.toFixed(1)}%</span>
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
                    <MemoryChart systemStats={processedStats} />
                  </div>
                  <div className="memory-stats">
                    <div className="memory-item">
                      <div className="pie-chart memory-pie">
                        <div
                          className="pie-segment"
                          style={{
                            transform: "rotate(0deg)",
                            backgroundColor: "#ec4899",
                          }}
                        ></div>
                        <div
                          className="pie-segment"
                          style={{
                            transform: `rotate(${3.6 * processedStats.memoryDetails.usedPercentage}deg)`,
                            backgroundColor: "transparent",
                          }}
                        ></div>
                      </div>
                      <div className="memory-details">
                        <div>Memory</div>
                        <div>
                          {processedStats.memoryDetails.used} ({processedStats.memoryDetails.usedPercentage}%) of{" "}
                          {processedStats.memoryDetails.total}
                        </div>
                        <div>Cache {processedStats.memoryDetails.cache}</div>
                      </div>
                    </div>
                    <div className="memory-item">
                      <div className="pie-chart swap-pie">
                        <div
                          className="pie-segment"
                          style={{
                            transform: "rotate(0deg)",
                            backgroundColor: "#22c55e",
                          }}
                        ></div>
                        <div
                          className="pie-segment"
                          style={{
                            transform: `rotate(${3.6 * processedStats.memoryDetails.swap.usedPercentage}deg)`,
                            backgroundColor: "transparent",
                          }}
                        ></div>
                      </div>
                      <div className="memory-details">
                        <div>Swap</div>
                        <div>
                          {processedStats.memoryDetails.swap.used} ({processedStats.memoryDetails.swap.usedPercentage}%)
                          of {processedStats.memoryDetails.swap.total}
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
                    <NetworkChart systemStats={processedStats} />
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
                        <div>{formatBytes(processedStats.networkDetails.receiving)}/s</div>
                        <div>Total Received {processedStats.networkDetails.totalReceived}</div>
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
                        <div>{formatBytes(processedStats.networkDetails.sending)}/s</div>
                        <div>Total Sent {processedStats.networkDetails.totalSent}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <AiChat />
    </div>
  )
}

// Helper function to get color for CPU cores
function getCpuColor(cpuId) {
  const colors = {
    CPU1: "#ef4444", // red
    CPU2: "#f97316", // orange
    CPU3: "#eab308", // yellow
    CPU4: "#84cc16", // lime
    CPU5: "#ec4899", // pink
    CPU6: "#06b6d4", // cyan
    CPU7: "#3b82f6", // blue
    CPU8: "#6366f1", // indigo
    CPU9: "#9333ea", // purple
    CPU10: "#f472b6", // pink
    CPU11: "#9ca3af", // gray
    CPU12: "#8b5cf6", // violet
  }

  return colors[cpuId] || "#9ca3af" // default to gray
}

// Helper function to format bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 B"

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"]

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}

// Helper function to format uptime
function formatUptime(seconds) {
  if (!seconds) return "Unknown"

  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  let result = ""
  if (days > 0) result += `${days}d `
  if (hours > 0 || days > 0) result += `${hours}h `
  result += `${minutes}m`

  return result
}

export default App
