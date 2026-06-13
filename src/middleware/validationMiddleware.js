const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/formatResponse');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMsg = errors.array().map(err => err.msg).join(', ');
    return errorResponse(res, errorMsg, 400);
  }
  next();
};

module.exports = validate;
