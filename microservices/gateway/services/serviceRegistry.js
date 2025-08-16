// microservices/gateway/services/serviceRegistry.js
const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

class ServiceRegistry {
  constructor() {
    this.services = new Map();
    this.healthChecks = new Map();
    this.initializeServices();
    this.startHealthChecks();
  }

  initializeServices() {
    Object.entries(config.services).forEach(([name, serviceConfig]) => {
      this.services.set(name, {
        ...serviceConfig,
        status: 'unknown',
        lastCheck: null,
        consecutiveFailures: 0
      });
    });
  }

  getServiceUrl(serviceName) {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found in registry`);
    }
    return service.url;
  }

  getAllServices() {
    const services = {};
    this.services.forEach((service, name) => {
      services[name] = {
        url: service.url,
        status: service.status,
        lastCheck: service.lastCheck,
        consecutiveFailures: service.consecutiveFailures
      };
    });
    return services;
  }

  getHealthStatus() {
    const healthy = [];
    const unhealthy = [];
    
    this.services.forEach((service, name) => {
      if (service.status === 'healthy') {
        healthy.push(name);
      } else {
        unhealthy.push(name);
      }
    });
    
    return { healthy, unhealthy };
  }

  async checkServiceHealth(serviceName) {
    const service = this.services.get(serviceName);
    if (!service) return false;

    try {
      const response = await axios.get(
        `${service.url}${service.healthPath}`,
        { timeout: service.timeout }
      );
      
      const isHealthy = response.status === 200;
      this.updateServiceStatus(serviceName, isHealthy);
      
      return isHealthy;
    } catch (error) {
      logger.warn('Service health check failed', {
        service: serviceName,
        error: error.message
      });
      
      this.updateServiceStatus(serviceName, false);
      return false;
    }
  }

  updateServiceStatus(serviceName, isHealthy) {
    const service = this.services.get(serviceName);
    if (!service) return;

    service.lastCheck = new Date().toISOString();
    
    if (isHealthy) {
      service.status = 'healthy';
      service.consecutiveFailures = 0;
    } else {
      service.status = 'unhealthy';
      service.consecutiveFailures++;
    }

    this.services.set(serviceName, service);
  }

  startHealthChecks() {
    // Check every 30 seconds
    setInterval(() => {
      this.services.forEach((service, name) => {
        this.checkServiceHealth(name);
      });
    }, 30000);

    // Initial health check
    setTimeout(() => {
      this.services.forEach((service, name) => {
        this.checkServiceHealth(name);
      });
    }, 1000);
  }

  // Register new service dynamically (for future use)
  registerService(name, config) {
    this.services.set(name, {
      ...config,
      status: 'unknown',
      lastCheck: null,
      consecutiveFailures: 0
    });
    
    logger.info('Service registered', { service: name, config });
  }

  // Unregister service
  unregisterService(name) {
    this.services.delete(name);
    logger.info('Service unregistered', { service: name });
  }
}

module.exports = { serviceRegistry: new ServiceRegistry() };