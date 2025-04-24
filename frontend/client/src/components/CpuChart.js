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

// Define colors for each CPU core
const cpuColors = {
    "CPU1": { border: "rgb(239, 68, 68)", background: "rgba(239, 68, 68, 0.5)" },
    "CPU2": { border: "rgb(249, 115, 22)", background: "rgba(249, 115, 22, 0.5)" },
    "CPU3": { border: "rgb(234, 179, 8)", background: "rgba(234, 179, 8, 0.5)" },
    "CPU4": { border: "rgb(132, 204, 22)", background: "rgba(132, 204, 22, 0.5)" },
    "CPU5": { border: "rgb(236, 72, 153)", background: "rgba(236, 72, 153, 0.5)" },
    "CPU6": { border: "rgb(6, 182, 212)", background: "rgba(6, 182, 212, 0.5)" },
    "CPU7": { border: "rgb(59, 130, 246)", background: "rgba(59, 130, 246, 0.5)" },
    "CPU8": { border: "rgb(99, 102, 241)", background: "rgba(99, 102, 241, 0.5)" },
    "CPU9": { border: "rgb(147, 51, 234)", background: "rgba(147, 51, 234, 0.5)" },
    "CPU10": { border: "rgb(244, 114, 182)", background: "rgba(244, 114, 182, 0.5)" },
    "CPU11": { border: "rgb(156, 163, 175)", background: "rgba(156, 163, 175, 0.5)" },
    "CPU12": { border: "rgb(139, 92, 246)", background: "rgba(139, 92, 246, 0.5)" }
}

function CpuChart({ systemStats }) {
    const [cpuData, setCpuData] = useState({});
    const [labels, setLabels] = useState(Array(60).fill(""));

    useEffect(() => {
        if (!systemStats || !systemStats.cpuCores || systemStats.cpuCores.length === 0) {
            return;
        }

        setCpuData(prevData => {
            const newData = { ...prevData };

            // Initialize data structure for each CPU core if it doesn't exist
            systemStats.cpuCores.forEach(core => {
                if (!newData[core.id]) {
                    newData[core.id] = Array(60).fill(0);
                }

                // Add new data point and remove oldest one
                newData[core.id] = [...newData[core.id].slice(1), parseFloat(core.usage)];
            });

            return newData;
        });

        // Update time labels
        setLabels(prev => {
            const now = new Date();
            const timeStr = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
            return [...prev.slice(1), timeStr];
        });
    }, [systemStats]);

    // Prepare chart data
    const chartData = {
        labels,
        datasets: Object.keys(cpuData).map(cpuId => ({
            label: cpuId,
            data: cpuData[cpuId],
            borderColor: cpuColors[cpuId]?.border || "rgb(156, 163, 175)",
            backgroundColor: cpuColors[cpuId]?.background || "rgba(156, 163, 175, 0.5)",
            borderWidth: 1,
            pointRadius: 0,
            tension: 0.4,
        }))
    };

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
    };

    return <Line data={chartData} options={options} />;
}

export default CpuChart