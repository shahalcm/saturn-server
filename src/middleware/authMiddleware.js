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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role === 'provider') {
      req.provider = await Provider.findById(decoded.id).select('-password');
      req.userType = 'provider';
    } else {
      req.user = await User.findById(decoded.id).select('-password');
      req.userType = 'user';
    }

    req.userId = decoded.id;
    req.userRole = decoded.role;
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

  if (!token) return errorResponse(res, 'Not authorized', 401);

  try {
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    if (decoded.role !== 'admin') {
      return errorResponse(res, 'Admin access required', 403);
    }
    req.admin = decoded;
    next();
  } catch (error) {
    return errorResponse(res, 'Not authorized', 401);
  }
};

module.exports = { protect, adminProtect };
