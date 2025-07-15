const request = require('supertest');

class LoadTester {
  constructor(app) {
    this.app = app;
    this.results = [];
  }

  async runConcurrentRequests(endpoint, options = {}) {
    const {
      concurrent = 10,
      total = 100,
      method = 'GET',
      body = null,
      headers = {}
    } = options;

    const startTime = Date.now();
    const promises = [];
    
    for (let i = 0; i < total; i++) {
      const promise = this.makeRequest(endpoint, method, body, headers);
      promises.push(promise);
      
      // Limit concurrent requests
      if (promises.length >= concurrent) {
        await Promise.allSettled(promises.splice(0, concurrent));
      }
    }
    
    // Wait for remaining requests
    if (promises.length > 0) {
      await Promise.allSettled(promises);
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    return {
      totalRequests: total,
      duration,
      requestsPerSecond: (total / duration) * 1000,
      averageResponseTime: this.getAverageResponseTime(),
      successRate: this.getSuccessRate()
    };
  }

  async makeRequest(endpoint, method, body, headers) {
    const startTime = Date.now();
    
    try {
      let req = request(this.app)[method.toLowerCase()](endpoint);
      
      Object.keys(headers).forEach(key => {
        req = req.set(key, headers[key]);
      });
      
      if (body) {
        req = req.send(body);
      }
      
      const response = await req;
      const endTime = Date.now();
      
      this.results.push({
        success: response.status < 400,
        status: response.status,
        responseTime: endTime - startTime
      });
      
      return response;
    } catch (error) {
      const endTime = Date.now();
      
      this.results.push({
        success: false,
        status: error.status || 500,
        responseTime: endTime - startTime,
        error: error.message
      });
      
      throw error;
    }
  }

  getAverageResponseTime() {
    if (this.results.length === 0) return 0;
    
    const total = this.results.reduce((sum, result) => sum + result.responseTime, 0);
    return total / this.results.length;
  }

  getSuccessRate() {
    if (this.results.length === 0) return 0;
    
    const successful = this.results.filter(result => result.success).length;
    return (successful / this.results.length) * 100;
  }

  reset() {
    this.results = [];
  }
}

module.exports = LoadTester;
