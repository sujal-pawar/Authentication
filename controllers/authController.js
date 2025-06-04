const User = require('../models/User');
const { generateToken } = require('../config/passport');

// @desc    Get current user
// @route   GET /api/auth/user
// @access  Private
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-local.password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Handle Google/Facebook OAuth callback
// @route   GET /api/auth/(google|facebook)/callback
// @access  Public
exports.googleCallback = async (req, res) => {
  try {
    // Set role based on login path
    if (req.isAdminLogin) {
      req.user.role = 'admin';
      await User.findByIdAndUpdate(req.user.id, { role: 'admin' });
    }

    // Generate JWT token
    const token = generateToken(req.user);

    // Redirect to appropriate dashboard
    const redirectPath = req.user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
    res.redirect(`${process.env.CLIENT_URL}${redirectPath}?token=${token}`);
  } catch (error) {
    res.redirect(`${process.env.CLIENT_URL}/auth/failure`);
  }
};

// @desc    Handle Facebook OAuth callback
// @route   GET /api/auth/facebook/callback
// @access  Public
exports.facebookCallback = async (req, res) => {
  try {
    // Set role based on login path
    if (req.isAdminLogin) {
      req.user.role = 'admin';
      await User.findByIdAndUpdate(req.user.id, { role: 'admin' });
    }

    // Generate JWT token
    const token = generateToken(req.user);

    // Redirect to frontend with token
    res.redirect(`${process.env.CLIENT_URL}/auth/success?token=${token}`);
  } catch (error) {
    res.redirect(`${process.env.CLIENT_URL}/auth/failure`);
  }
};

// @desc    Handle OAuth logout
// @route   GET /api/auth/logout
// @access  Private
exports.logout = (req, res) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.status(200).json({ success: true, message: 'Successfully logged out' });
  });
};

// @desc    Update user role (Admin only)
// @route   PUT /api/auth/role/:userId
// @access  Private/Admin
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid role (user or admin)'
      });
    }

    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `No user found with id ${req.params.userId}`
      });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Register user with email/password
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, isAdmin } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Create user
    user = await User.create({
      name,
      email,
      password,
      role: isAdmin ? 'admin' : 'user'  // Set role based on registration type
    });

    // Generate OTP for verification
    const otp = user.generateOTP();
    await user.save();

    // TODO: Send OTP via email
    // For development, return OTP
    if (process.env.NODE_ENV === 'development') {
      return res.status(200).json({
        success: true,
        message: 'User registered. Please verify your email.',
        data: { 
          email,
          otp: process.env.NODE_ENV === 'development' ? otp : undefined
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'User registered. Please verify your email.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Login user with email/password
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      // Generate new OTP if needed
      const otp = user.generateOTP();
      await user.save();

      return res.status(401).json({
        success: false,
        message: 'Please verify your email first',
        data: {
          requiresVerification: true,
          email,
          otp: process.env.NODE_ENV === 'development' ? otp : undefined
        }
      });
    }

    // Generate token and send response
    const token = signToken(user._id);
    
    // Determine redirect URL based on role
    const redirectUrl = user.role === 'admin' ? '/admin/dashboard' : '/dashboard';

    res.status(200).json({
      success: true,
      token,
      redirectUrl,
      data: { user }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Verify email with OTP
// @route   POST /api/auth/verify-email
// @access  Public
exports.verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find user and include OTP fields
    const user = await User.findOne({ email }).select('+otpSecret +otpExpires');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify OTP
    if (!user.verifyOTP(otp)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Update user verification status
    user.isEmailVerified = true;
    user.otpSecret = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Generate token and determine redirect
    const token = signToken(user._id);
    const redirectUrl = user.role === 'admin' ? '/admin/dashboard' : '/dashboard';

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      token,
      redirectUrl,
      data: { user }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
