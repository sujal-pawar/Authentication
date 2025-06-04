const express = require('express');
const router = express.Router();
const { passport } = require('../config/passport');
const { 
  googleCallback, 
  facebookCallback, 
  logout, 
  getCurrentUser, 
  updateUserRole 
} = require('../controllers/authController');
const { protect, authorize } = require('../middlewares/auth');

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/auth/failure` }), 
  googleCallback
);

// Facebook OAuth routes
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
router.get('/facebook/callback', 
  passport.authenticate('facebook', { session: false, failureRedirect: `${process.env.CLIENT_URL}/auth/failure` }), 
  facebookCallback
);

// Get current logged in user
router.get('/user', protect, getCurrentUser);

// Update user role (admin only)
router.put('/role/:userId', protect, authorize('admin'), updateUserRole);

// Logout
router.get('/logout', logout);

module.exports = router;
