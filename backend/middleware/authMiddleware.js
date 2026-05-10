const jwt = require('jsonwebtoken');
const User = require('../models/mysql/User');

// Verify token and attach user object to request
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized to access this route');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401);
    throw new Error('Not authorized to access this route');
  }
};

// Ensure request user role is allowed
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      throw new Error('Not authorized');
    }

    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`User role '${req.user.role}' is not authorized to access this route`);
    }

    next();
  };
};

module.exports = {
  protect,
  authorize,
};
