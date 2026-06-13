const Prayer = require('../models/Prayer');
const { successResponse, errorResponse } = require('../utils/formatResponse');

// @GET /api/prayers — filtered by religion
const getPrayers = async (req, res) => {
  try {
    const { religion, status } = req.query;
    const filter = {};
    if (religion) filter.religion = religion;
    if (status) filter.status = status;

    const prayers = await Prayer.find(filter).sort({ scheduledDate: 1, scheduledTime: 1 });
    return successResponse(res, prayers);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @GET /api/prayers/live — only live prayers by religion
const getLivePrayers = async (req, res) => {
  try {
    const { religion } = req.query;
    const filter = { status: 'live' };
    if (religion) filter.religion = religion;
    const prayers = await Prayer.find(filter);
    return successResponse(res, prayers);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @POST /api/prayers — admin only
const createPrayer = async (req, res) => {
  try {
    const prayer = await Prayer.create(req.body);
    return successResponse(res, prayer, 'Prayer scheduled', 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @PUT /api/prayers/:id/start — go live
const startPrayer = async (req, res) => {
  try {
    const prayer = await Prayer.findByIdAndUpdate(
      req.params.id,
      { status: 'live' },
      { new: true }
    );
    if (!prayer) return errorResponse(res, 'Prayer not found', 404);
    return successResponse(res, prayer, 'Prayer is now live');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @PUT /api/prayers/:id/end — complete live prayer
const endPrayer = async (req, res) => {
  try {
    const prayer = await Prayer.findByIdAndUpdate(
      req.params.id,
      { status: 'completed' },
      { new: true }
    );
    if (!prayer) return errorResponse(res, 'Prayer not found', 404);
    return successResponse(res, prayer, 'Prayer has ended');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @PUT /api/prayers/:id/cancel — cancel prayer event
const cancelPrayer = async (req, res) => {
  try {
    const prayer = await Prayer.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    );
    if (!prayer) return errorResponse(res, 'Prayer not found', 404);
    return successResponse(res, prayer, 'Prayer has been cancelled');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = { getPrayers, getLivePrayers, createPrayer, startPrayer, endPrayer, cancelPrayer };
