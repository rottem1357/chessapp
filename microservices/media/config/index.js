const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  server: {
    port: process.env.PORT || 8080,
  },
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    bucket: process.env.AWS_S3_BUCKET || 'chessapp-media',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'dummy',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'dummy',
    urlExpiry: parseInt(process.env.AWS_URL_EXPIRY || '60', 10),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};
