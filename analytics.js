// routes/analytics.js — Dashboard Analytics Endpoint

const express = require('express');
const router = express.Router();
const Review = require('../models/Review');

// @route   GET /api/analytics
// @desc    Get dashboard analytics data
// @access  Public
router.get('/', async (req, res) => {
  try {
    // --- Average Rating per Destination ---
    const avgRatings = await Review.aggregate([
      {
        $group: {
          _id: '$destination',
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
      { $sort: { avgRating: -1 } },
      {
        $project: {
          destination: '$_id',
          avgRating: { $round: ['$avgRating', 1] },
          count: 1,
          _id: 0,
        },
      },
    ]);

    // --- Sentiment Distribution ---
    const sentimentData = await Review.aggregate([
      { $group: { _id: '$sentiment', count: { $sum: 1 } } },
    ]);

    // --- Reviews Over Time (by month) ---
    const timeData = await Review.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          month: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              {
                $cond: {
                  if: { $lt: ['$_id.month', 10] },
                  then: { $concat: ['0', { $toString: '$_id.month' }] },
                  else: { $toString: '$_id.month' },
                },
              },
            ],
          },
          reviews: '$count',
          _id: 0,
        },
      },
    ]);

    // --- Top Destinations (most reviewed) ---
    const topDestinations = await Review.aggregate([
      { $group: { _id: '$destination', reviews: { $sum: 1 }, avgRating: { $avg: '$rating' } } },
      { $sort: { reviews: -1 } },
      { $limit: 5 },
      {
        $project: {
          destination: '$_id',
          reviews: 1,
          avgRating: { $round: ['$avgRating', 1] },
          _id: 0,
        },
      },
    ]);

    // --- Overall Stats ---
    const totalReviews = await Review.countDocuments();
    const allRatings = await Review.aggregate([{ $group: { _id: null, avg: { $avg: '$rating' } } }]);
    const overallAvg = allRatings[0]?.avg?.toFixed(1) || 0;

    res.json({
      avgRatings,
      sentimentData,
      timeData,
      topDestinations,
      stats: {
        totalReviews,
        overallAvg,
        destinations: avgRatings.length,
        positivePercent: Math.round(
          ((sentimentData.find(s => s._id === 'positive')?.count || 0) / totalReviews) * 100
        ),
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Error computing analytics', error: err.message });
  }
});

module.exports = router;
