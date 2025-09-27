const express = require('express');
const { query } = require('express-validator');
const Course = require('../models/Course');
const Skill = require('../models/Skill');
const User = require('../models/User');
const { optionalAuth } = require('../middleware/auth');
const { handleValidationErrors, sanitizeInput } = require('../middleware/validation');

const router = express.Router();

// @desc    Get marketplace data (courses and skills)
// @route   GET /api/marketplace
// @access  Public
router.get('/', [
  optionalAuth,
  sanitizeInput,
  query('type')
    .optional()
    .isIn(['courses', 'skills', 'all'])
    .withMessage('Type must be courses, skills, or all'),
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
    .isIn(['programming', 'design', 'music', 'business', 'languages', 'photography', 'writing', 'marketing', 'cooking', 'fitness', 'art', 'other'])
    .withMessage('Invalid category'),
  query('level')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
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
    .isIn(['price', 'rating', 'enrollmentCount', 'createdAt', 'title', 'popularity'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  handleValidationErrors
], async (req, res) => {
  try {
    const type = req.query.type || 'all';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const results = {};

    // Build common filter
    const commonFilter = {};
    
    if (req.query.category) {
      commonFilter.category = req.query.category;
    }
    
    if (req.query.level) {
      commonFilter.level = req.query.level;
    }

    if (req.query.search) {
      commonFilter.$text = { $search: req.query.search };
    }

    // Build sort
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    // Get courses
    if (type === 'courses' || type === 'all') {
      const courseFilter = {
        ...commonFilter,
        status: 'published',
        isPublished: true
      };

      if (req.query.minPrice || req.query.maxPrice) {
        courseFilter.price = {};
        if (req.query.minPrice) courseFilter.price.$gte = parseFloat(req.query.minPrice);
        if (req.query.maxPrice) courseFilter.price.$lte = parseFloat(req.query.maxPrice);
      }

      const courses = await Course.find(courseFilter)
        .populate('instructor', 'username firstName lastName avatar rating')
        .sort(sort)
        .skip(skip)
        .limit(limit);

      const totalCourses = await Course.countDocuments(courseFilter);

      results.courses = {
        data: courses,
        count: courses.length,
        total: totalCourses,
        page,
        pages: Math.ceil(totalCourses / limit)
      };
    }

    // Get skills
    if (type === 'skills' || type === 'all') {
      const skillFilter = {
        ...commonFilter,
        isPublic: true,
        isTeaching: true
      };

      if (req.query.minPrice || req.query.maxPrice) {
        skillFilter.teachingPrice = {};
        if (req.query.minPrice) skillFilter.teachingPrice.$gte = parseFloat(req.query.minPrice);
        if (req.query.maxPrice) skillFilter.teachingPrice.$lte = parseFloat(req.query.maxPrice);
      }

      const skills = await Skill.find(skillFilter)
        .populate('user', 'username firstName lastName avatar rating')
        .sort(sort)
        .skip(skip)
        .limit(limit);

      const totalSkills = await Skill.countDocuments(skillFilter);

      results.skills = {
        data: skills,
        count: skills.length,
        total: totalSkills,
        page,
        pages: Math.ceil(totalSkills / limit)
      };
    }

    res.json({
      success: true,
      ...results
    });
  } catch (error) {
    console.error('Get marketplace error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching marketplace data',
      error: error.message
    });
  }
});

// @desc    Get featured courses and skills
// @route   GET /api/marketplace/featured
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    // Get featured courses
    const featuredCourses = await Course.find({
      status: 'published',
      isPublished: true,
      featured: true,
      featuredUntil: { $gt: new Date() }
    })
      .populate('instructor', 'username firstName lastName avatar rating')
      .sort({ createdAt: -1 })
      .limit(6);

    // Get popular skills (by enrollment count)
    const popularSkills = await Skill.find({
      isPublic: true,
      isTeaching: true
    })
      .populate('user', 'username firstName lastName avatar rating')
      .sort({ 'analytics.enrollments': -1 })
      .limit(6);

    // Get top-rated courses
    const topRatedCourses = await Course.find({
      status: 'published',
      isPublished: true,
      'rating.count': { $gte: 5 } // At least 5 reviews
    })
      .populate('instructor', 'username firstName lastName avatar rating')
      .sort({ 'rating.average': -1 })
      .limit(6);

    res.json({
      success: true,
      featuredCourses,
      popularSkills,
      topRatedCourses
    });
  } catch (error) {
    console.error('Get featured content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured content',
      error: error.message
    });
  }
});

// @desc    Get categories with counts
// @route   GET /api/marketplace/categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = [
      'programming', 'design', 'music', 'business', 'languages', 
      'photography', 'writing', 'marketing', 'cooking', 'fitness', 'art', 'other'
    ];

    const categoryStats = await Promise.all(
      categories.map(async (category) => {
        const [courseCount, skillCount] = await Promise.all([
          Course.countDocuments({
            category,
            status: 'published',
            isPublished: true
          }),
          Skill.countDocuments({
            category,
            isPublic: true,
            isTeaching: true
          })
        ]);

        return {
          name: category,
          displayName: category.charAt(0).toUpperCase() + category.slice(1),
          courseCount,
          skillCount,
          totalCount: courseCount + skillCount
        };
      })
    );

    // Sort by total count
    categoryStats.sort((a, b) => b.totalCount - a.totalCount);

    res.json({
      success: true,
      categories: categoryStats
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
});

// @desc    Get search suggestions
// @route   GET /api/marketplace/search/suggestions
// @access  Public
router.get('/search/suggestions', [
  sanitizeInput,
  query('q')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Query must be between 1 and 50 characters'),
  handleValidationErrors
], async (req, res) => {
  try {
    const query = req.query.q.toLowerCase();
    const limit = 10;

    // Get course suggestions
    const courseSuggestions = await Course.find({
      status: 'published',
      isPublished: true,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } }
      ]
    })
      .select('title category level price')
      .limit(limit);

    // Get skill suggestions
    const skillSuggestions = await Skill.find({
      isPublic: true,
      isTeaching: true,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } }
      ]
    })
      .select('title category level teachingPrice')
      .limit(limit);

    // Get instructor suggestions
    const instructorSuggestions = await User.find({
      isActive: true,
      role: 'instructor',
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } }
      ]
    })
      .select('username firstName lastName avatar')
      .limit(limit);

    res.json({
      success: true,
      suggestions: {
        courses: courseSuggestions,
        skills: skillSuggestions,
        instructors: instructorSuggestions
      }
    });
  } catch (error) {
    console.error('Get search suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching search suggestions',
      error: error.message
    });
  }
});

// @desc    Get marketplace statistics
// @route   GET /api/marketplace/stats
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const [
      totalCourses,
      totalSkills,
      totalInstructors,
      totalStudents,
      averageCourseRating,
      averageSkillRating
    ] = await Promise.all([
      Course.countDocuments({ status: 'published', isPublished: true }),
      Skill.countDocuments({ isPublic: true, isTeaching: true }),
      User.countDocuments({ role: 'instructor', isActive: true }),
      User.countDocuments({ role: 'student', isActive: true }),
      Course.aggregate([
        { $match: { status: 'published', isPublished: true, 'rating.count': { $gt: 0 } } },
        { $group: { _id: null, avgRating: { $avg: '$rating.average' } } }
      ]),
      Skill.aggregate([
        { $match: { isPublic: true, isTeaching: true, 'rating.count': { $gt: 0 } } },
        { $group: { _id: null, avgRating: { $avg: '$rating.average' } } }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        totalCourses,
        totalSkills,
        totalInstructors,
        totalStudents,
        averageCourseRating: averageCourseRating[0]?.avgRating || 0,
        averageSkillRating: averageSkillRating[0]?.avgRating || 0
      }
    });
  } catch (error) {
    console.error('Get marketplace stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching marketplace statistics',
      error: error.message
    });
  }
});

// @desc    Get trending content
// @route   GET /api/marketplace/trending
// @access  Public
router.get('/trending', async (req, res) => {
  try {
    const timeFrame = req.query.timeframe || 'week'; // week, month, year
    const limit = parseInt(req.query.limit) || 10;

    let dateFilter;
    switch (timeFrame) {
      case 'week':
        dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        dateFilter = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get trending courses (by enrollment count in time frame)
    const trendingCourses = await Course.find({
      status: 'published',
      isPublished: true,
      createdAt: { $gte: dateFilter }
    })
      .populate('instructor', 'username firstName lastName avatar')
      .sort({ enrollmentCount: -1 })
      .limit(limit);

    // Get trending skills (by enrollment count in time frame)
    const trendingSkills = await Skill.find({
      isPublic: true,
      isTeaching: true,
      createdAt: { $gte: dateFilter }
    })
      .populate('user', 'username firstName lastName avatar')
      .sort({ 'analytics.enrollments': -1 })
      .limit(limit);

    res.json({
      success: true,
      timeframe: timeFrame,
      trendingCourses,
      trendingSkills
    });
  } catch (error) {
    console.error('Get trending content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trending content',
      error: error.message
    });
  }
});

module.exports = router;
