const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Skill title is required'],
    trim: true,
    maxlength: [100, 'Skill title cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Skill description cannot exceed 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Skill category is required'],
    enum: {
      values: ['programming', 'design', 'music', 'business', 'languages', 'photography', 'writing', 'marketing', 'cooking', 'fitness', 'art', 'other'],
      message: 'Invalid skill category'
    }
  },
  subcategory: {
    type: String,
    trim: true,
    maxlength: [50, 'Subcategory cannot exceed 50 characters']
  },
  level: {
    type: String,
    required: [true, 'Skill level is required'],
    enum: {
      values: ['beginner', 'intermediate', 'advanced', 'expert'],
      message: 'Invalid skill level'
    }
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  progress: {
    type: Number,
    default: 0,
    min: [0, 'Progress cannot be negative'],
    max: [100, 'Progress cannot exceed 100']
  },
  status: {
    type: String,
    enum: ['learning', 'completed', 'paused', 'abandoned'],
    default: 'learning'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  nextLesson: {
    type: String,
    maxlength: [200, 'Next lesson cannot exceed 200 characters']
  },
  dueDate: {
    type: Date
  },
  estimatedCompletionTime: {
    type: Number, // in hours
    min: [0, 'Estimated completion time cannot be negative']
  },
  actualTimeSpent: {
    type: Number, // in hours
    default: 0,
    min: [0, 'Actual time spent cannot be negative']
  },
  resources: [{
    title: {
      type: String,
      required: true,
      maxlength: [100, 'Resource title cannot exceed 100 characters']
    },
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['course', 'tutorial', 'book', 'article', 'video', 'practice', 'other'],
      default: 'course'
    },
    completed: {
      type: Boolean,
      default: false
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  milestones: [{
    title: {
      type: String,
      required: true,
      maxlength: [100, 'Milestone title cannot exceed 100 characters']
    },
    description: {
      type: String,
      maxlength: [300, 'Milestone description cannot exceed 300 characters']
    },
    targetDate: Date,
    completedAt: Date,
    isCompleted: {
      type: Boolean,
      default: false
    },
    order: {
      type: Number,
      default: 0
    }
  }],
  notes: [{
    content: {
      type: String,
      required: true,
      maxlength: [1000, 'Note content cannot exceed 1000 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'expert'],
    default: 'medium'
  },
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill'
  }],
  relatedSkills: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill'
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  isTeaching: {
    type: Boolean,
    default: false
  },
  teachingPrice: {
    type: Number,
    min: [0, 'Teaching price cannot be negative']
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD']
  },
  availability: {
    monday: [String], // Time slots like "10:00-12:00"
    tuesday: [String],
    wednesday: [String],
    thursday: [String],
    friday: [String],
    saturday: [String],
    sunday: [String]
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5']
    },
    count: {
      type: Number,
      default: 0,
      min: [0, 'Rating count cannot be negative']
    }
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      maxlength: [500, 'Review comment cannot exceed 500 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  students: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
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
  analytics: {
    views: {
      type: Number,
      default: 0
    },
    uniqueViews: {
      type: Number,
      default: 0
    },
    enrollments: {
      type: Number,
      default: 0
    },
    completions: {
      type: Number,
      default: 0
    },
    averageCompletionTime: {
      type: Number, // in days
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for completion percentage
skillSchema.virtual('completionPercentage').get(function() {
  if (this.milestones.length === 0) return this.progress;
  const completedMilestones = this.milestones.filter(m => m.isCompleted).length;
  return Math.round((completedMilestones / this.milestones.length) * 100);
});

// Virtual for time remaining
skillSchema.virtual('timeRemaining').get(function() {
  if (!this.estimatedCompletionTime || this.actualTimeSpent >= this.estimatedCompletionTime) {
    return 0;
  }
  return this.estimatedCompletionTime - this.actualTimeSpent;
});

// Virtual for days since started
skillSchema.virtual('daysSinceStarted').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.startedAt);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Indexes for better query performance
skillSchema.index({ user: 1 });
skillSchema.index({ category: 1 });
skillSchema.index({ level: 1 });
skillSchema.index({ status: 1 });
skillSchema.index({ isPublic: 1, isTeaching: 1 });
skillSchema.index({ title: 'text', description: 'text', tags: 'text' });
skillSchema.index({ 'rating.average': -1 });
skillSchema.index({ createdAt: -1 });
skillSchema.index({ lastUpdated: -1 });

// Pre-save middleware to update lastUpdated
skillSchema.pre('save', function(next) {
  if (this.isModified('progress') || this.isModified('status')) {
    this.lastUpdated = new Date();
  }
  
  // Set completedAt when status changes to completed
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  next();
});

// Instance method to add milestone
skillSchema.methods.addMilestone = function(title, description, targetDate, order = 0) {
  this.milestones.push({
    title,
    description,
    targetDate,
    order
  });
  return this.save();
};

// Instance method to complete milestone
skillSchema.methods.completeMilestone = function(milestoneId) {
  const milestone = this.milestones.id(milestoneId);
  if (milestone) {
    milestone.isCompleted = true;
    milestone.completedAt = new Date();
    return this.save();
  }
  throw new Error('Milestone not found');
};

// Instance method to add note
skillSchema.methods.addNote = function(content) {
  this.notes.push({ content });
  return this.save();
};

// Instance method to update progress
skillSchema.methods.updateProgress = function(progress) {
  this.progress = Math.min(Math.max(progress, 0), 100);
  this.lastUpdated = new Date();
  
  // Auto-complete if progress reaches 100%
  if (this.progress === 100 && this.status !== 'completed') {
    this.status = 'completed';
    this.completedAt = new Date();
  }
  
  return this.save();
};

// Instance method to add review
skillSchema.methods.addReview = function(userId, rating, comment) {
  // Remove existing review by this user
  this.reviews = this.reviews.filter(review => !review.user.equals(userId));
  
  // Add new review
  this.reviews.push({
    user: userId,
    rating,
    comment
  });
  
  // Recalculate average rating
  const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
  this.rating.average = totalRating / this.reviews.length;
  this.rating.count = this.reviews.length;
  
  return this.save();
};

// Instance method to enroll student
skillSchema.methods.enrollStudent = function(userId) {
  // Check if student is already enrolled
  const existingEnrollment = this.students.find(student => student.user.equals(userId));
  if (existingEnrollment) {
    throw new Error('Student is already enrolled');
  }
  
  this.students.push({
    user: userId
  });
  
  this.analytics.enrollments += 1;
  
  return this.save();
};

module.exports = mongoose.model('Skill', skillSchema);
