const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Fix for dev server allowedHosts issue
      if (webpackConfig.devServer) {
        webpackConfig.devServer.allowedHosts = 'all';
      }
      return webpackConfig;
    },
  },
  devServer: {
    allowedHosts: 'all',
  },
};
