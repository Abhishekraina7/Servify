"use client"

import { useState, useEffect } from "react"
import { Bell, User, X, Settings, LogOut, HelpCircle, Shield } from "lucide-react"
import "./Navbar.css"

function Navbar() {
    const [alertsOpen, setAlertsOpen] = useState(false)
    const [profileOpen, setProfileOpen] = useState(false)

    // Sample alerts data
    const [alerts, setAlerts] = useState([
        {
            id: 1,
            severity: "high",
            message: "Server CPU usage above 90% for 5 minutes",
            time: "10 minutes ago",
            server: "server-01",
        },
        {
            id: 2,
            severity: "medium",
            message: "Memory usage trending upward",
            time: "25 minutes ago",
            server: "server-02",
        },
        {
            id: 3,
            severity: "low",
            message: "Network latency increased by 15%",
            time: "1 hour ago",
            server: "server-03",
        },
    ])

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

    // Handle alert dismissal
    const dismissAlert = (id) => {
        setAlerts(alerts.filter((alert) => alert.id !== id))
    }

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
                            {alerts.length > 0 && <span className="badge">{alerts.length}</span>}
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
                                    {alerts.length > 0 ? (
                                        <ul className="alert-list">
                                            {alerts.map((alert) => (
                                                <li key={alert.id} className={`alert-item ${alert.severity}`}>
                                                    <div className="alert-content">
                                                        <div className="alert-header">
                                                            <span className={`alert-severity ${alert.severity}`}>{alert.severity}</span>
                                                            <span className="alert-server">{alert.server}</span>
                                                            <button
                                                                className="alert-dismiss"
                                                                onClick={() => dismissAlert(alert.id)}
                                                                aria-label="Dismiss alert"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                        <p className="alert-message">{alert.message}</p>
                                                        <span className="alert-time">{alert.time}</span>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="empty-message">No alerts at this time</p>
                                    )}
                                </div>
                                <div className="dropdown-footer">
                                    <button className="view-all">View all alerts</button>
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
