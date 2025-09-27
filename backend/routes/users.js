const express = require('express');
const { body, query } = require('express-validator');
const User = require('../models/User');
const Skill = require('../models/Skill');
const Course = require('../models/Course');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { handleValidationErrors, sanitizeInput } = require('../middleware/validation');

const router = express.Router();

// @desc    Get all users (with pagination and filtering)
// @route   GET /api/users
// @access  Public
router.get('/', [
  optionalAuth,
  sanitizeInput,
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('role')
    .optional()
    .isIn(['student', 'instructor', 'admin'])
    .withMessage('Invalid role'),
  query('category')
    .optional()
    .isIn(['programming', 'design', 'music', 'business', 'languages', 'photography', 'writing', 'marketing', 'cooking', 'fitness', 'art', 'other'])
    .withMessage('Invalid category'),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term cannot exceed 100 characters'),
  handleValidationErrors
], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = { isActive: true };
    
    if (req.query.role) {
      filter.role = req.query.role;
    }

    if (req.query.search) {
      filter.$or = [
        { username: { $regex: req.query.search, $options: 'i' } },
        { firstName: { $regex: req.query.search, $options: 'i' } },
        { lastName: { $regex: req.query.search, $options: 'i' } },
        { bio: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // If filtering by category, find users who have skills in that category
    if (req.query.category) {
      const usersWithCategorySkills = await Skill.distinct('user', { 
        category: req.query.category,
        isPublic: true 
      });
      filter._id = { $in: usersWithCategorySkills };
    }

    const users = await User.find(filter)
      .select('-password -emailVerificationToken -passwordResetToken -passwordResetExpires')
      .populate('skills', 'title category level progress')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      count: users.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -emailVerificationToken -passwordResetToken -passwordResetExpires')
      .populate('skills', 'title category level progress status')
      .populate('enrolledCourses.course', 'title instructor category level price')
      .populate('teachingCourses', 'title category level price enrollmentCount rating');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
});

// @desc    Get user's skills
// @route   GET /api/users/:id/skills
// @access  Public
router.get('/:id/skills', [
  optionalAuth,
  query('category')
    .optional()
    .isIn(['programming', 'design', 'music', 'business', 'languages', 'photography', 'writing', 'marketing', 'cooking', 'fitness', 'art', 'other'])
    .withMessage('Invalid category'),
  query('status')
    .optional()
    .isIn(['learning', 'completed', 'paused', 'abandoned'])
    .withMessage('Invalid status'),
  handleValidationErrors
], async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const filter = { user: req.params.id, isPublic: true };
    
    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const skills = await Skill.find(filter)
      .populate('user', 'username firstName lastName avatar')
      .sort({ lastUpdated: -1 });

    res.json({
      success: true,
      count: skills.length,
      skills
    });
  } catch (error) {
    console.error('Get user skills error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user skills',
      error: error.message
    });
  }
});

// @desc    Get user's teaching courses
// @route   GET /api/users/:id/courses
// @access  Public
router.get('/:id/courses', [
  optionalAuth,
  query('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Invalid status'),
  handleValidationErrors
], async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const filter = { instructor: req.params.id };
    
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const courses = await Course.find(filter)
      .populate('instructor', 'username firstName lastName avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: courses.length,
      courses
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

// @desc    Follow/Unfollow user
// @route   POST /api/users/:id/follow
// @access  Private
router.post('/:id/follow', protect, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser || !targetUser.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (targetUser._id.equals(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot follow yourself'
      });
    }

    const currentUser = await User.findById(req.user._id);
    
    // Check if already following
    const isFollowing = currentUser.following && currentUser.following.includes(targetUser._id);
    
    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(id => !id.equals(targetUser._id));
      targetUser.followers = targetUser.followers.filter(id => !id.equals(req.user._id));
    } else {
      // Follow
      if (!currentUser.following) currentUser.following = [];
      if (!targetUser.followers) targetUser.followers = [];
      
      currentUser.following.push(targetUser._id);
      targetUser.followers.push(req.user._id);
    }

    await Promise.all([currentUser.save(), targetUser.save()]);

    res.json({
      success: true,
      message: isFollowing ? 'Unfollowed successfully' : 'Followed successfully',
      isFollowing: !isFollowing
    });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error following/unfollowing user',
      error: error.message
    });
  }
});

// @desc    Get user's followers
// @route   GET /api/users/:id/followers
// @access  Public
router.get('/:id/followers', optionalAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('followers', 'username firstName lastName avatar bio')
      .select('followers');

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      count: user.followers.length,
      followers: user.followers
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching followers',
      error: error.message
    });
  }
});

// @desc    Get user's following
// @route   GET /api/users/:id/following
// @access  Public
router.get('/:id/following', optionalAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('following', 'username firstName lastName avatar bio')
      .select('following');

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      count: user.following.length,
      following: user.following
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching following',
      error: error.message
    });
  }
});

// @desc    Delete user account
// @route   DELETE /api/users/:id
// @access  Private (own account or admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user owns the account or is admin
    if (!user._id.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this account'
      });
    }

    // Soft delete - deactivate account
    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
});

module.exports = router;
