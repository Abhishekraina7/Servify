"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import CpuChart from "./components/CpuChart"
import MemoryChart from "./components/MemoryChart"
import NetworkChart from "./components/NetworkChart"
import "./App.css"

function App() {
  const [cpuExpanded, setCpuExpanded] = useState(true)
  const [memoryExpanded, setMemoryExpanded] = useState(true)
  const [networkExpanded, setNetworkExpanded] = useState(true)

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
              <CpuChart />
            </div>
            <div className="cpu-legend">
              <div className="cpu-item">
                <div className="color-box" style={{ backgroundColor: "#ef4444" }}></div>
                <span>CPU1</span>
                <span className="cpu-value">9.9%</span>
              </div>
              <div className="cpu-item">
                <div className="color-box" style={{ backgroundColor: "#f97316" }}></div>
                <span>CPU2</span>
                <span className="cpu-value">1.0%</span>
              </div>
              <div className="cpu-item">
                <div className="color-box" style={{ backgroundColor: "#eab308" }}></div>
                <span>CPU3</span>
                <span className="cpu-value">2.0%</span>
              </div>
              <div className="cpu-item">
                <div className="color-box" style={{ backgroundColor: "#84cc16" }}></div>
                <span>CPU4</span>
                <span className="cpu-value">0.0%</span>
              </div>
              <div className="cpu-item">
                <div className="color-box" style={{ backgroundColor: "#ec4899" }}></div>
                <span>CPU5</span>
                <span className="cpu-value">4.0%</span>
              </div>
              <div className="cpu-item">
                <div className="color-box" style={{ backgroundColor: "#06b6d4" }}></div>
                <span>CPU6</span>
                <span className="cpu-value">2.0%</span>
              </div>
              <div className="cpu-item">
                <div className="color-box" style={{ backgroundColor: "#9333ea" }}></div>
                <span>CPU9</span>
                <span className="cpu-value">1.0%</span>
              </div>
              <div className="cpu-item">
                <div className="color-box" style={{ backgroundColor: "#f472b6" }}></div>
                <span>CPU10</span>
                <span className="cpu-value">0.0%</span>
              </div>
              <div className="cpu-item">
                <div className="color-box" style={{ backgroundColor: "#3b82f6" }}></div>
                <span>CPU7</span>
                <span className="cpu-value">2.0%</span>
              </div>
              <div className="cpu-item">
                <div className="color-box" style={{ backgroundColor: "#6366f1" }}></div>
                <span>CPU8</span>
                <span className="cpu-value">1.0%</span>
              </div>
              <div className="cpu-item">
                <div className="color-box" style={{ backgroundColor: "#9ca3af" }}></div>
                <span>CPU11</span>
                <span className="cpu-value">0.0%</span>
              </div>
              <div className="cpu-item">
                <div className="color-box" style={{ backgroundColor: "#8b5cf6" }}></div>
                <span>CPU12</span>
                <span className="cpu-value">1.0%</span>
              </div>
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
              <MemoryChart />
            </div>
            <div className="memory-stats">
              <div className="memory-item">
                <div className="pie-chart memory-pie">
                  <div className="pie-segment" style={{ transform: "rotate(0deg)", backgroundColor: "#ec4899" }}></div>
                  <div
                    className="pie-segment"
                    style={{ transform: "rotate(205deg)", backgroundColor: "transparent" }}
                  ></div>
                </div>
                <div className="memory-details">
                  <div>Memory</div>
                  <div>4.6 GB (57.3%) of 8.0 GB</div>
                  <div>Cache 2.4 GB</div>
                </div>
              </div>
              <div className="memory-item">
                <div className="pie-chart swap-pie">
                  <div className="pie-segment" style={{ transform: "rotate(0deg)", backgroundColor: "#22c55e" }}></div>
                  <div
                    className="pie-segment"
                    style={{ transform: "rotate(216deg)", backgroundColor: "transparent" }}
                  ></div>
                </div>
                <div className="memory-details">
                  <div>Swap</div>
                  <div>1.3 GB (60.1%) of 2.1 GB</div>
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
              <NetworkChart />
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
                  <div>0 bytes/s</div>
                  <div>Total Received 1.2 GiB</div>
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
                  <div>0 bytes/s</div>
                  <div>Total Sent 155.0 MiB</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
