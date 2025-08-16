require('dotenv').config();

const config = {
  server: {
    port: parseInt(process.env.TOURNAMENT_PORT || '8090'),
    environment: process.env.NODE_ENV || 'development',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

module.exports = config;
