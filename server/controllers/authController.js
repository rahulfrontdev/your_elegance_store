const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, mobile, email, password } = req.body;

    if (!name || !mobile || !password) {
      return res.status(400).json({ message: 'Name, mobile and password are required' });
    }

    const mobileExists = await User.findOne({ mobile });
    if (mobileExists) {
      return res.status(400).json({ message: 'Mobile already registered' });
    }

    if (email) {
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({ message: 'Email already registered' });
      }
    }

    // Public registration is always customer — admin role cannot be self-assigned
    const user = await User.create({
      name,
      mobile,
      email: email || undefined,
      password,
      role: 'customer',
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      mobile: user.mobile,
      email: user.email,
      role: user.role
    });

  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, mobile, password } = req.body;

    if ((!email && !mobile) || !password) {
      return res.status(400).json({ message: 'Email or mobile and password are required' });
    }

    const user = await User.findOne(email ? { email } : { mobile });

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

