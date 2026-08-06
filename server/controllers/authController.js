const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, mobile, email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!name || !mobile || !normalizedEmail || !password) {
      return res.status(400).json({ message: 'Name, mobile, email and password are required' });
    }

    const mobileExists = await User.findOne({ mobile });
    if (mobileExists) {
      return res.status(400).json({ message: 'Mobile already registered' });
    }

    const emailExists = await User.findOne({ email: normalizedEmail });
    if (emailExists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Public registration is always customer — admin role cannot be self-assigned
    const user = await User.create({
      name,
      mobile,
      email: normalizedEmail,
      password,
      role: 'customer',
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      mobile: user.mobile,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/auth/login — email only (no mobile login)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    return res.json({
      _id: user._id,
      name: user.name,
      mobile: user.mobile,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/auth/profile
const getProfile = async (req, res) => {
  return res.json(req.user);
};

module.exports = {
  register,
  login,
  getProfile,
};
