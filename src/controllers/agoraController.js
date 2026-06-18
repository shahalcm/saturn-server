const { RtcTokenBuilder, RtcRole } = require('agora-token');
const { successResponse, errorResponse } = require('../utils/formatResponse');

const generateToken = async (req, res) => {
  try {
    const { channelName, uid, role } = req.body;

    if (!channelName) {
      return errorResponse(res, 'Channel name is required');
    }

    const appID = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appID || !appCertificate) {
      return errorResponse(res, 'Agora credentials not configured');
    }

    const userRole = role === 'publisher'
      ? RtcRole.PUBLISHER
      : RtcRole.SUBSCRIBER;

    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
      appID,
      appCertificate,
      channelName,
      uid || 0,
      userRole,
      privilegeExpiredTs,
      privilegeExpiredTs
    );

    return successResponse(res, {
      token,
      channelName,
      appId: appID,
      uid: uid || 0,
      expiresIn: expirationTimeInSeconds,
    }, 'Token generated successfully');
  } catch (error) {
    console.error('Agora token error:', error);
    return errorResponse(res, error.message, 500);
  }
};

module.exports = { generateToken };
