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
            const cpu = await si.currentLoad();
            const mem = await si.mem();
            const disk = await si.fsSize();
            const uptime = await si.time();

            const statsData = {
                cpu: cpu.currentLoad.toFixed(2),
                mem: ((mem.used / mem.total) * 100).toFixed(2),
                disk: disk[0]?.use.toFixed(2) || 0,
                uptime: uptime.uptime,
            };

            console.log("Sending stats:", statsData);
            socket.emit("stats", statsData);
        } catch (error) {
            console.error("Error collecting system stats:", error);
        }
    };

    // Send initial stats immediately
    sendStats();

    const interval = setInterval(sendStats, 1000); // every 2 sec

    socket.on("disconnect", () => {
        clearInterval(interval);
        console.log("Client disconnected:", socket.id);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));