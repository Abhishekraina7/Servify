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
    Filler,
} from "chart.js"

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
)

function MemoryChart({ systemStats }) {
    const [memoryData, setMemoryData] = useState(Array(60).fill(0));
    const [swapData, setSwapData] = useState(Array(60).fill(0));
    const [labels, setLabels] = useState(Array(60).fill(""));

    useEffect(() => {
        if (!systemStats || !systemStats.memoryDetails) {
            return;
        }

        // Update memory usage data
        setMemoryData(prev => {
            const percentage = parseFloat(systemStats.memoryDetails.usedPercentage);
            return [...prev.slice(1), percentage];
        });

        // Update swap usage data
        setSwapData(prev => {
            const percentage = parseFloat(systemStats.memoryDetails.swap.usedPercentage);
            return [...prev.slice(1), percentage];
        });

        // Update time labels
        setLabels(prev => {
            const now = new Date();
            const timeStr = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
            return [...prev.slice(1), timeStr];
        });
    }, [systemStats]);

    const chartData = {
        labels,
        datasets: [
            {
                label: "Memory",
                data: memoryData,
                borderColor: "rgb(236, 72, 153)",
                backgroundColor: "rgba(236, 72, 153, 0.1)",
                borderWidth: 1,
                pointRadius: 0,
                tension: 0.4,
                fill: true,
            },
            {
                label: "Swap",
                data: swapData,
                borderColor: "rgb(34, 197, 94)",
                backgroundColor: "rgba(34, 197, 94, 0.1)",
                borderWidth: 1,
                pointRadius: 0,
                tension: 0.4,
                fill: true,
            }
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
                max: 100,
                ticks: {
                    stepSize: 20,
                    callback: (value) => `${value}%`,
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

export default MemoryChart