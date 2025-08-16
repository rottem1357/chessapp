const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-http');
const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');
const promClient = require('prom-client');

// OpenTelemetry setup
const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318';
const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({ url: `${otlpEndpoint}/v1/traces` }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({ url: `${otlpEndpoint}/v1/metrics` }),
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

if (process.env.NODE_ENV !== 'test') {
  sdk.start().then(() => {
    console.log('Telemetry initialized');
  }).catch(err => {
    console.error('Telemetry initialization failed', err);
  });
}

// Prometheus metrics setup
promClient.collectDefaultMetrics();
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.1, 0.3, 0.5, 1, 1.5, 2, 5]
});

const matchmakingRequests = new promClient.Counter({
  name: 'matchmaking_requests_total',
  help: 'Total matchmaking requests'
});

const gameMoveLatency = new promClient.Histogram({
  name: 'game_move_latency_seconds',
  help: 'Latency of game moves in seconds',
  buckets: [0.1, 0.5, 1, 2, 5]
});

const dbQueryDuration = new promClient.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1]
});

module.exports = {
  register: promClient.register,
  httpRequestDuration,
  matchmakingRequests,
  gameMoveLatency,
  dbQueryDuration,
};
