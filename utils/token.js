const jwt = require('jsonwebtoken');

/**
 * Sign a JWT for a user id.
 */
function signToken(userId, secret, expiresIn = '7d') {
  return jwt.sign({ sub: userId }, secret, { expiresIn });
}

/**
 * Verify a JWT and return its payload, or null when invalid/expired.
 */
function verifyToken(token, secret) {
  try {
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
}

module.exports = { signToken, verifyToken };
