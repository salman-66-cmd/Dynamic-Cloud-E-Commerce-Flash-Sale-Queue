const config = require('../config/env');
const logger = require('../utils/logger');

const serverNodes = [
  { id: 'API-1', name: 'API Server 1 (us-east-1a)', ip: '10.0.1.12', status: 'HEALTHY', activeRequests: 0, totalRequests: 0, totalLatencyMs: 0, errorCount: 0 },
  { id: 'API-2', name: 'API Server 2 (us-east-1b)', ip: '10.0.2.45', status: 'HEALTHY', activeRequests: 0, totalRequests: 0, totalLatencyMs: 0, errorCount: 0 },
  { id: 'API-3', name: 'API Server 3 (us-east-1c)', ip: '10.0.3.89', status: 'HEALTHY', activeRequests: 0, totalRequests: 0, totalLatencyMs: 0, errorCount: 0 },
];

let roundRobinCounter = 0;
const routingLog = [];
const MAX_ROUTING_LOGS = 50;

function loadBalancerMiddleware(req, res, next) {
  // Select instance via Round Robin
  const nodeIndex = roundRobinCounter % serverNodes.length;
  roundRobinCounter++;
  const assignedNode = serverNodes[nodeIndex];

  assignedNode.totalRequests++;
  assignedNode.activeRequests++;

  req.assignedServer = assignedNode;
  const startTime = Date.now();

  // Set headers for transparent client inspection
  res.setHeader('X-Handled-By', assignedNode.id);
  res.setHeader('X-Server-Node', assignedNode.name);
  res.setHeader('X-Load-Balancer-Algo', 'Round-Robin-Weighted-L7');

  const logEntry = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp: new Date().toISOString(),
    path: req.originalUrl || req.url,
    method: req.method,
    routedTo: assignedNode.id,
    ip: req.ip || req.connection.remoteAddress,
  };

  routingLog.unshift(logEntry);
  if (routingLog.length > MAX_ROUTING_LOGS) {
    routingLog.pop();
  }

  // Hook finish to record response latency and active request count
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    assignedNode.activeRequests = Math.max(0, assignedNode.activeRequests - 1);
    assignedNode.totalLatencyMs += duration;
    if (res.statusCode >= 500) {
      assignedNode.errorCount++;
    }
  });

  next();
}

function getLoadBalancerStatus() {
  return {
    algorithm: 'Round Robin (L7 Application Load Balancer)',
    virtualVpc: 'vpc-cloudsale-prod-01',
    totalRouted: roundRobinCounter,
    instances: serverNodes.map((n) => ({
      id: n.id,
      name: n.name,
      ip: n.ip,
      status: n.status,
      activeRequests: n.activeRequests,
      totalRequests: n.totalRequests,
      avgLatencyMs: n.totalRequests > 0 ? Math.round(n.totalLatencyMs / n.totalRequests) : 12,
      errorCount: n.errorCount,
      sharePercentage: roundRobinCounter > 0 ? ((n.totalRequests / roundRobinCounter) * 100).toFixed(1) + '%' : '33.3%',
    })),
    recentRouting: routingLog.slice(0, 15),
  };
}

module.exports = {
  loadBalancerMiddleware,
  getLoadBalancerStatus,
  serverNodes,
};
