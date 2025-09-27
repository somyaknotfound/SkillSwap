const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId; // Password required only if not Google OAuth user
    },
    minlength: [6, 'Password must be at least 6 characters long']
  },
  googleId: {
    type: String,
    sparse: true // Allows multiple null values
  },
  avatar: {
    type: String,
    default: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
  },
  firstName: {
    type: String,
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: ''
  },
  location: {
    type: String,
    maxlength: [100, 'Location cannot exceed 100 characters'],
    default: ''
  },
  website: {
    type: String,
    match: [/^https?:\/\/.+/, 'Please enter a valid URL'],
    default: ''
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  role: {
    type: String,
    enum: ['student', 'instructor', 'admin'],
    default: 'student'
  },
  teachingHours: {
    type: Number,
    default: 0,
    min: [0, 'Teaching hours cannot be negative']
  },
  learningHours: {
    type: Number,
    default: 0,
    min: [0, 'Learning hours cannot be negative']
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be negative'],
    max: [5, 'Rating cannot exceed 5']
  },
  totalRatings: {
    type: Number,
    default: 0,
    min: [0, 'Total ratings cannot be negative']
  },
  skills: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill'
  }],
  enrolledCourses: [{
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    enrolledAt: {
      type: Date,
      default: Date.now
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    completed: {
      type: Boolean,
      default: false
    },
    lastAccessed: {
      type: Date,
      default: Date.now
    }
  }],
  teachingCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  preferences: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      courseUpdates: {
        type: Boolean,
        default: true
      },
      newMessages: {
        type: Boolean,
        default: true
      }
    },
    privacy: {
      profileVisibility: {
        type: String,
        enum: ['public', 'private', 'friends'],
        default: 'public'
      },
      showEmail: {
        type: Boolean,
        default: false
      },
      showLocation: {
        type: Boolean,
        default: true
      }
    }
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Credits and Badges System
  credits: {
    type: Number,
    default: 0,
    min: [0, 'Credits cannot be negative']
  },
  performance_points: {
    type: Number,
    default: 0,
    min: [0, 'Performance points cannot be negative']
  },
  badge_level: {
    type: String,
    enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Legend'],
    default: 'Bronze'
  },
  badge_tier: {
    type: Number,
    default: 3,
    min: [1, 'Badge tier must be at least 1'],
    max: [3, 'Badge tier cannot exceed 3']
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.username;
});

// Virtual for average rating
userSchema.virtual('averageRating').get(function() {
  if (this.totalRatings === 0) return 0;
  return this.rating / this.totalRatings;
});

// Virtual for badge discount percentage
userSchema.virtual('badgeDiscount').get(function() {
  const levelDiscounts = {
    'Bronze': 0,
    'Silver': 5,
    'Gold': 10,
    'Platinum': 15,
    'Diamond': 20,
    'Master': 25,
    'Legend': 30
  };
  
  const tierMultiplier = this.badge_tier === 1 ? 1.5 : this.badge_tier === 2 ? 1.25 : 1;
  return Math.min(levelDiscounts[this.badge_level] * tierMultiplier, 50); // Max 50% discount
});

// Virtual for badge display name
userSchema.virtual('badgeDisplayName').get(function() {
  const tierNames = { 1: 'I', 2: 'II', 3: 'III' };
  return `${this.badge_level} ${tierNames[this.badge_tier]}`;
});

// Index for better query performance (only non-unique indexes)
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ lastActive: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to get public profile
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.emailVerificationToken;
  delete userObject.passwordResetToken;
  delete userObject.passwordResetExpires;
  return userObject;
};

// Static method to find by email or username
userSchema.statics.findByEmailOrUsername = function(identifier) {
  return this.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: identifier }
    ]
  });
};

// Instance method to add performance points and check for badge upgrade
userSchema.methods.addPerformancePoints = async function(points) {
  this.performance_points += points;
  this.lastActivity = new Date();
  
  // Check for badge upgrade
  await this.checkBadgeUpgrade();
  
  return this.save();
};

// Instance method to check and upgrade badge
userSchema.methods.checkBadgeUpgrade = async function() {
  const thresholds = {
    'Bronze': { 1: 0, 2: 100, 3: 250 },
    'Silver': { 1: 500, 2: 750, 3: 1000 },
    'Gold': { 1: 1500, 2: 2000, 3: 2500 },
    'Platinum': { 1: 3500, 2: 4500, 3: 5500 },
    'Diamond': { 1: 7000, 2: 9000, 3: 11000 },
    'Master': { 1: 14000, 2: 18000, 3: 22000 },
    'Legend': { 1: 30000, 2: 40000, 3: 50000 }
  };
  
  const levels = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Legend'];
  const currentLevelIndex = levels.indexOf(this.badge_level);
  
  // Check if we can upgrade to next tier
  if (this.badge_tier < 3) {
    const nextTierThreshold = thresholds[this.badge_level][this.badge_tier + 1];
    if (this.performance_points >= nextTierThreshold) {
      this.badge_tier += 1;
      return true;
    }
  }
  
  // Check if we can upgrade to next level
  if (currentLevelIndex < levels.length - 1) {
    const nextLevel = levels[currentLevelIndex + 1];
    const nextLevelThreshold = thresholds[nextLevel][1];
    if (this.performance_points >= nextLevelThreshold) {
      this.badge_level = nextLevel;
      this.badge_tier = 1;
      return true;
    }
  }
  
  return false;
};

// Instance method to deduct credits
userSchema.methods.deductCredits = async function(amount) {
  if (this.credits < amount) {
    throw new Error('Insufficient credits');
  }
  this.credits -= amount;
  return this.save();
};

// Instance method to add credits
userSchema.methods.addCredits = async function(amount) {
  this.credits += amount;
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
