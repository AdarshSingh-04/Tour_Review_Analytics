// routes/reviews.js — Full CRUD for Reviews

const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const { protect } = require('../middleware/auth');
const { analyzeSentiment } = require('../utils/sentiment');

// @route   GET /api/reviews
// @desc    Get all reviews (with optional search, filter, sort, pagination)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { search, rating, sort = 'date', page = 1, limit = 20 } = req.query;

    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { destination: { $regex: search, $options: 'i' } },
        { userName: { $regex: search, $options: 'i' } },
      ];
    }
    if (rating) query.rating = Number(rating);

    // Sort order
    const sortOptions = {
      date: { date: -1 },
      'rating-high': { rating: -1 },
      'rating-low': { rating: 1 },
    };
    const sortBy = sortOptions[sort] || sortOptions.date;

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    const total = await Review.countDocuments(query);

    const reviews = await Review.find(query)
      .sort(sortBy)
      .skip(skip)
      .limit(Number(limit));

    res.json({
      reviews,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching reviews', error: err.message });
  }
});

// @route   POST /api/reviews
// @desc    Create a new review
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { destination, rating, reviewText } = req.body;

    if (!destination || !rating || !reviewText) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Auto-detect sentiment
    const sentiment = analyzeSentiment(reviewText);

    const review = await Review.create({
      user: req.user._id,
      userName: req.user.name,
      destination,
      rating: Number(rating),
      reviewText,
      sentiment,
    });

    res.status(201).json({ message: 'Review created', review });
  } catch (err) {
    res.status(500).json({ message: 'Error creating review', error: err.message });
  }
});

// @route   PUT /api/reviews/:id
// @desc    Edit own review
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    // Ownership check
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this review' });
    }

    const { destination, rating, reviewText } = req.body;
    review.destination = destination || review.destination;
    review.rating = rating ? Number(rating) : review.rating;
    review.reviewText = reviewText || review.reviewText;
    review.sentiment = reviewText ? analyzeSentiment(reviewText) : review.sentiment;

    await review.save();
    res.json({ message: 'Review updated', review });
  } catch (err) {
    res.status(500).json({ message: 'Error updating review', error: err.message });
  }
});

// @route   DELETE /api/reviews/:id
// @desc    Delete own review
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    // Allow owner or admin
    if (review.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }

    await review.deleteOne();
    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting review', error: err.message });
  }
});

module.exports = router;
