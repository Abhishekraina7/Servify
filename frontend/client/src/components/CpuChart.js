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

// Generate random CPU usage data
const generateCpuData = (count) => {
    const data = []
    for (let i = 0; i < 12; i++) {
        const cpuData = []
        for (let j = 0; j < count; j++) {
            // Generate values that mostly stay below 25% with occasional spikes
            const baseValue = Math.random() * 5
            const spike = Math.random() > 0.9 ? Math.random() * 20 : 0
            cpuData.push(baseValue + spike)
        }
        data.push(cpuData)
    }
    return data
}

function CpuChart() {
    const [cpuData, setCpuData] = useState([])
    const [labels, setLabels] = useState([])

    useEffect(() => {
        // Generate initial data
        const initialLabels = Array.from({ length: 60 }, (_, i) => `${i} secs`)
        setLabels(initialLabels)
        setCpuData(generateCpuData(60))

        // Update data every second
        const interval = setInterval(() => {
            setCpuData((prevData) => {
                return prevData.map((cpuCore) => {
                    const newData = [...cpuCore.slice(1)]
                    const baseValue = Math.random() * 5
                    const spike = Math.random() > 0.9 ? Math.random() * 20 : 0
                    newData.push(baseValue + spike)
                    return newData
                })
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    const chartData = {
        labels,
        datasets: [
            {
                label: "CPU1",
                data: cpuData[0] || [],
                borderColor: "rgb(239, 68, 68)",
                backgroundColor: "rgba(239, 68, 68, 0.5)",
                borderWidth: 1,
                pointRadius: 0,
                tension: 0.4,
            },
            {
                label: "CPU2",
                data: cpuData[1] || [],
                borderColor: "rgb(249, 115, 22)",
                backgroundColor: "rgba(249, 115, 22, 0.5)",
                borderWidth: 1,
                pointRadius: 0,
                tension: 0.4,
            },
            {
                label: "CPU3",
                data: cpuData[2] || [],
                borderColor: "rgb(234, 179, 8)",
                backgroundColor: "rgba(234, 179, 8, 0.5)",
                borderWidth: 1,
                pointRadius: 0,
                tension: 0.4,
            },
            {
                label: "CPU4",
                data: cpuData[3] || [],
                borderColor: "rgb(132, 204, 22)",
                backgroundColor: "rgba(132, 204, 22, 0.5)",
                borderWidth: 1,
                pointRadius: 0,
                tension: 0.4,
            },
            {
                label: "CPU5",
                data: cpuData[4] || [],
                borderColor: "rgb(236, 72, 153)",
                backgroundColor: "rgba(236, 72, 153, 0.5)",
                borderWidth: 1,
                pointRadius: 0,
                tension: 0.4,
            },
            {
                label: "CPU6",
                data: cpuData[5] || [],
                borderColor: "rgb(6, 182, 212)",
                backgroundColor: "rgba(6, 182, 212, 0.5)",
                borderWidth: 1,
                pointRadius: 0,
                tension: 0.4,
            },
            {
                label: "CPU7",
                data: cpuData[6] || [],
                borderColor: "rgb(59, 130, 246)",
                backgroundColor: "rgba(59, 130, 246, 0.5)",
                borderWidth: 1,
                pointRadius: 0,
                tension: 0.4,
            },
            {
                label: "CPU8",
                data: cpuData[7] || [],
                borderColor: "rgb(99, 102, 241)",
                backgroundColor: "rgba(99, 102, 241, 0.5)",
                borderWidth: 1,
                pointRadius: 0,
                tension: 0.4,
            },
            {
                label: "CPU9",
                data: cpuData[8] || [],
                borderColor: "rgb(147, 51, 234)",
                backgroundColor: "rgba(147, 51, 234, 0.5)",
                borderWidth: 1,
                pointRadius: 0,
                tension: 0.4,
            },
            {
                label: "CPU10",
                data: cpuData[9] || [],
                borderColor: "rgb(244, 114, 182)",
                backgroundColor: "rgba(244, 114, 182, 0.5)",
                borderWidth: 1,
                pointRadius: 0,
                tension: 0.4,
            },
            {
                label: "CPU11",
                data: cpuData[10] || [],
                borderColor: "rgb(156, 163, 175)",
                backgroundColor: "rgba(156, 163, 175, 0.5)",
                borderWidth: 1,
                pointRadius: 0,
                tension: 0.4,
            },
            {
                label: "CPU12",
                data: cpuData[11] || [],
                borderColor: "rgb(139, 92, 246)",
                backgroundColor: "rgba(139, 92, 246, 0.5)",
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

export default CpuChart
