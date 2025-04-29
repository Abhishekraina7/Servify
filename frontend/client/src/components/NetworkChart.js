"use client"

import { useEffect, useState } from "react"
import { Line } from "react-chartjs-2"
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

// Convert network stats to MB/s for display
function bytesToMB(bytes) {
    return bytes / (1024 * 1024);
}

function NetworkChart({ systemStats }) {
    const [networkData, setNetworkData] = useState({
        receivingData: Array(60).fill(0),
        sendingData: Array(60).fill(0),
    });
    const [labels, setLabels] = useState(Array(60).fill(""));
    // Track max value for dynamic y-axis scaling
    const [maxDataValue, setMaxDataValue] = useState(2);

    useEffect(() => {
        if (!systemStats || !systemStats.networkDetails) {
            return;
        }

        // Get the network receiving and sending rates from processed stats
        const receivingBytes = systemStats.networkDetails.receiving || 0;
        const sendingBytes = systemStats.networkDetails.sending || 0;

        // Convert to MB/s for display
        const receivingMB = bytesToMB(receivingBytes);
        const sendingMB = bytesToMB(sendingBytes);

        // Update dynamic scale if needed
        const currentMax = Math.max(receivingMB, sendingMB);
        if (currentMax > maxDataValue) {
            // Add 20% buffer to max value
            setMaxDataValue(currentMax * 1.2);
        }

        setNetworkData(prev => {
            return {
                receivingData: [...prev.receivingData.slice(1), receivingMB],
                sendingData: [...prev.sendingData.slice(1), sendingMB],
            };
        });

        // Update time labels
        setLabels(prev => {
            const now = new Date();
            const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
            return [...prev.slice(1), timeStr];
        });
    }, [systemStats]);

    const chartData = {
        labels,
        datasets: [
            {
                label: "Receiving",
                data: networkData.receivingData,
                borderColor: "rgb(59, 130, 246)",
                backgroundColor: "rgba(59, 130, 246, 0.5)",
                borderWidth: 1,
                pointRadius: 0,
                tension: 0.4,
            },
            {
                label: "Sending",
                data: networkData.sendingData,
                borderColor: "rgb(239, 68, 68)",
                backgroundColor: "rgba(239, 68, 68, 0.5)",
                borderWidth: 1,
                pointRadius: 0,
                tension: 0.4,
            },
        ],
    }

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                grid: {
                    color: "rgba(0, 0, 0, 0.1)",
                },
                ticks: {
                    maxRotation: 0,
                    autoSkip: true,
                    maxTicksLimit: 6,
                },
            },
            y: {
                grid: {
                    color: "rgba(0, 0, 0, 0.1)",
                },
                min: 0,
                max: maxDataValue,
                ticks: {
                    callback: (value) => `${value.toFixed(2)} MB/s`,
                },
            },
        },
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                mode: "index",
                intersect: false,
                callbacks: {
                    label: (context) => {
                        let label = context.dataset.label || ""
                        if (label) {
                            label += ": "
                        }
                        if (context.parsed.y !== null) {
                            label += `${context.parsed.y.toFixed(2)} MB/s`
                        }
                        return label
                    },
                },
            },
        },
        animation: {
            duration: 0,
        },
        elements: {
            line: {
                borderWidth: 1,
            },
        },
    }

    return <Line data={chartData} options={options} />
}

export default NetworkChart