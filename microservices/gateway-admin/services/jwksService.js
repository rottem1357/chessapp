const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const logger = require('../utils/logger');

let jwks = { keys: [] };

const rotateJWKS = () => {
  const kid = uuidv4();
  jwks.keys = [{
    kty: 'RSA',
    use: 'sig',
    alg: 'RS256',
    kid,
    n: crypto.randomBytes(64).toString('base64url'),
    e: 'AQAB'
  }];
  logger.info(`[audit] jwks_rotated kid=${kid}`);
};

const getJWKS = () => jwks;

rotateJWKS();
setInterval(rotateJWKS, 60 * 60 * 1000);

module.exports = { rotateJWKS, getJWKS };
