const ProviderFee = require('../models/ProviderFee');
const Provider = require('../models/Provider');
const Commission = require('../models/Commission');
const { successResponse, errorResponse } = require('../utils/formatResponse');

// @GET /api/fees/my
const getMyFees = async (req, res) => {
  try {
    const fee = await ProviderFee.findOne({ providerId: req.userId });
    const commission = await Commission.findOne();
    return successResponse(res, {
      fees: fee,
      commissionRate: commission?.chatCommission || 5,
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @PUT /api/fees/my — provider sets their fees
const updateMyFees = async (req, res) => {
  try {
    const {
      chatFee, callFee, videoFee,
      consultationFee, classFee,
    } = req.body;

    // Validate: fees must be numbers
    const fees = { chatFee, callFee, videoFee, consultationFee, classFee };
    for (const [key, value] of Object.entries(fees)) {
      if (value !== undefined && (isNaN(value) || Number(value) < 0)) {
        return errorResponse(res, `${key} must be a valid positive number`);
      }
    }

    const commission = await Commission.findOne();
    const commissionRate = commission?.chatCommission || 5;

    const existing = await ProviderFee.findOne({ providerId: req.userId });
    let feeRecord;

    if (existing) {
      feeRecord = await ProviderFee.findByIdAndUpdate(
        existing._id,
        { chatFee, callFee, videoFee, consultationFee, classFee, commissionRate, updatedAt: new Date() },
        { new: true }
      );
    } else {
      feeRecord = await ProviderFee.create({
        providerId: req.userId,
        chatFee: Number(chatFee) || 0,
        callFee: Number(callFee) || 0,
        videoFee: Number(videoFee) || 0,
        consultationFee: Number(consultationFee) || 0,
        classFee: Number(classFee) || 0,
        commissionRate,
      });
    }

    // Also update provider pricePerMin with chatFee
    await Provider.findByIdAndUpdate(req.userId, {
      pricePerMin: Number(chatFee) || 0,
    });

    return successResponse(res, {
      fees: feeRecord,
      commissionRate,
      breakdown: {
        chatFee: Number(chatFee),
        chatCommission: Math.round(Number(chatFee) * commissionRate / 100),
        chatEarning: Math.round(Number(chatFee) * (100 - commissionRate) / 100),
      },
    }, 'Fees updated successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = { getMyFees, updateMyFees };
