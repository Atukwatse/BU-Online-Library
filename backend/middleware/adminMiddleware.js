const { getUserById } = require('../utils/userUtils'); // optional helper if needed

// Admin middleware – ensures the authenticated user has role 'Admin'
module.exports = (req, res, next) => {
  // Assuming authentication middleware already attached user info to req.user
  if (req.user && req.user.Role && req.user.Role.toLowerCase() === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Access denied. Admins only.' });
};
