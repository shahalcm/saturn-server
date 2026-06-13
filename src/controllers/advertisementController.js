const Advertisement = require('../models/Advertisement');
const { successResponse, errorResponse } = require('../utils/formatResponse');

// @GET /api/advertisements
const getAdvertisements = async (req, res) => {
  try {
    const { religion, position } = req.query;
    const filter = { status: 'active' };

    if (religion) {
      filter.targetReligion = { $in: ['all', religion] };
    }
    if (position) {
      filter.position = position;
    }

    const ads = await Advertisement.find(filter).sort({ createdAt: -1 });
    return successResponse(res, ads);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @POST /api/advertisements — admin only
const createAdvertisement = async (req, res) => {
  try {
    const ad = await Advertisement.create(req.body);
    return successResponse(res, ad, 'Advertisement campaign created successfully', 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @PUT /api/advertisements/:id — admin only
const updateAdvertisement = async (req, res) => {
  try {
    const ad = await Advertisement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!ad) return errorResponse(res, 'Advertisement not found', 404);
    return successResponse(res, ad, 'Advertisement campaign updated successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @DELETE /api/advertisements/:id — admin only
const deleteAdvertisement = async (req, res) => {
  try {
    const ad = await Advertisement.findByIdAndDelete(req.params.id);
    if (!ad) return errorResponse(res, 'Advertisement not found', 404);
    return successResponse(res, null, 'Advertisement campaign deleted successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @POST /api/advertisements/:id/click
const recordClick = async (req, res) => {
  try {
    const ad = await Advertisement.findByIdAndUpdate(
      req.params.id,
      { $inc: { clicks: 1 } },
      { new: true }
    );
    if (!ad) return errorResponse(res, 'Advertisement not found', 404);
    return successResponse(res, { clicks: ad.clicks }, 'Click metric recorded');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @POST /api/advertisements/:id/impression
const recordImpression = async (req, res) => {
  try {
    const ad = await Advertisement.findByIdAndUpdate(
      req.params.id,
      { $inc: { impressions: 1 } },
      { new: true }
    );
    if (!ad) return errorResponse(res, 'Advertisement not found', 404);
    return successResponse(res, { impressions: ad.impressions }, 'Impression metric recorded');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = {
  getAdvertisements,
  createAdvertisement,
  updateAdvertisement,
  deleteAdvertisement,
  recordClick,
  recordImpression,
};
