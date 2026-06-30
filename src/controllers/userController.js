const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/formatResponse');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

// @GET /api/users/profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return errorResponse(res, 'User not found', 404);
    return successResponse(res, user);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @PUT /api/users/profile
const updateProfile = async (req, res) => {
  try {
    const { name, email, religion, gender, languages, dateOfBirth, timeOfBirth, placeOfBirth, whatsappUpdates } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { name, email, religion, gender, languages, dateOfBirth, timeOfBirth, placeOfBirth, whatsappUpdates },
      { new: true, runValidators: true }
    ).select('-password');

    return successResponse(res, user, 'Profile updated');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @PUT /api/users/avatar
const updateAvatar = async (req, res) => {
  try {
    if (!req.file) return errorResponse(res, 'No file uploaded');

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'saturn/users',
      width: 200,
      crop: 'scale',
    });

    fs.unlinkSync(req.file.path);

    const user = await User.findByIdAndUpdate(
      req.userId,
      { avatar: result.secure_url },
      { new: true }
    ).select('-password');

    return successResponse(res, { avatar: result.secure_url }, 'Avatar updated');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @PUT /api/users/fcm-token
const updateFCMToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    await User.findByIdAndUpdate(req.userId, { fcmToken });
    return successResponse(res, null, 'FCM token updated');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @PUT /api/users/wallet/topup
const walletTopup = async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $inc: { walletBalance: amount } },
      { new: true }
    );
    return successResponse(res, { walletBalance: user.walletBalance }, 'Wallet topped up');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @DELETE /api/users/profile
const deleteAccount = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.userId);
    if (!user) return errorResponse(res, 'User not found', 404);
    return successResponse(res, null, 'Account deleted permanently');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = { getProfile, updateProfile, updateAvatar, updateFCMToken, walletTopup, deleteAccount };
