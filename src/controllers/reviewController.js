const Review = require('../models/Review');
const Session = require('../models/Session');
const Provider = require('../models/Provider');
const { successResponse, errorResponse } = require('../utils/formatResponse');

// @POST /api/reviews
const createReview = async (req, res) => {
  try {
    const { sessionId, rating, review } = req.body;

    if (!sessionId || !rating) {
      return errorResponse(res, 'Session ID and rating are required');
    }

    // Check if session exists and is completed
    const session = await Session.findById(sessionId);
    if (!session) return errorResponse(res, 'Session not found', 404);
    if (session.status !== 'completed') {
      return errorResponse(res, 'Can only review completed sessions');
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ sessionId });
    if (existingReview) {
      return errorResponse(res, 'Review already exists for this session');
    }

    // Create review
    const newReview = await Review.create({
      sessionId,
      seekerId: req.userId,
      providerId: session.providerId,
      rating,
      review,
    });

    // Update provider ratings and total reviews
    const allReviews = await Review.find({ providerId: session.providerId, isVisible: true });
    const totalReviews = allReviews.length;
    const avgRating = totalReviews > 0 
      ? Number((allReviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews).toFixed(2)) 
      : 0;

    await Provider.findByIdAndUpdate(session.providerId, {
      rating: avgRating,
      totalReviews,
    });

    return successResponse(res, newReview, 'Review submitted successfully', 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @GET /api/reviews/provider/:id
const getProviderReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ providerId: req.params.id, isVisible: true })
      .populate('seekerId', 'name avatar')
      .sort({ createdAt: -1 });
    return successResponse(res, reviews);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @PUT /api/reviews/:id/visibility — admin only
const toggleReviewVisibility = async (req, res) => {
  try {
    const { isVisible } = req.body;
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { isVisible },
      { new: true }
    );
    if (!review) return errorResponse(res, 'Review not found', 404);

    // Re-aggregate ratings
    const allReviews = await Review.find({ providerId: review.providerId, isVisible: true });
    const totalReviews = allReviews.length;
    const avgRating = totalReviews > 0 
      ? Number((allReviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews).toFixed(2)) 
      : 0;

    await Provider.findByIdAndUpdate(review.providerId, {
      rating: avgRating,
      totalReviews,
    });

    return successResponse(res, review, 'Review visibility updated');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = { createReview, getProviderReviews, toggleReviewVisibility };
