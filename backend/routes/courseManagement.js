const express = require('express');
const { body, query } = require('express-validator');
const Course = require('../models/Course');
const User = require('../models/User');
const Review = require('../models/Review');
const { protect, authorize, checkOwnership } = require('../middleware/auth');
const { handleValidationErrors, sanitizeInput } = require('../middleware/validation');

const router = express.Router();

// @desc    Get course reviews
// @route   GET /api/courses/:id/reviews
// @access  Private (course instructor or enrolled students)
router.get('/:id/reviews', [
  protect,
  sanitizeInput,
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

    // Check if user is instructor or enrolled student
    const isInstructor = course.instructor.toString() === req.user._id.toString();
    const isEnrolled = course.enrolledStudents.includes(req.user._id);

    if (!isInstructor && !isEnrolled) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You must be enrolled in this course to view reviews.'
      });
    }

    const reviews = await Review.find({ course: req.params.id })
      .populate('student', 'username avatar')
      .sort({ createdAt: -1 }); // Most recent first

    res.json({
      success: true,
      reviews
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
});

// @desc    Add course review
// @route   POST /api/courses/:id/reviews
// @access  Private (enrolled students only)
router.post('/:id/reviews', [
  protect,
  sanitizeInput,
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Comment must be between 10 and 500 characters'),
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
    const isEnrolled = course.enrolledStudents.includes(req.user._id);
    if (!isEnrolled) {
      return res.status(403).json({
        success: false,
        message: 'You must be enrolled in this course to leave a review'
      });
    }

    // Check if user already reviewed this course
    const existingReview = await Review.findOne({
      course: req.params.id,
      student: req.user._id
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this course'
      });
    }

    const review = await Review.create({
      course: req.params.id,
      student: req.user._id,
      rating: req.body.rating,
      comment: req.body.comment
    });

    // Update course average rating
    const allReviews = await Review.find({ course: req.params.id });
    const averageRating = allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length;
    
    await Course.findByIdAndUpdate(req.params.id, {
      averageRating: averageRating,
      reviewCount: allReviews.length
    });

    await review.populate('student', 'username avatar');

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      review
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

// @desc    Get course students
// @route   GET /api/courses/:id/students
// @access  Private (course instructor only)
router.get('/:id/students', [
  protect,
  authorize('instructor', 'admin'),
  sanitizeInput,
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

    // Check if user is the instructor
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the course instructor can view students.'
      });
    }

    const students = await User.find({
      _id: { $in: course.enrolledStudents }
    }).select('username avatar email enrolledAt');

    // Add enrollment date and progress for each student
    const studentsWithDetails = students.map(student => ({
      ...student.toObject(),
      enrolledAt: course.enrolledStudents.includes(student._id) ? 
        course.enrolledStudents.find(s => s._id.toString() === student._id.toString())?.enrolledAt || new Date() : 
        new Date(),
      progress: Math.floor(Math.random() * 100) // This should come from actual progress tracking
    }));

    res.json({
      success: true,
      students: studentsWithDetails
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching students',
      error: error.message
    });
  }
});

// @desc    Update course rating and stats
// @route   PUT /api/courses/:id/stats
// @access  Private (course instructor only)
router.put('/:id/stats', [
  protect,
  authorize('instructor', 'admin'),
  sanitizeInput,
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

    // Check if user is the instructor
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the course instructor can update stats.'
      });
    }

    // Calculate updated stats
    const enrollmentCount = course.enrolledStudents.length;
    
    const reviews = await Review.find({ course: req.params.id });
    const averageRating = reviews.length > 0 ? 
      reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;

    await Course.findByIdAndUpdate(req.params.id, {
      enrollmentCount,
      averageRating,
      reviewCount: reviews.length
    });

    res.json({
      success: true,
      message: 'Course stats updated successfully',
      stats: {
        enrollmentCount,
        averageRating,
        reviewCount: reviews.length
      }
    });
  } catch (error) {
    console.error('Update stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating course stats',
      error: error.message
    });
  }
});

module.exports = router;
