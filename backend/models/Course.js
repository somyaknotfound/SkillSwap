const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    maxlength: [100, 'Course title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Course description is required'],
    maxlength: [2000, 'Course description cannot exceed 2000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [300, 'Short description cannot exceed 300 characters']
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Instructor is required']
  },
  category: {
    type: String,
    required: [true, 'Course category is required'],
    enum: {
      values: ['programming', 'design', 'music', 'business', 'languages', 'photography', 'writing', 'marketing', 'other'],
      message: 'Invalid course category'
    }
  },
  subcategory: {
    type: String,
    trim: true,
    maxlength: [50, 'Subcategory cannot exceed 50 characters']
  },
  level: {
    type: String,
    required: [true, 'Course level is required'],
    enum: {
      values: ['beginner', 'intermediate', 'advanced'],
      message: 'Invalid course level'
    }
  },
  price: {
    type: Number,
    required: [true, 'Course price is required'],
    min: [0, 'Price cannot be negative'],
    max: [10000, 'Price cannot exceed $10,000']
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD']
  },
  duration: {
    weeks: {
      type: Number,
      required: [true, 'Course duration in weeks is required'],
      min: [1, 'Duration must be at least 1 week'],
      max: [52, 'Duration cannot exceed 52 weeks']
    },
    hoursPerWeek: {
      type: Number,
      default: 5,
      min: [1, 'Hours per week must be at least 1'],
      max: [40, 'Hours per week cannot exceed 40']
    },
    totalHours: {
      type: Number,
      min: [1, 'Total hours must be at least 1']
    }
  },
  image: {
    type: String,
    default: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=250&fit=crop'
  },
  thumbnail: {
    type: String
  },
  images: [{
    type: String
  }],
  videos: [{
    title: {
      type: String,
      required: true,
      maxlength: [100, 'Video title cannot exceed 100 characters']
    },
    url: {
      type: String,
      required: true
    },
    duration: {
      type: Number, // in minutes
      required: true
    },
    isPreview: {
      type: Boolean,
      default: false
    },
    order: {
      type: Number,
      default: 0
    }
  }],
  curriculum: [{
    week: {
      type: Number,
      required: true
    },
    title: {
      type: String,
      required: true,
      maxlength: [100, 'Week title cannot exceed 100 characters']
    },
    description: {
      type: String,
      maxlength: [500, 'Week description cannot exceed 500 characters']
    },
    lessons: [{
      title: {
        type: String,
        required: true,
        maxlength: [100, 'Lesson title cannot exceed 100 characters']
      },
      description: {
        type: String,
        maxlength: [300, 'Lesson description cannot exceed 300 characters']
      },
      type: {
        type: String,
        enum: ['video', 'reading', 'assignment', 'quiz', 'project'],
        default: 'video'
      },
      duration: {
        type: Number, // in minutes
        default: 0
      },
      isPreview: {
        type: Boolean,
        default: false
      },
      resources: [{
        title: String,
        url: String,
        type: {
          type: String,
          enum: ['pdf', 'doc', 'link', 'image', 'other']
        }
      }]
    }]
  }],
  requirements: [{
    type: String,
    maxlength: [200, 'Requirement cannot exceed 200 characters']
  }],
  learningOutcomes: [{
    type: String,
    maxlength: [200, 'Learning outcome cannot exceed 200 characters']
  }],
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  language: {
    type: String,
    default: 'English',
    maxlength: [50, 'Language cannot exceed 50 characters']
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived', 'suspended'],
    default: 'draft'
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date
  },
  enrollmentCount: {
    type: Number,
    default: 0,
    min: [0, 'Enrollment count cannot be negative']
  },
  maxEnrollments: {
    type: Number,
    min: [1, 'Max enrollments must be at least 1']
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
      maxlength: [1000, 'Review comment cannot exceed 1000 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  schedule: {
    startDate: Date,
    endDate: Date,
    sessions: [{
      day: {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      },
      time: String, // e.g., "10:00 AM"
      duration: Number, // in minutes
      timezone: {
        type: String,
        default: 'UTC'
      }
    }]
  },
  isLive: {
    type: Boolean,
    default: false
  },
  nextSession: {
    type: Date
  },
  featured: {
    type: Boolean,
    default: false
  },
  featuredUntil: {
    type: Date
  },
  discount: {
    percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    validUntil: Date,
    code: String
  },
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  relatedCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
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
    completionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
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

// Virtual for total duration in hours
courseSchema.virtual('totalDurationHours').get(function() {
  return this.duration.weeks * this.duration.hoursPerWeek;
});

// Virtual for discounted price
courseSchema.virtual('discountedPrice').get(function() {
  if (this.discount.percentage > 0 && 
      (!this.discount.validUntil || this.discount.validUntil > new Date())) {
    return this.price * (1 - this.discount.percentage / 100);
  }
  return this.price;
});

// Virtual for enrollment status
courseSchema.virtual('isEnrollmentOpen').get(function() {
  if (!this.isPublished || this.status !== 'published') return false;
  if (this.maxEnrollments && this.enrollmentCount >= this.maxEnrollments) return false;
  return true;
});

// Indexes for better query performance
courseSchema.index({ title: 'text', description: 'text', tags: 'text' });
courseSchema.index({ instructor: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ level: 1 });
courseSchema.index({ status: 1, isPublished: 1 });
courseSchema.index({ price: 1 });
courseSchema.index({ 'rating.average': -1 });
courseSchema.index({ enrollmentCount: -1 });
courseSchema.index({ createdAt: -1 });
courseSchema.index({ featured: -1, featuredUntil: 1 });

// Pre-save middleware to calculate total hours
courseSchema.pre('save', function(next) {
  if (this.duration.weeks && this.duration.hoursPerWeek) {
    this.duration.totalHours = this.duration.weeks * this.duration.hoursPerWeek;
  }
  next();
});

// Pre-save middleware to set publishedAt
courseSchema.pre('save', function(next) {
  if (this.isModified('isPublished') && this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

// Instance method to add review
courseSchema.methods.addReview = function(userId, rating, comment) {
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
courseSchema.methods.enrollStudent = function(userId) {
  if (!this.isEnrollmentOpen) {
    throw new Error('Enrollment is not open for this course');
  }
  
  if (this.maxEnrollments && this.enrollmentCount >= this.maxEnrollments) {
    throw new Error('Course is full');
  }
  
  this.enrollmentCount += 1;
  return this.save();
};

module.exports = mongoose.model('Course', courseSchema);
