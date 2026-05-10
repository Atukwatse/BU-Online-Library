const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const StaffLogin = require('../models/StaffLogin');

const createToken = (staff) =>
  jwt.sign(
    {
      staffDbId: staff._id,
      id: staff.id,
      username: staff.username,
      role: staff.role,
      department: staff.department,
    },
    process.env.JWT_SECRET || 'bugema-library-secret',
    { expiresIn: '8h' }
  );

const loginStaff = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const normalizedUsername = String(username).trim().toLowerCase();
    const staff = await StaffLogin.findOne({ username: normalizedUsername });

    if (!staff) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const passwordMatches = await bcrypt.compare(password, staff.password);

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const token = createToken(staff);

    return res.status(200).json({
      token,
      user: {
        id: staff.id,
        username: staff.username,
        department: staff.department,
        role: staff.role,
      },
      redirectTo: staff.role === 'admin' ? '/admin-dashboard.html' : '/staff-dashboard.html',
    });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed. Please try again.' });
  }
};

const getCurrentStaff = async (req, res) => {
  try {
    return res.status(200).json({
      user: {
        id: req.staff.id,
        username: req.staff.username,
        department: req.staff.department,
        role: req.staff.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load account details.' });
  }
};

module.exports = { loginStaff, getCurrentStaff };
