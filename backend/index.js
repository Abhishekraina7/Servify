const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const si = require("systeminformation");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*", // Allow any origin for development
        methods: ["GET", "POST"]
    },
});

app.get("/", (req, res) => {
    res.send("Server is running");
});

io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Add error handling
    socket.on("error", (error) => {
        console.error("Socket error:", error);
    });

    // Add connection status logging
    socket.on("connect_error", (error) => {
        console.error("Connection error:", error);
    });

    const sendStats = async () => {
        try {
            // Get basic stats
            const cpu = await si.currentLoad();
            const mem = await si.mem();
            const disk = await si.fsSize();
            const uptime = await si.time();
            const network = await si.networkStats();

            // Get per-core CPU data
            const cpuCores = [];
            if (cpu.cpus && cpu.cpus.length > 0) {
                cpu.cpus.forEach((core, index) => {
                    cpuCores.push({
                        id: `CPU${index + 1}`,
                        usage: core.load.toFixed(1)
                    });
                });
            }

            // Format memory details
            const memoryDetails = {
                total: formatBytes(mem.total),
                used: formatBytes(mem.used),
                usedPercentage: ((mem.used / mem.total) * 100).toFixed(1),
                cache: formatBytes(mem.cached),
                swap: {
                    total: formatBytes(mem.swaptotal),
                    used: formatBytes(mem.swapused),
                    usedPercentage: mem.swaptotal > 0 ?
                        ((mem.swapused / mem.swaptotal) * 100).toFixed(1) : 0
                }
            };

            // Format network details
            const networkDetails = network.length > 0 ? {
                receiving: network[0].rx_sec,
                sending: network[0].tx_sec,
                totalReceived: formatBytes(network[0].rx_bytes),
                totalSent: formatBytes(network[0].tx_bytes)
            } : {
                receiving: 0,
                sending: 0,
                totalReceived: "0 B",
                totalSent: "0 B"
            };

            // Compile all stats
            const statsData = {
                cpu: cpu.currentLoad.toFixed(2),
                mem: ((mem.used / mem.total) * 100).toFixed(2),
                disk: disk[0]?.use.toFixed(2) || 0,
                uptime: uptime.uptime,
                cpuCores: cpuCores,
                memoryDetails: memoryDetails,
                networkDetails: networkDetails
            };

            console.log("Sending stats:", statsData);
            socket.emit("stats", statsData);
        } catch (error) {
            console.error("Error collecting system stats:", error);
        }
    };

    // Send initial stats immediately
    sendStats();

    const interval = setInterval(sendStats, 2000); // every 2 sec

    socket.on("disconnect", () => {
        clearInterval(interval);
        console.log("Client disconnected:", socket.id);
    });
});

// Helper function to format bytes to human-readable format
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));