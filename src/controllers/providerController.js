const Provider = require('../models/Provider');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/formatResponse');
const { generateToken, generateRefreshToken } = require('../utils/generateToken');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

// @GET /api/providers — get all verified providers
const getProviders = async (req, res) => {
  try {
    const { type, religion, language, specialty, isOnline, page = 1, limit = 20 } = req.query;

    const filter = { verificationStatus: 'verified', isBanned: false };

    if (type) filter.providerType = type;
    if (religion) filter.religion = religion;
    if (language) filter.languages = { $in: [language] };
    if (specialty) filter.specialties = { $in: [specialty] };
    if (isOnline === 'true') filter.isOnline = true;

    const total = await Provider.countDocuments(filter);
    const providers = await Provider.find(filter)
      .select('-password')
      .sort({ isOnline: -1, rating: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return successResponse(res, {
      providers,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @GET /api/providers/:id
const getProviderById = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id).select('-password');
    if (!provider) return errorResponse(res, 'Provider not found', 404);
    return successResponse(res, provider);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @PUT /api/providers/profile
const updateProviderProfile = async (req, res) => {
  try {
    const provider = await Provider.findByIdAndUpdate(
      req.userId,
      req.body,
      { new: true }
    ).select('-password');
    return successResponse(res, provider, 'Profile updated');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @PUT /api/providers/status
const updateOnlineStatus = async (req, res) => {
  try {
    const { isOnline } = req.body;
    const provider = await Provider.findByIdAndUpdate(
      req.userId,
      { isOnline, lastActive: new Date() },
      { new: true }
    );
    return successResponse(res, { isOnline: provider.isOnline }, 'Status updated');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @PUT /api/providers/documents
const uploadDocuments = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return errorResponse(res, 'No files uploaded');

    const urls = [];
    for (const file of req.files) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'saturn/documents',
      });
      urls.push(result.secure_url);
      fs.unlinkSync(file.path);
    }

    const provider = await Provider.findByIdAndUpdate(
      req.userId,
      { $push: { documents: { $each: urls } } },
      { new: true }
    );

    return successResponse(res, { documents: provider.documents }, 'Documents uploaded');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @POST /api/providers/register
const registerProvider = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      providerType,
      religion,
      gender,
      languages,
      location,
      experience,
      price,
      about,
      specialties,
      qualification,
      hospitalName,
      maxStudents,
      uploadedDoc
    } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    let existingProvider = await Provider.findOne({ $or: [{ phone: phone || user.phone }, { userId: user._id }] });
    if (existingProvider) {
      return errorResponse(res, 'Provider profile already exists', 400);
    }

    user.role = 'provider';
    await user.save();

    const provider = await Provider.create({
      userId: user._id,
      name: name || user.name,
      phone: phone || user.phone,
      email: email || user.email,
      providerType,
      religion,
      gender,
      languages,
      location,
      experience: Number(experience) || 0,
      pricePerMin: Number(price) || 0,
      about,
      specialties: Array.isArray(specialties) ? specialties : [specialties].filter(Boolean),
      qualification,
      documents: uploadedDoc ? [uploadedDoc] : [],
      isPhoneVerified: true,
      verificationStatus: 'pending',
    });

    const token = generateToken(provider._id, 'provider');
    const refreshToken = generateRefreshToken(provider._id);

    return successResponse(res, {
      token,
      refreshToken,
      provider: {
        id: provider._id,
        name: provider.name,
        phone: provider.phone,
        providerType: provider.providerType,
        religion: provider.religion,
        verificationStatus: provider.verificationStatus,
      }
    }, 'Provider registered successfully', 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = {
  getProviders,
  getProviderById,
  updateProviderProfile,
  updateOnlineStatus,
  uploadDocuments,
  registerProvider
};
