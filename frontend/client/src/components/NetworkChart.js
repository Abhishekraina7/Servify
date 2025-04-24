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

// Generate random network data
const generateNetworkData = (count) => {
    const receivingData = []
    const sendingData = []

    for (let i = 0; i < count; i++) {
        // Generate values with occasional spikes
        const baseReceiving = Math.random() * 0.2
        const baseSending = Math.random() * 0.2

        const spikeReceiving = Math.random() > 0.9 ? Math.random() * 1.5 : 0
        const spikeSending = Math.random() > 0.9 ? Math.random() * 1.2 : 0

        receivingData.push(baseReceiving + spikeReceiving)
        sendingData.push(baseSending + spikeSending)
    }

    return { receivingData, sendingData }
}

function NetworkChart() {
    const [networkData, setNetworkData] = useState({
        receivingData: [],
        sendingData: [],
    })
    const [labels, setLabels] = useState([])

    useEffect(() => {
        // Generate initial data
        const initialLabels = Array.from({ length: 60 }, (_, i) => `${i} secs`)
        setLabels(initialLabels)
        setNetworkData(generateNetworkData(60))

        // Update data every second
        const interval = setInterval(() => {
            setNetworkData((prevData) => {
                const newReceivingData = [...prevData.receivingData.slice(1)]
                const newSendingData = [...prevData.sendingData.slice(1)]

                const baseReceiving = Math.random() * 0.2
                const baseSending = Math.random() * 0.2

                const spikeReceiving = Math.random() > 0.9 ? Math.random() * 1.5 : 0
                const spikeSending = Math.random() > 0.9 ? Math.random() * 1.2 : 0

                newReceivingData.push(baseReceiving + spikeReceiving)
                newSendingData.push(baseSending + spikeSending)

                return {
                    receivingData: newReceivingData,
                    sendingData: newSendingData,
                }
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [])

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
                max: 2,
                ticks: {
                    stepSize: 0.4,
                    callback: (value) => `${value} MB/s`,
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
