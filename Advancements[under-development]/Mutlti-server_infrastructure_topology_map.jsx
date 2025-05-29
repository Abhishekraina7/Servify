import React, { useState, useRef, useEffect } from 'react';
import { Server, Database, Globe, Wifi, AlertTriangle, CheckCircle, Settings, Eye, Activity } from 'lucide-react';

const InfrastructureMap = () => {
    const [selectedNode, setSelectedNode] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [viewMode, setViewMode] = useState('topology'); // topology, performance, alerts

    const [servers, setServers] = useState([
        {
            id: 'web-1',
            name: 'Web Server 1',
            type: 'web',
            status: 'healthy',
            position: { x: 150, y: 100 },
            metrics: { cpu: 45, memory: 60, network: 30 },
            connections: ['load-balancer', 'db-1'],
            alerts: 0,
            region: 'us-east-1'
        },
        {
            id: 'web-2',
            name: 'Web Server 2',
            type: 'web',
            status: 'warning',
            position: { x: 350, y: 100 },
            metrics: { cpu: 85, memory: 70, network: 45 },
            connections: ['load-balancer', 'db-1'],
            alerts: 1,
            region: 'us-east-1'
        },
        {
            id: 'load-balancer',
            name: 'Load Balancer',
            type: 'network',
            status: 'healthy',
            position: { x: 250, y: 50 },
            metrics: { cpu: 25, memory: 40, network: 80 },
            connections: ['web-1', 'web-2'],
            alerts: 0,
            region: 'us-east-1'
        },
        {
            id: 'db-1',
            name: 'Primary Database',
            type: 'database',
            status: 'healthy',
            position: { x: 150, y: 200 },
            metrics: { cpu: 55, memory: 75, network: 25 },
            connections: ['web-1', 'web-2', 'db-2'],
            alerts: 0,
            region: 'us-east-1'
        },
        {
            id: 'db-2',
            name: 'Backup Database',
            type: 'database',
            status: 'healthy',
            position: { x: 350, y: 200 },
            metrics: { cpu: 35, memory: 45, network: 15 },
            connections: ['db-1'],
            alerts: 0,
            region: 'us-west-2'
        },
        {
            id: 'api-gateway',
            name: 'API Gateway',
            type: 'api',
            status: 'critical',
            position: { x: 250, y: 150 },
            metrics: { cpu: 95, memory: 88, network: 92 },
            connections: ['web-1', 'web-2', 'external'],
            alerts: 3,
            region: 'us-east-1'
        }
    ]);

    const getServerIcon = (type) => {
        switch (type) {
            case 'web':
                return <Server className="h-6 w-6" />;
            case 'database':
                return <Database className="h-6 w-6" />;
            case 'network':
                return <Wifi className="h-6 w-6" />;
            case 'api':
                return <Globe className="h-6 w-6" />;
            default:
                return <Server className="h-6 w-6" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'healthy':
                return 'bg-green-500 border-green-600';
            case 'warning':
                return 'bg-yellow-500 border-yellow-600';
            case 'critical':
                return 'bg-red-500 border-red-600';
            case 'offline':
                return 'bg-gray-500 border-gray-600';
            default:
                return 'bg-gray-500 border-gray-600';
        }
    };

    const getPerformanceColor = (value) => {
        if (value >= 90) return 'text-red-500';
        if (value >= 70) return 'text-yellow-500';
        return 'text-green-500';
    };

    const handleMouseDown = (e, server) => {
        if (e.button === 0) { // Left click only
            setIsDragging(true);
            setSelectedNode(server);
            const rect = e.currentTarget.getBoundingClientRect();
            setDragOffset({
                x: e.clientX - rect.left - server.position.x,
                y: e.clientY - rect.top - server.position.y
            });
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging && selectedNode) {
            const rect = e.currentTarget.getBoundingClientRect();
            const newX = e.clientX - rect.left - dragOffset.x;
            const newY = e.clientY - rect.top - dragOffset.y;

            setServers(servers.map(server =>
                server.id === selectedNode.id
                    ? { ...server, position: { x: Math.max(0, Math.min(500, newX)), y: Math.max(0, Math.min(300, newY)) } }
                    : server
            ));
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setDragOffset({ x: 0, y: 0 });
    };

    const renderConnections = () => {
        const connections = [];
        servers.forEach(server => {
            server.connections.forEach(connId => {
                const targetServer = servers.find(s => s.id === connId);
                if (targetServer && server.id < connId) { // Avoid duplicate connections
                    const isHighTraffic = viewMode === 'performance' &&
                        (server.metrics.network > 70 || targetServer.metrics.network > 70);

                    connections.push(
                        <line
                            key={`${server.id}-${connId}`}
                            x1={server.position.x + 25}
                            y1={server.position.y + 25}
                            x2={targetServer.position.x + 25}
                            y2={targetServer.position.y + 25}
                            stroke={isHighTraffic ? "#ef4444" : "#6b7280"}
                            strokeWidth={isHighTraffic ? "3" : "2"}
                            strokeDasharray={isHighTraffic ? "5,5" : "none"}
                            opacity="0.6"
                        />
                    );
                }
            });
        });
        return connections;
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-3xl font-bold text-gray-900">Infrastructure Map</h1>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setViewMode('topology')}
                            className={`px-4 py-2 rounded-md flex items-center gap-2 ${viewMode === 'topology' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                                }`}
                        >
                            <Eye className="h-4 w-4" />
                            Topology
                        </button>
                        <button
                            onClick={() => setViewMode('performance')}
                            className={`px-4 py-2 rounded-md flex items-center gap-2 ${viewMode === 'performance' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                                }`}
                        >
                            <Activity className="h-4 w-4" />
                            Performance
                        </button>
                        <button
                            onClick={() => setViewMode('alerts')}
                            className={`px-4 py-2 rounded-md flex items-center gap-2 ${viewMode === 'alerts' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                                }`}
                        >
                            <AlertTriangle className="h-4 w-4" />
                            Alerts
                        </button>
                    </div>
                </div>

                <div className="flex gap-6 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        Healthy: {servers.filter(s => s.status === 'healthy').length}
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        Warning: {servers.filter(s => s.status === 'warning').length}
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        Critical: {servers.filter(s => s.status === 'critical').length}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Main Map */}
                <div className="lg:col-span-3 bg-white rounded-lg shadow-md p-6">
                    <svg
                        width="100%"
                        height="400"
                        viewBox="0 0 600 350"
                        className="border rounded-lg bg-gray-50"
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        {/* Render connections */}
                        {renderConnections()}

                        {/* Render servers */}
                        {servers.map(server => (
                            <g key={server.id}>
                                {/* Server node */}
                                <circle
                                    cx={server.position.x + 25}
                                    cy={server.position.y + 25}
                                    r={viewMode === 'performance' ? Math.max(20, server.metrics.cpu / 2) : 25}
                                    className={`${getStatusColor(server.status)} cursor-pointer hover:opacity-80 transition-all`}
                                    onMouseDown={(e) => handleMouseDown(e, server)}
                                    onClick={() => setSelectedNode(server)}
                                />

                                {/* Server icon */}
                                <foreignObject
                                    x={server.position.x + 19}
                                    y={server.position.y + 19}
                                    width="12"
                                    height="12"
                                    className="pointer-events-none"
                                >
                                    <div className="text-white">
                                        {getServerIcon(server.type)}
                                    </div>
                                </foreignObject>

                                {/* Server label */}
                                <text
                                    x={server.position.x + 25}
                                    y={server.position.y + 60}
                                    textAnchor="middle"
                                    className="text-xs font-medium fill-gray-700"
                                >
                                    {server.name}
                                </text>

                                {/* Performance metrics overlay */}
                                {viewMode === 'performance' && (
                                    <text
                                        x={server.position.x + 25}
                                        y={server.position.y + 75}
                                        textAnchor="middle"
                                        className={`text-xs font-bold ${getPerformanceColor(server.metrics.cpu)}`}
                                    >
                                        CPU: {server.metrics.cpu}%
                                    </text>
                                )}

                                {/* Alert indicators */}
                                {viewMode === 'alerts' && server.alerts > 0 && (
                                    <circle
                                        cx={server.position.x + 40}
                                        cy={server.position.y + 10}
                                        r="8"
                                        className="fill-red-500"
                                    />
                                )}
                                {viewMode === 'alerts' && server.alerts > 0 && (
                                    <text
                                        x={server.position.x + 40}
                                        y={server.position.y + 14}
                                        textAnchor="middle"
                                        className="text-xs font-bold fill-white"
                                    >
                                        {server.alerts}
                                    </text>
                                )}
                            </g>
                        ))}
                    </svg>
                </div>

                {/* Server Details Panel */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    {selectedNode ? (
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-2 rounded-lg ${getStatusColor(selectedNode.status)} text-white`}>
                                    {getServerIcon(selectedNode.type)}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{selectedNode.name}</h3>
                                    <span className="text-sm text-gray-500">{selectedNode.region}</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>CPU Usage</span>
                                        <span className={getPerformanceColor(selectedNode.metrics.cpu)}>
                                            {selectedNode.metrics.cpu}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${selectedNode.metrics.cpu >= 90 ? 'bg-red-500' :
                                                    selectedNode.metrics.cpu >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                                                }`}
                                            style={{ width: `${selectedNode.metrics.cpu}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Memory Usage</span>
                                        <span className={getPerformanceColor(selectedNode.metrics.memory)}>
                                            {selectedNode.metrics.memory}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${selectedNode.metrics.memory >= 90 ? 'bg-red-500' :
                                                    selectedNode.metrics.memory >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                                                }`}
                                            style={{ width: `${selectedNode.metrics.memory}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Network Usage</span>
                                        <span className={getPerformanceColor(selectedNode.metrics.network)}>
                                            {selectedNode.metrics.network}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${selectedNode.metrics.network >= 90 ? 'bg-red-500' :
                                                    selectedNode.metrics.network >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                                                }`}
                                            style={{ width: `${selectedNode.metrics.network}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {selectedNode.alerts > 0 && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                        <div className="flex items-center gap-2 text-red-700 mb-2">
                                            <AlertTriangle className="h-4 w-4" />
                                            <span className="font-medium">{selectedNode.alerts} Active Alert{selectedNode.alerts > 1 ? 's' : ''}</span>
                                        </div>
                                        <div className="text-sm text-red-600">
                                            High resource utilization detected
                                        </div>
                                    </div>
                                )}

                                <div className="pt-3 border-t">
                                    <h4 className="font-medium text-gray-900 mb-2">Connections</h4>
                                    <div className="space-y-1">
                                        {selectedNode.connections.map(connId => {
                                            const connectedServer = servers.find(s => s.id === connId);
                                            return connectedServer ? (
                                                <div key={connId} className="flex items-center gap-2 text-sm">
                                                    <div className={`w-2 h-2 rounded-full ${getStatusColor(connectedServer.status).split(' ')[0]}`}></div>
                                                    <span>{connectedServer.name}</span>
                                                </div>
                                            ) : (
                                                <div key={connId} className="flex items-center gap-2 text-sm">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                    <span>External Service</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <button className="w-full mt-4 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 flex items-center justify-center gap-2">
                                    <Settings className="h-4 w-4" />
                                    Manage Server
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <Server className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                            <p>Select a server to view details</p>
                            <p className="text-sm mt-1">Click on any node in the map</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Legend */}
            <div className="mt-6 bg-white rounded-lg shadow-md p-4">
                <h3 className="font-medium text-gray-900 mb-3">Legend</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <Server className="h-4 w-4 text-blue-600" />
                        <span>Web Server</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-green-600" />
                        <span>Database</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Wifi className="h-4 w-4 text-purple-600" />
                        <span>Network Device</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-orange-600" />
                        <span>API Gateway</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InfrastructureMap;