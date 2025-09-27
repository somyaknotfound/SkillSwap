const express = require('express');
const { body, query } = require('express-validator');
const Course = require('../models/Course');
const User = require('../models/User');
const { protect, authorize, checkOwnership } = require('../middleware/auth');
const { handleValidationErrors, sanitizeInput } = require('../middleware/validation');

const router = express.Router();

// @desc    Get user's courses (teaching and enrolled)
// @route   GET /api/courses/my
// @access  Private
router.get('/my', protect, async (req, res) => {
  try {
    // Get courses taught by user
    const teachingCourses = await Course.find({ instructor: req.user._id })
      .populate('instructor', 'username email avatar')
      .sort({ createdAt: -1 });

    // Get courses enrolled by user
    const enrolledCourses = await Course.find({ 
      'enrolledStudents.student': req.user._id 
    })
      .populate('instructor', 'username email avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      teachingCourses,
      enrolledCourses,
      teachingCount: teachingCourses.length,
      enrolledCount: enrolledCourses.length
    });
  } catch (error) {
    console.error('Get user courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user courses',
      error: error.message
    });
  }
});

// @desc    Get all courses (with pagination and filtering)
// @route   GET /api/courses
// @access  Public
router.get('/', [
  sanitizeInput,
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('category')
    .optional()
    .isIn(['programming', 'design', 'music', 'business', 'languages', 'photography', 'writing', 'marketing', 'other'])
    .withMessage('Invalid category'),
  query('level')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Invalid level'),
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Min price must be a positive number'),
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Max price must be a positive number'),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term cannot exceed 100 characters'),
  query('sortBy')
    .optional()
    .isIn(['price', 'rating', 'enrollmentCount', 'createdAt', 'title'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  handleValidationErrors
], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = { 
      status: 'published',
      isPublished: true 
    };
    
    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    if (req.query.level) {
      filter.level = req.query.level;
    }
    
    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) filter.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) filter.price.$lte = parseFloat(req.query.maxPrice);
    }

    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    // Build sort object
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    const courses = await Course.find(filter)
      .populate('instructor', 'username firstName lastName avatar rating')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Course.countDocuments(filter);

    res.json({
      success: true,
      count: courses.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      courses
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching courses',
      error: error.message
    });
  }
});

// @desc    Get course by ID
// @route   GET /api/courses/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'username firstName lastName avatar bio rating')
      .populate('prerequisites', 'title level category')
      .populate('relatedCourses', 'title level category price rating');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Increment view count
    course.analytics.views += 1;
    await course.save();

    res.json({
      success: true,
      course
    });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching course',
      error: error.message
    });
  }
});

// @desc    Create new course
// @route   POST /api/courses
// @access  Private (instructor or admin)
router.post('/', [
  protect,
  sanitizeInput,
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title is required and cannot exceed 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Description is required and cannot exceed 2000 characters'),
  body('category')
    .isIn(['programming', 'design', 'music', 'business', 'languages', 'photography', 'writing', 'marketing', 'other'])
    .withMessage('Invalid category'),
  body('level')
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Invalid level'),
  body('price')
    .isFloat({ min: 0, max: 10000 })
    .withMessage('Price must be between 0 and 10000'),
  body('duration.weeks')
    .isInt({ min: 1, max: 52 })
    .withMessage('Duration must be between 1 and 52 weeks'),
  handleValidationErrors
], async (req, res) => {
  try {
    const courseData = {
      ...req.body,
      instructor: req.user._id,
      status: 'published',
      isPublished: true
    };

    const course = await Course.create(courseData);

    // Add course to instructor's teaching courses
    await User.findByIdAndUpdate(req.user._id, {
      $push: { teachingCourses: course._id }
    });

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      course
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating course',
      error: error.message
    });
  }
});

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private (instructor or admin)
router.put('/:id', [
  protect,
  checkOwnership(Course),
  sanitizeInput,
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title cannot exceed 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('category')
    .optional()
    .isIn(['programming', 'design', 'music', 'business', 'languages', 'photography', 'writing', 'marketing', 'other'])
    .withMessage('Invalid category'),
  body('level')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Invalid level'),
  body('price')
    .optional()
    .isFloat({ min: 0, max: 10000 })
    .withMessage('Price must be between 0 and 10000'),
  handleValidationErrors
], async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('instructor', 'username firstName lastName avatar');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      message: 'Course updated successfully',
      course
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating course',
      error: error.message
    });
  }
});

// @desc    Publish course
// @route   PATCH /api/courses/:id/publish
// @access  Private (instructor or admin)
router.patch('/:id/publish', [
  protect,
  checkOwnership(Course)
], async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'published',
        isPublished: true,
        publishedAt: new Date()
      },
      { new: true }
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      message: 'Course published successfully',
      course
    });
  } catch (error) {
    console.error('Publish course error:', error);
    res.status(500).json({
      success: false,
      message: 'Error publishing course',
      error: error.message
    });
  }
});

// @desc    Enroll in course
// @route   POST /api/courses/:id/enroll
// @access  Private
router.post('/:id/enroll', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (!course.isEnrollmentOpen) {
      return res.status(400).json({
        success: false,
        message: 'Enrollment is not open for this course'
      });
    }

    // Check if already enrolled
    const user = await User.findById(req.user._id);
    const isEnrolled = user.enrolledCourses.some(
      enrollment => enrollment.course.equals(course._id)
    );

    if (isEnrolled) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this course'
      });
    }

    // Enroll user
    await course.enrollStudent(req.user._id);
    
    // Add to user's enrolled courses
    user.enrolledCourses.push({
      course: course._id,
      enrolledAt: new Date()
    });
    await user.save();

    res.json({
      success: true,
      message: 'Successfully enrolled in course',
      course: {
        id: course._id,
        title: course.title,
        instructor: course.instructor
      }
    });
  } catch (error) {
    console.error('Enroll course error:', error);
    res.status(500).json({
      success: false,
      message: 'Error enrolling in course',
      error: error.message
    });
  }
});

// @desc    Add course review
// @route   POST /api/courses/:id/reviews
// @access  Private
router.post('/:id/reviews', [
  protect,
  sanitizeInput,
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Comment cannot exceed 1000 characters'),
  handleValidationErrors
], async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user is enrolled
    const user = await User.findById(req.user._id);
    const isEnrolled = user.enrolledCourses.some(
      enrollment => enrollment.course.equals(course._id)
    );

    if (!isEnrolled) {
      return res.status(400).json({
        success: false,
        message: 'Must be enrolled to review this course'
      });
    }

    await course.addReview(req.user._id, req.body.rating, req.body.comment);

    res.json({
      success: true,
      message: 'Review added successfully'
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding review',
      error: error.message
    });
  }
});

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private (instructor or admin)
router.delete('/:id', [
  protect,
  checkOwnership(Course)
], async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { status: 'archived' },
      { new: true }
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      message: 'Course archived successfully'
    });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting course',
      error: error.message
    });
  }
});

module.exports = router;
