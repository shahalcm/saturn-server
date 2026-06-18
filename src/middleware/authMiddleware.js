const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Provider = require('../models/Provider');
const { errorResponse } = require('../utils/formatResponse');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return errorResponse(res, 'Not authorized, no token', 401);
  }

  try {
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.role === 'provider') {
        req.provider = await Provider.findById(decoded.id).select('-password');
        if (!req.provider) {
          return errorResponse(res, 'Not authorized, provider not found', 401);
        }
        req.userType = 'provider';
      } else {
        req.user = await User.findById(decoded.id).select('-password');
        if (!req.user) {
          return errorResponse(res, 'Not authorized, user not found', 401);
        }
        req.userType = 'user';
      }
      req.userId = decoded.id;
      req.userRole = decoded.role;
    } catch (err) {
      // Try verifying with ADMIN_JWT_SECRET
      decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
      if (decoded.role !== 'admin') {
        throw new Error('Not admin');
      }
      req.admin = decoded;
      req.userId = decoded.id;
      req.userRole = decoded.role;
      req.userType = 'admin';
    }

    next();
  } catch (error) {
    return errorResponse(res, 'Not authorized, token failed', 401);
  }
};

const adminProtect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    console.log('[AdminProtect] No token found in authorization header:', req.headers.authorization);
    return errorResponse(res, 'Not authorized', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    if (decoded.role !== 'admin') {
      console.log('[AdminProtect] Role is not admin:', decoded.role);
      return errorResponse(res, 'Admin access required', 403);
    }
    req.admin = decoded;
    next();
  } catch (error) {
    console.log('[AdminProtect] JWT verification error:', error.message);
    return errorResponse(res, 'Not authorized', 401);
  }
};

module.exports = { protect, adminProtect };
