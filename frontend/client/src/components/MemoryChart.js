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

// Generate random memory usage data
const generateMemoryData = (count) => {
    const memoryData = []
    for (let i = 0; i < count; i++) {
        // Generate values that stay around 57-60%
        memoryData.push(57 + Math.random() * 3)
    }
    return memoryData
}

function MemoryChart() {
    const [memoryData, setMemoryData] = useState([])
    const [labels, setLabels] = useState([])

    useEffect(() => {
        // Generate initial data
        const initialLabels = Array.from({ length: 60 }, (_, i) => `${i} secs`)
        setLabels(initialLabels)
        setMemoryData(generateMemoryData(60))

        // Update data every second
        const interval = setInterval(() => {
            setMemoryData((prevData) => {
                const newData = [...prevData.slice(1)]
                newData.push(57 + Math.random() * 3)
                return newData
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    const chartData = {
        labels,
        datasets: [
            {
                label: "Memory",
                data: memoryData,
                borderColor: "rgb(34, 197, 94)",
                backgroundColor: "rgba(34, 197, 94, 0.1)",
                borderWidth: 1,
                pointRadius: 0,
                tension: 0.4,
                fill: true,
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
