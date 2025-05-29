import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, CheckCircle, X, Plus, Settings, Mail, MessageSquare } from 'lucide-react';

const AlertManagementSystem = () => {
    const [alerts, setAlerts] = useState([
        {
            id: 1,
            type: 'critical',
            title: 'High CPU Usage',
            description: 'Server-01 CPU usage exceeded 90% for 5 minutes',
            server: 'Server-01',
            metric: 'CPU',
            threshold: 90,
            currentValue: 94,
            timestamp: new Date(Date.now() - 300000),
            status: 'active',
            acknowledged: false
        },
        {
            id: 2,
            type: 'warning',
            title: 'Memory Usage High',
            description: 'Server-02 memory usage is at 85%',
            server: 'Server-02',
            metric: 'Memory',
            threshold: 80,
            currentValue: 85,
            timestamp: new Date(Date.now() - 600000),
            status: 'active',
            acknowledged: true
        },
        {
            id: 3,
            type: 'info',
            title: 'Network Spike',
            description: 'Unusual network activity detected',
            server: 'Server-03',
            metric: 'Network',
            threshold: 100,
            currentValue: 120,
            timestamp: new Date(Date.now() - 900000),
            status: 'resolved',
            acknowledged: true
        }
    ]);

    const [rules, setRules] = useState([
        {
            id: 1,
            name: 'CPU Critical Alert',
            metric: 'CPU',
            condition: 'greater_than',
            threshold: 90,
            duration: 5,
            severity: 'critical',
            enabled: true,
            notifications: ['email', 'slack']
        },
        {
            id: 2,
            name: 'Memory Warning',
            metric: 'Memory',
            condition: 'greater_than',
            threshold: 80,
            duration: 3,
            severity: 'warning',
            enabled: true,
            notifications: ['email']
        }
    ]);

    const [showRuleModal, setShowRuleModal] = useState(false);
    const [newRule, setNewRule] = useState({
        name: '',
        metric: 'CPU',
        condition: 'greater_than',
        threshold: 80,
        duration: 5,
        severity: 'warning',
        notifications: []
    });

    const getAlertIcon = (type) => {
        switch (type) {
            case 'critical':
                return <AlertTriangle className="h-5 w-5 text-red-500" />;
            case 'warning':
                return <Bell className="h-5 w-5 text-yellow-500" />;
            case 'info':
                return <CheckCircle className="h-5 w-5 text-blue-500" />;
            default:
                return <Bell className="h-5 w-5 text-gray-500" />;
        }
    };

    const getAlertColor = (type) => {
        switch (type) {
            case 'critical':
                return 'border-red-500 bg-red-50';
            case 'warning':
                return 'border-yellow-500 bg-yellow-50';
            case 'info':
                return 'border-blue-500 bg-blue-50';
            default:
                return 'border-gray-300 bg-gray-50';
        }
    };

    const acknowledgeAlert = (id) => {
        setAlerts(alerts.map(alert =>
            alert.id === id ? { ...alert, acknowledged: true } : alert
        ));
    };

    const resolveAlert = (id) => {
        setAlerts(alerts.map(alert =>
            alert.id === id ? { ...alert, status: 'resolved' } : alert
        ));
    };

    const addRule = () => {
        const rule = {
            ...newRule,
            id: Date.now(),
            enabled: true
        };
        setRules([...rules, rule]);
        setNewRule({
            name: '',
            metric: 'CPU',
            condition: 'greater_than',
            threshold: 80,
            duration: 5,
            severity: 'warning',
            notifications: []
        });
        setShowRuleModal(false);
    };

    const toggleRule = (id) => {
        setRules(rules.map(rule =>
            rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
        ));
    };

    const activeAlerts = alerts.filter(alert => alert.status === 'active');
    const unresolvedAlerts = activeAlerts.filter(alert => !alert.acknowledged);

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Alert Management</h1>
                <div className="flex gap-4 text-sm">
                    <span className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        Critical: {alerts.filter(a => a.type === 'critical' && a.status === 'active').length}
                    </span>
                    <span className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        Warning: {alerts.filter(a => a.type === 'warning' && a.status === 'active').length}
                    </span>
                    <span className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        Info: {alerts.filter(a => a.type === 'info' && a.status === 'active').length}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Active Alerts */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold mb-4">Active Alerts ({activeAlerts.length})</h2>
                        <div className="space-y-4">
                            {activeAlerts.map(alert => (
                                <div key={alert.id} className={`border-l-4 p-4 rounded-r-lg ${getAlertColor(alert.type)}`}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                            {getAlertIcon(alert.type)}
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                                                <p className="text-gray-600 text-sm">{alert.description}</p>
                                                <div className="flex gap-4 text-xs text-gray-500 mt-2">
                                                    <span>Server: {alert.server}</span>
                                                    <span>Current: {alert.currentValue}%</span>
                                                    <span>Threshold: {alert.threshold}%</span>
                                                    <span>{alert.timestamp.toLocaleTimeString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {!alert.acknowledged && (
                                                <button
                                                    onClick={() => acknowledgeAlert(alert.id)}
                                                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                                                >
                                                    Acknowledge
                                                </button>
                                            )}
                                            <button
                                                onClick={() => resolveAlert(alert.id)}
                                                className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200"
                                            >
                                                Resolve
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {activeAlerts.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                                    <p>No active alerts</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Alert Rules */}
                <div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold">Alert Rules</h2>
                            <button
                                onClick={() => setShowRuleModal(true)}
                                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                <Plus className="h-4 w-4" />
                                Add Rule
                            </button>
                        </div>
                        <div className="space-y-3">
                            {rules.map(rule => (
                                <div key={rule.id} className="border rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium">{rule.name}</span>
                                        <button
                                            onClick={() => toggleRule(rule.id)}
                                            className={`w-10 h-6 rounded-full ${rule.enabled ? 'bg-blue-600' : 'bg-gray-300'} relative transition-colors`}
                                        >
                                            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${rule.enabled ? 'translate-x-5' : 'translate-x-1'}`}></div>
                                        </button>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        <p>{rule.metric} {rule.condition.replace('_', ' ')} {rule.threshold}%</p>
                                        <p>For {rule.duration} minutes</p>
                                        <div className="flex gap-1 mt-1">
                                            {rule.notifications.includes('email') && <Mail className="h-4 w-4" />}
                                            {rule.notifications.includes('slack') && <MessageSquare className="h-4 w-4" />}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Rule Modal */}
            {showRuleModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Add Alert Rule</h3>
                            <button onClick={() => setShowRuleModal(false)}>
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Rule Name</label>
                                <input
                                    type="text"
                                    value={newRule.name}
                                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                                    className="w-full p-2 border rounded-md"
                                    placeholder="Enter rule name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Metric</label>
                                <select
                                    value={newRule.metric}
                                    onChange={(e) => setNewRule({ ...newRule, metric: e.target.value })}
                                    className="w-full p-2 border rounded-md"
                                >
                                    <option value="CPU">CPU</option>
                                    <option value="Memory">Memory</option>
                                    <option value="Network">Network</option>
                                    <option value="Disk">Disk</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Threshold (%)</label>
                                <input
                                    type="number"
                                    value={newRule.threshold}
                                    onChange={(e) => setNewRule({ ...newRule, threshold: parseInt(e.target.value) })}
                                    className="w-full p-2 border rounded-md"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
                                <input
                                    type="number"
                                    value={newRule.duration}
                                    onChange={(e) => setNewRule({ ...newRule, duration: parseInt(e.target.value) })}
                                    className="w-full p-2 border rounded-md"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Severity</label>
                                <select
                                    value={newRule.severity}
                                    onChange={(e) => setNewRule({ ...newRule, severity: e.target.value })}
                                    className="w-full p-2 border rounded-md"
                                >
                                    <option value="info">Info</option>
                                    <option value="warning">Warning</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={addRule}
                                    className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
                                >
                                    Add Rule
                                </button>
                                <button
                                    onClick={() => setShowRuleModal(false)}
                                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AlertManagementSystem;