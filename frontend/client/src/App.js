import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import { PieChart, Pie, Cell, Tooltip } from "recharts";

function App() {
  const [stats, setStats] = useState({ cpu: 0, mem: 0, disk: 0, uptime: 0 });
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Create socket connection
    const newSocket = io("http://localhost:5000", {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'] // Try WebSocket first, then polling
    });

    setSocket(newSocket);

    // Socket event listeners
    newSocket.on("connect", () => {
      console.log("Connected to server with ID:", newSocket.id);
      setConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from server");
      setConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setConnected(false);
    });

    newSocket.on("stats", (data) => {
      console.log("Received stats:", data);
      setStats(data);
    });

    // Clean up on component unmount
    return () => {
      console.log("Cleaning up socket connection");
      newSocket.disconnect();
    };
  }, []);

  const chartData = [
    { name: "CPU Usage", value: parseFloat(stats.cpu) || 0 },
    { name: "Memory Usage", value: parseFloat(stats.mem) || 0 },
    { name: "Disk Usage", value: parseFloat(stats.disk) || 0 },
  ];

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658"];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Server Health Dashboard</h1>

      {/* Connection status indicator */}
      <div className="mb-4">
        <span
          className={`inline-block w-3 h-3 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-red-500'}`}
        ></span>
        <span>{connected ? 'Connected to server' : 'Disconnected from server'}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PieChart width={400} height={300}>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={95}
            label
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${value}%`} />
        </PieChart>

        <div className="text-lg">
          <p><strong>CPU:</strong> {stats.cpu}%</p>
          <p><strong>Memory:</strong> {stats.mem}%</p>
          <p><strong>Disk:</strong> {stats.disk}%</p>
          <p><strong>Uptime:</strong> {Math.floor(stats.uptime / 60)} mins</p>
        </div>
      </div>
    </div>
  );
}

export default App;