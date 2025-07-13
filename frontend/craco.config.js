const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Fix for dev server allowedHosts issue
      if (webpackConfig.devServer) {
        webpackConfig.devServer.allowedHosts = 'all';
      }
      
      // Suppress source map warnings for node_modules
      webpackConfig.ignoreWarnings = [
        {
          module: /node_modules/,
          message: /Failed to parse source map/,
        },
      ];
      
      return webpackConfig;
    },
  },
  devServer: {
    allowedHosts: 'all',
  },
};
