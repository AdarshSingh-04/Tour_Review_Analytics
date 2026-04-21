// middleware/auth.js — JWT Middleware

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes — requires valid JWT
const protect = async (req, res, next) => {
  let token;

  // Check for Bearer token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tour_secret_key_2024');
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token invalid or expired' });
  }
};

// Admin-only middleware (use after protect)
const adminOnly = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    return next();
  }
  res.status(403).json({ message: 'Access denied. Admin only.' });
};

module.exports = { protect, adminOnly };
