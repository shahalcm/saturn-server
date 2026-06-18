const BankDetails = require('../models/BankDetails');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const Provider = require('../models/Provider');
const { successResponse, errorResponse } = require('../utils/formatResponse');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SUPPORT_EMAIL,
    pass: process.env.SUPPORT_EMAIL_PASSWORD,
  },
});

// @GET /api/bank/details
const getBankDetails = async (req, res) => {
  try {
    const bank = await BankDetails.findOne({ providerId: req.userId });
    return successResponse(res, bank);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @POST /api/bank/details — save or update bank details
const saveBankDetails = async (req, res) => {
  try {
    const {
      accountHolderName,
      accountNumber,
      confirmAccountNumber,
      ifscCode,
      bankName,
      branchName,
      accountType,
      upiId,
    } = req.body;

    if (!accountHolderName || !accountNumber || !ifscCode || !bankName) {
      return errorResponse(res, 'All required fields must be filled');
    }

    if (accountNumber !== confirmAccountNumber) {
      return errorResponse(res, 'Account numbers do not match');
    }

    // Validate IFSC: 11 characters, starts with 4 letters
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(ifscCode.toUpperCase())) {
      return errorResponse(res, 'Invalid IFSC code format');
    }

    const existing = await BankDetails.findOne({ providerId: req.userId });

    let bank;
    if (existing) {
      bank = await BankDetails.findByIdAndUpdate(
        existing._id,
        {
          accountHolderName,
          accountNumber,
          confirmAccountNumber,
          ifscCode: ifscCode.toUpperCase(),
          bankName,
          branchName,
          accountType,
          upiId,
          isVerified: false,
        },
        { new: true }
      );
    } else {
      bank = await BankDetails.create({
        providerId: req.userId,
        accountHolderName,
        accountNumber,
        confirmAccountNumber,
        ifscCode: ifscCode.toUpperCase(),
        bankName,
        branchName,
        accountType,
        upiId,
      });
    }

    return successResponse(res, bank, 'Bank details saved successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @POST /api/bank/withdraw — request withdrawal
const requestWithdrawal = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount < 100) {
      return errorResponse(res, 'Minimum withdrawal amount is ₹100');
    }

    const provider = await Provider.findById(req.userId);
    if (!provider) return errorResponse(res, 'Provider not found', 404);

    if (provider.walletBalance < amount) {
      return errorResponse(res, `Insufficient balance. Available: ₹${provider.walletBalance}`);
    }

    const bank = await BankDetails.findOne({ providerId: req.userId });
    if (!bank) {
      return errorResponse(res, 'Please add your bank details first');
    }

    // Check if there's already a pending request
    const existingPending = await WithdrawalRequest.findOne({
      providerId: req.userId,
      status: 'pending',
    });
    if (existingPending) {
      return errorResponse(res, 'You already have a pending withdrawal request');
    }

    // Deduct from wallet immediately (hold)
    await Provider.findByIdAndUpdate(req.userId, {
      $inc: { walletBalance: -amount },
    });

    const withdrawal = await WithdrawalRequest.create({
      providerId: req.userId,
      providerName: provider.name,
      providerType: provider.providerType,
      amount,
      bankDetails: {
        accountHolderName: bank.accountHolderName,
        accountNumber: bank.accountNumber,
        ifscCode: bank.ifscCode,
        bankName: bank.bankName,
        accountType: bank.accountType,
        upiId: bank.upiId,
      },
    });

    // Notify admin via email
    try {
      await transporter.sendMail({
        from: `"Saturn Platform" <${process.env.SUPPORT_EMAIL}>`,
        to: process.env.ADMIN_SUPPORT_EMAIL,
        subject: `New Withdrawal Request #${withdrawal.requestNumber} — ₹${amount}`,
        html: `
          <div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
            <div style="background: #0D1B2A; padding: 24px; border-radius: 12px 12px 0 0;">
              <h1 style="color: #F5A623; margin: 0;">Withdrawal Request</h1>
            </div>
            <div style="background: #F9F9F9; padding: 24px; border-radius: 0 0 12px 12px;">
              <p><strong>Request #:</strong> ${withdrawal.requestNumber}</p>
              <p><strong>Provider:</strong> ${provider.name} (${provider.providerType})</p>
              <p><strong>Amount:</strong> ₹${amount}</p>
              <p><strong>Bank:</strong> ${bank.bankName}</p>
              <p><strong>Account:</strong> XXXX${bank.accountNumber.slice(-4)}</p>
              <p><strong>IFSC:</strong> ${bank.ifscCode}</p>
              <a href="${process.env.ADMIN_URL}/admin/withdrawals"
                 style="background:#F5A623;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;margin-top:16px;">
                Process Withdrawal
              </a>
            </div>
          </div>
        `,
      });
    } catch (e) {
      console.error('Email error:', e.message);
    }

    return successResponse(res, withdrawal, 'Withdrawal request submitted', 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @GET /api/bank/withdrawals — get my withdrawal history
const getMyWithdrawals = async (req, res) => {
  try {
    const withdrawals = await WithdrawalRequest.find({ providerId: req.userId })
      .sort({ createdAt: -1 });
    return successResponse(res, withdrawals);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// ADMIN controllers

// @GET /api/admin/withdrawals
const getAllWithdrawals = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const withdrawals = await WithdrawalRequest.find(filter)
      .populate('providerId', 'name phone email providerType')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await WithdrawalRequest.countDocuments(filter);

    const stats = {
      total: await WithdrawalRequest.countDocuments(),
      pending: await WithdrawalRequest.countDocuments({ status: 'pending' }),
      completed: await WithdrawalRequest.countDocuments({ status: 'completed' }),
      totalPaid: (await WithdrawalRequest.find({ status: 'completed' }))
        .reduce((sum, w) => sum + w.amount, 0),
    };

    return successResponse(res, { withdrawals, total, stats });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @PUT /api/admin/withdrawals/:id/process
const processWithdrawal = async (req, res) => {
  try {
    const { status, transactionId, adminNote, rejectionReason } = req.body;

    const withdrawal = await WithdrawalRequest.findById(req.params.id)
      .populate('providerId', 'name email phone walletBalance');

    if (!withdrawal) return errorResponse(res, 'Request not found', 404);

    const updateData = {
      status,
      processedAt: new Date(),
      processedBy: 'Admin',
    };

    if (transactionId) updateData.transactionId = transactionId;
    if (adminNote) updateData.adminNote = adminNote;
    if (rejectionReason) updateData.rejectionReason = rejectionReason;

    // If rejected — refund to wallet
    if (status === 'rejected') {
      await Provider.findByIdAndUpdate(withdrawal.providerId._id, {
        $inc: { walletBalance: withdrawal.amount },
      });
      updateData.rejectionReason = rejectionReason || 'Rejected by admin';
    }

    const updated = await WithdrawalRequest.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    // Send email to provider
    const providerEmail = withdrawal.providerId?.email;
    if (providerEmail) {
      const isApproved = status === 'completed';
      try {
        await transporter.sendMail({
          from: `"Saturn Platform" <${process.env.SUPPORT_EMAIL}>`,
          to: providerEmail,
          subject: `Withdrawal #${withdrawal.requestNumber} ${isApproved ? 'Completed' : status}`,
          html: `
            <div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
              <div style="background: ${isApproved ? '#4CAF50' : '#FF4444'}; padding: 24px; border-radius: 12px 12px 0 0;">
                <h1 style="color: white; margin: 0;">
                  Withdrawal ${isApproved ? 'Successful ✓' : 'Update'}
                </h1>
              </div>
              <div style="background: #F9F9F9; padding: 24px; border-radius: 0 0 12px 12px;">
                <p><strong>Request #:</strong> ${withdrawal.requestNumber}</p>
                <p><strong>Amount:</strong> ₹${withdrawal.amount}</p>
                <p><strong>Status:</strong> ${status.toUpperCase()}</p>
                ${transactionId ? `<p><strong>Transaction ID:</strong> ${transactionId}</p>` : ''}
                ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ''}
                ${adminNote ? `<p><strong>Note:</strong> ${adminNote}</p>` : ''}
                <p style="margin-top:16px;">For queries: 📞 9544755008</p>
              </div>
            </div>
          `,
        });
      } catch (e) {
        console.error('Email error:', e.message);
      }
    }

    return successResponse(res, updated, `Withdrawal ${status}`);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = {
  getBankDetails,
  saveBankDetails,
  requestWithdrawal,
  getMyWithdrawals,
  getAllWithdrawals,
  processWithdrawal,
};
