const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const User = require('../models/User');

// Protects routes: requires a valid Bearer JWT, attaches req.user.
const protect = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    throw new AppError('Not authorized. Please log in.', 401);
  }
  try {
    const secret = process.env.JWT_SECRET || 'athletix_jwt_secret_dev_fallback_key';
    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded.id);
    if (!user) throw new AppError('User no longer exists.', 401);
    req.user = user; // full user doc; every downstream query must filter by req.user._id
    next();
  } catch (err) {
    throw new AppError('Invalid or expired token.', 401);
  }
});

module.exports = { protect };
