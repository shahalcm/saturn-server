const User = require('../models/User');
const Provider = require('../models/Provider');
const OTP = require('../models/OTP');
const generateOTP = require('../utils/generateOTP');
const { generateToken, generateRefreshToken } = require('../utils/generateToken');
const { sendOTPSMS } = require('../utils/sendSMS');
const { successResponse, errorResponse } = require('../utils/formatResponse');
const jwt = require('jsonwebtoken');

// @POST /api/auth/send-otp
const sendOTP = async (req, res) => {
  try {
    const { phone, type } = req.body;

    if (!phone) return errorResponse(res, 'Phone number is required');

    // Format phone to E.164
    let formattedPhone = phone;
    if (!phone.startsWith('+')) {
      formattedPhone = '+91' + phone;
    }

    // Delete existing OTPs for this phone
    await OTP.deleteMany({ phone: formattedPhone });

    // Generate OTP
    const otp = generateOTP();

    // Save OTP
    await OTP.create({
      phone: formattedPhone,
      otp,
      type: type || 'login',
    });

    // Send SMS via Twilio
    const smsSent = await sendOTPSMS(formattedPhone, otp);

    if (!smsSent.success) {
      // In development, return OTP in response
      if (process.env.NODE_ENV === 'development') {
        return successResponse(res, { otp, phone: formattedPhone }, 'OTP generated (dev mode)');
      }
      return errorResponse(res, 'Failed to send OTP. Try again.');
    }

    return successResponse(res, { phone: formattedPhone }, 'OTP sent successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @POST /api/auth/verify-otp
const verifyOTP = async (req, res) => {
  try {
    const { phone, otp, type, userData } = req.body;

    if (!phone || !otp) return errorResponse(res, 'Phone and OTP required');

    let formattedPhone = phone;
    if (!phone.startsWith('+')) {
      formattedPhone = '+91' + phone;
    }

    // Find OTP
    const otpRecord = await OTP.findOne({
      phone: formattedPhone,
      isVerified: false,
    });

    if (!otpRecord) return errorResponse(res, 'OTP expired or not found');

    // Check attempts
    if (otpRecord.attempts >= 5) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return errorResponse(res, 'Too many attempts. Request new OTP');
    }

    // Check expiry
    if (otpRecord.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return errorResponse(res, 'OTP expired');
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      await OTP.updateOne({ _id: otpRecord._id }, { $inc: { attempts: 1 } });
      return errorResponse(res, 'Invalid OTP');
    }

    // Mark as verified
    await OTP.updateOne({ _id: otpRecord._id }, { isVerified: true });

    // Login or Register
    if (type === 'login') {
      let user = await User.findOne({ phone: formattedPhone });

      if (!user) {
        // Auto-register with phone
        user = await User.create({
          phone: formattedPhone,
          name: userData?.name || 'User',
          isPhoneVerified: true,
          role: 'seeker',
        });
      } else {
        user.isPhoneVerified = true;
        user.lastActive = new Date();
        await user.save();
      }

      const token = generateToken(user._id, 'user');
      const refreshToken = generateRefreshToken(user._id);

      return successResponse(res, {
        token,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          religion: user.religion,
          role: user.role,
          isNew: !user.religion,
        },
      }, 'Login successful');
    }

    if (type === 'provider_login') {
      let provider = await Provider.findOne({ phone: formattedPhone });

      if (!provider) {
        return errorResponse(res, 'Provider account not found. Please register first.', 404);
      }

      provider.isPhoneVerified = true;
      await provider.save();

      const token = generateToken(provider._id, 'provider');

      return successResponse(res, {
        token,
        provider,
        isNewProvider: false,
      }, 'Provider login successful');
    }

    if (type === 'signup') {
      const existingUser = await User.findOne({ phone: formattedPhone });
      if (existingUser) {
        const token = generateToken(existingUser._id, 'user');
        return successResponse(res, { token, user: existingUser, isNew: false }, 'Already registered, logged in');
      }

      const user = await User.create({
        phone: formattedPhone,
        name: userData?.name || '',
        email: userData?.email,
        password: userData?.password,
        religion: userData?.religion,
        isPhoneVerified: true,
        role: 'seeker',
      });

      const token = generateToken(user._id, 'user');
      const refreshToken = generateRefreshToken(user._id);

      return successResponse(res, { token, refreshToken, user }, 'Account created', 201);
    }

    if (type === 'provider_signup') {
      const provider = await Provider.create({
        phone: formattedPhone,
        name: userData?.name || '',
        email: userData?.email,
        providerType: userData?.providerType,
        religion: userData?.religion,
        gender: userData?.gender,
        languages: userData?.languages,
        location: userData?.location,
        experience: Number(userData?.experience) || 0,
        pricePerMin: Number(userData?.pricePerMin) || 0,
        about: userData?.about,
        specialties: userData?.specialties,
        qualification: userData?.qualification,
        documents: userData?.uploadedDoc ? [userData.uploadedDoc] : [],
        isPhoneVerified: true,
        verificationStatus: 'pending',
      });

      const token = generateToken(provider._id, 'provider');

      return successResponse(res, { token, provider }, 'Provider registered', 201);
    }

    return errorResponse(res, 'Invalid type');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @POST /api/auth/admin-login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = jwt.sign(
        { id: 'admin', role: 'admin', email },
        process.env.ADMIN_JWT_SECRET,
        { expiresIn: '7d' }
      );

      return successResponse(res, {
        token,
        admin: { id: 'admin', name: 'Super Admin', email, role: 'admin' },
      }, 'Admin login successful');
    }

    return errorResponse(res, 'Invalid admin credentials', 401);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @POST /api/auth/refresh-token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return errorResponse(res, 'Refresh token required');

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const newToken = generateToken(decoded.id, decoded.role || 'user');

    return successResponse(res, { token: newToken }, 'Token refreshed');
  } catch (error) {
    return errorResponse(res, 'Invalid refresh token', 401);
  }
};

module.exports = { sendOTP, verifyOTP, adminLogin, refreshToken };
