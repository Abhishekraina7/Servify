"use client"

import { useState, useEffect } from "react"
import { Bell, User, X, Settings, LogOut, HelpCircle, Shield } from "lucide-react"
import "./Navbar.css"
import io from 'socket.io-client'

function Navbar() {
    const [alertsOpen, setAlertsOpen] = useState(false)
    const [profileOpen, setProfileOpen] = useState(false)
    const [alerts, setAlerts] = useState([])
    const [socket, setSocket] = useState(null)

    // Connect to WebSocket when component mounts
    useEffect(() => {
        // Connect to the /dashboard namespace
        const newSocket = io('http://localhost:5000/dashboard')
        setSocket(newSocket)

        // Listen for initial data (includes all current alerts)
        newSocket.on('initial_data', (data) => {
            console.log("Received initial data:", data);
            if (data && data.allAlerts) {
                setAlerts(data.allAlerts);
            }
        });

        // Listen for real-time alerts updates
        newSocket.on('alerts_update', (data) => {
            console.log("Received alerts update:", data);
            if (data && data.allAlerts) {
                // The backend sends the full list of active alerts with each update
                setAlerts(data.allAlerts);
                console.log("Updated alerts state:", data.allAlerts);
            }
        });

        // Optional: Listen for alert acknowledgments from the server
        newSocket.on('alert_acknowledged', (data) => {
            console.log("Alert acknowledged by server:", data);
            if (data && data.allAlerts) {
                // Update the list with the new acknowledged status
                setAlerts(data.allAlerts);
            }
        });

        // Add basic connection logging
        newSocket.on('connect', () => {
            console.log('Connected to dashboard namespace');
        });

        newSocket.on('disconnect', () => {
            console.log('Disconnected from dashboard namespace');
        });

        newSocket.on('connect_error', (error) => {
            console.error('Dashboard socket connection error:', error);
        });

        return () => newSocket.close()
    }, [])

    // Function to fetch alerts from the API (Keep this for the refresh button)
    const fetchAlerts = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/alerts')
            const data = await response.json()
            console.log("Fetched alerts via API:", data.alerts);
            setAlerts(data.alerts)
        } catch (error) {
            console.error('Error fetching alerts:', error)
        }
    }

    // Handle alert acknowledgment
    const dismissAlert = async (id) => {
        try {
            // Emit the acknowledge_alert event to the server
            if (socket) {
                // Find the serverId for the alert to send with the event
                const alertToDismiss = alerts.find(alert => alert.id === id);
                if (alertToDismiss) {
                    socket.emit('acknowledge_alert', { alertId: id, serverId: alertToDismiss.serverId });
                    console.log(`Emitted acknowledge_alert for ${id}`);
                    // Optimistically remove the alert from the UI
                    setAlerts(prevAlerts => prevAlerts.filter(alert => alert.id !== id));
                } else {
                    console.warn(`Alert with id ${id} not found in current state.`);
                }
            } else {
                console.error("Socket not connected, cannot dismiss alert.");
                // Fallback to API if socket is not available (less ideal)
                await fetch(`http://localhost:5000/api/alerts/${id}/acknowledge`, {
                    method: 'POST'
                });
                setAlerts(alerts.filter(alert => alert.id !== id));
            }

        } catch (error) {
            console.error('Error acknowledging alert:', error)
        }
    }

    // Close dropdowns when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (alertsOpen && !event.target.closest(".navbar-alerts")) {
                setAlertsOpen(false)
            }
            if (profileOpen && !event.target.closest(".navbar-profile")) {
                setProfileOpen(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [alertsOpen, profileOpen])

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="navbar-brand">
                    <Shield className="brand-icon" />
                    <h1>Servify</h1>
                </div>

                <div className="navbar-actions">
                    {/* Alerts Button */}
                    <div className="navbar-alerts">
                        <button
                            className={`action-button ${alertsOpen ? "active" : ""}`}
                            onClick={() => {
                                setAlertsOpen(!alertsOpen)
                                setProfileOpen(false)
                            }}
                            aria-label="Alerts"
                        >
                            <Bell size={20} />
                            {/* Only show badge for unacknowledged alerts */}
                            {alerts.filter(alert => !alert.acknowledged).length > 0 &&
                                <span className="badge">{alerts.filter(alert => !alert.acknowledged).length}</span>
                            }
                        </button>

                        {alertsOpen && (
                            <div className="dropdown-menu alerts-menu">
                                <div className="dropdown-header">
                                    <h3>System Alerts</h3>
                                    <button className="close-button" onClick={() => setAlertsOpen(false)}>
                                        <X size={16} />
                                    </button>
                                </div>
                                <div className="dropdown-content">
                                    {/* Filter to show only unacknowledged alerts in the dropdown */}
                                    {alerts.filter(alert => !alert.acknowledged).length > 0 ? (
                                        <ul className="alert-list">
                                            {alerts.filter(alert => !alert.acknowledged).map((alert) => (
                                                <li key={alert.id} className={`alert-item ${alert.severity}`}>
                                                    <div className="alert-content">
                                                        <div className="alert-header">
                                                            <span className={`alert-severity ${alert.severity}`}>
                                                                {alert.severity}
                                                            </span>
                                                            <span className="alert-server">{alert.serverId}</span>
                                                            <button
                                                                className="alert-dismiss"
                                                                onClick={() => dismissAlert(alert.id)}
                                                                aria-label="Dismiss alert"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                        <p className="alert-message">{alert.message}</p>
                                                        {/* Display time ago if available, otherwise timestamp */}
                                                        <span className="alert-time">{alert.timeAgo || new Date(alert.timestamp).toLocaleString()}</span>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="empty-message">No active alerts at this time</p>
                                    )}
                                </div>
                                <div className="dropdown-footer">
                                    <button className="view-all" onClick={fetchAlerts}>Refresh alerts</button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Profile Button */}
                    <div className="navbar-profile">
                        <button
                            className={`action-button ${profileOpen ? "active" : ""}`}
                            onClick={() => {
                                setProfileOpen(!profileOpen)
                                setAlertsOpen(false)
                            }}
                            aria-label="User profile"
                        >
                            <User size={20} />
                        </button>

                        {profileOpen && (
                            <div className="dropdown-menu profile-menu">
                                <div className="profile-header">
                                    <div className="profile-avatar">
                                        <User size={32} />
                                    </div>
                                    <div className="profile-info">
                                        <h3>Admin User</h3>
                                        <p>admin@servify.com</p>
                                    </div>
                                </div>
                                <div className="profile-content">
                                    <ul className="profile-menu-list">
                                        <li>
                                            <a href="#profile" className="profile-menu-item">
                                                <User size={16} />
                                                <span>My Profile</span>
                                            </a>
                                        </li>
                                        <li>
                                            <a href="#settings" className="profile-menu-item">
                                                <Settings size={16} />
                                                <span>Settings</span>
                                            </a>
                                        </li>
                                        <li>
                                            <a href="#help" className="profile-menu-item">
                                                <HelpCircle size={16} />
                                                <span>Help & Support</span>
                                            </a>
                                        </li>
                                    </ul>
                                </div>
                                <div className="profile-footer">
                                    <button className="logout-button">
                                        <LogOut size={16} />
                                        <span>Log Out</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default Navbar
