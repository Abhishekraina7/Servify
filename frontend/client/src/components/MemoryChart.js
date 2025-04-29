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

function MemoryChart({ systemStats }) {
    const [memoryData, setMemoryData] = useState({
        usedPercent: Array(60).fill(0),
    });
    const [labels, setLabels] = useState(Array(60).fill(""));

    useEffect(() => {
        if (!systemStats || !systemStats.memory) {
            return;
        }

        // Extract memory percentage from metrics
        const usedPercent = parseFloat(systemStats.memoryDetails.usedPercentage) || 0;

        setMemoryData(prev => {
            return {
                usedPercent: [...prev.usedPercent.slice(1), usedPercent],
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
                label: "Memory Usage",
                data: memoryData.usedPercent,
                borderColor: "rgb(236, 72, 153)", // Pink to match the pie chart
                backgroundColor: "rgba(236, 72, 153, 0.5)",
                borderWidth: 1,
                pointRadius: 0,
                tension: 0.4,
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
                callbacks: {
                    label: (context) => {
                        let label = context.dataset.label || ""
                        if (label) {
                            label += ": "
                        }
                        if (context.parsed.y !== null) {
                            label += `${context.parsed.y.toFixed(1)}%`
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

export default MemoryChart