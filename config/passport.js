const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Serialize user into the sessions
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the sessions
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['profile', 'email']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ 'google.id': profile.id });
        
        if (existingUser) {
          return done(null, existingUser);
        }
        
        // Create new user
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : '';
        const newUser = new User({
          method: 'google',
          google: {
            id: profile.id,
            email: email
          },
          email: email,
          name: profile.displayName,
          role: 'user', // Default role is user
          avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : ''
        });
        
        await newUser.save();
        done(null, newUser);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

// Facebook Strategy
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL,
      profileFields: ['id', 'emails', 'name', 'displayName', 'photos']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ 'facebook.id': profile.id });
        
        if (existingUser) {
          return done(null, existingUser);
        }
        
        // Create new user
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : '';
        const newUser = new User({
          method: 'facebook',
          facebook: {
            id: profile.id,
            email: email
          },
          email: email,
          name: profile.displayName,
          role: 'user', // Default role is user
          avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : ''
        });
        
        await newUser.save();
        done(null, newUser);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

// Function to generate JWT token
const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  };

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
};

module.exports = {
  passport,
  generateToken
};
