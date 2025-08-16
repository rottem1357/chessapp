const serviceRegistry = new Map();

const registerService = (name, url) => {
  serviceRegistry.set(name, { url, updatedAt: new Date().toISOString() });
};

const listServices = () =>
  Array.from(serviceRegistry.entries()).map(([name, data]) => ({ name, ...data }));

module.exports = { registerService, listServices };
