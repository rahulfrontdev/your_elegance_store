const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getDefaultSpecialDiscountCategoryId } = require('../services/specialDiscountService');
const { sendPasswordResetEmail, smtpConfigured } = require('../services/mailService');
const { sendWelcomeEmail } = require('../services/orderEmailService');

const RESET_TOKEN_BYTES = 32;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

function hashResetToken(rawToken) {
  return crypto.createHash('sha256').update(String(rawToken)).digest('hex');
}

function getFrontendOrigin() {
  const fromEnv = String(process.env.FRONTEND_URL || process.env.CLIENT_URL || '').trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, '');
  return 'https://yourelegancestore.com';
}

function buildPasswordResetUrl(rawToken, { isAdmin = false } = {}) {
  const base = `${getFrontendOrigin()}/reset-password?token=${encodeURIComponent(rawToken)}`;
  return isAdmin ? `${base}&from=admin` : base;
}

const forgotPasswordMessage =
  'If an account exists for that email, a password reset link has been sent.';

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

    const defaultCategoryId = await getDefaultSpecialDiscountCategoryId();

    // Public registration is always customer — admin role cannot be self-assigned
    const user = await User.create({
      name,
      mobile,
      email: normalizedEmail,
      password,
      role: 'customer',
      specialDiscountCategory: defaultCategoryId,
    });

    if (smtpConfigured()) {
      sendWelcomeEmail({ to: normalizedEmail, name: user.name }).catch((err) => {
        console.error('Welcome email error:', err.message);
      });
    }

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

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const normalizedEmail = normalizeEmail(req.body?.email);
    if (!normalizedEmail) {
      return res.status(400).json({ message: 'Email is required' });
    }

    if (!smtpConfigured()) {
      console.error('[auth] forgot-password: SMTP is not configured');
      return res.status(503).json({
        message: 'Password reset email is temporarily unavailable. Please contact support.',
      });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (user) {
      const rawToken = crypto.randomBytes(RESET_TOKEN_BYTES).toString('hex');
      user.resetPasswordToken = hashResetToken(rawToken);
      user.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
      await user.save({ validateBeforeSave: false });

      const resetUrl = buildPasswordResetUrl(rawToken, { isAdmin: user.role === 'admin' });
      try {
        await sendPasswordResetEmail({
          to: user.email,
          name: user.name,
          resetUrl,
        });
      } catch (mailError) {
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save({ validateBeforeSave: false });
        console.error('Forgot password email error:', mailError.message);
        return res.status(503).json({
          message: 'Could not send reset email. Please try again later.',
        });
      }
    }

    return res.json({ message: forgotPasswordMessage });
  } catch (error) {
    console.error('Forgot password error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const rawToken = String(req.body?.token || '').trim();
    const password = String(req.body?.password || '');

    if (!rawToken) {
      return res.status(400).json({ message: 'Reset token is required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const hashedToken = hashResetToken(rawToken);
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset link. Please request a new one.' });
    }

    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.json({ message: 'Password updated successfully. You can sign in now.' });
  } catch (error) {
    console.error('Reset password error:', error.message);
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
  forgotPassword,
  resetPassword,
  getProfile,
};
