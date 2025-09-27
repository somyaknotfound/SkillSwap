const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// Google OAuth Strategy (only if credentials are provided)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
  }, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('Google OAuth profile received:', {
      id: profile.id,
      displayName: profile.displayName,
      email: profile.emails?.[0]?.value,
      photos: profile.photos?.[0]?.value
    });

    // Check if user already exists with this Google ID
    let user = await User.findOne({ googleId: profile.id });
    console.log('User found by Google ID:', user ? 'Yes' : 'No');
    
    if (user) {
      console.log('Returning existing user:', user._id);
      return done(null, user);
    }

    // Check if user exists with this email
    user = await User.findOne({ email: profile.emails[0].value });
    console.log('User found by email:', user ? 'Yes' : 'No');
    
    if (user) {
      // Link Google account to existing user
      console.log('Linking Google account to existing user:', user._id);
      user.googleId = profile.id;
      user.isEmailVerified = true;
      await user.save();
      return done(null, user);
    }

    // Create new user
    console.log('Creating new user from Google profile');
    const nameParts = profile.displayName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Generate username from email
    const baseUsername = profile.emails[0].value.split('@')[0];
    let username = baseUsername;
    let counter = 1;
    
    // Ensure username is unique
    while (await User.findOne({ username })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    user = await User.create({
      googleId: profile.id,
      email: profile.emails[0].value,
      username,
      firstName,
      lastName,
      avatar: profile.photos[0]?.value || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      isEmailVerified: true
    });

    console.log('New user created:', user._id);
    return done(null, user);
  } catch (error) {
    console.error('Google OAuth error:', error);
    return done(error, null);
  }
  }));
} else {
  console.log('⚠️  Google OAuth credentials not provided. Google login will be disabled.');
}

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
