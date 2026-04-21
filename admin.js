// routes/admin.js — Admin Panel Routes

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Review = require('../models/Review');
const { protect, adminOnly } = require('../middleware/auth');

// All admin routes require authentication + admin role
router.use(protect, adminOnly);

// @route   GET /api/admin/users
// @desc    Get all registered users
// @access  Admin
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({ isAdmin: false }).select('-password');
    res.json({ users, total: users.length });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// @route   GET /api/admin/reviews
// @desc    Get all reviews for moderation
// @access  Admin
router.get('/reviews', async (req, res) => {
  try {
    const reviews = await Review.find().sort({ date: -1 });
    res.json({ reviews, total: reviews.length });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching reviews' });
  }
});

// @route   DELETE /api/admin/reviews/:id
// @desc    Admin delete any review
// @access  Admin
router.delete('/reviews/:id', async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    res.json({ message: 'Review deleted by admin' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting review' });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user and all their reviews
// @access  Admin
router.delete('/users/:id', async (req, res) => {
  try {
    await Review.deleteMany({ user: req.params.id });
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User and their reviews deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting user' });
  }
});

module.exports = router;
