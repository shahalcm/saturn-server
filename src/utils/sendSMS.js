const twilioClient = require('../config/twilio');

const sendOTPSMS = async (phone, otp) => {
  try {
    const message = await twilioClient.messages.create({
      body: `Your Saturn verification code is: ${otp}. Valid for 10 minutes. Do not share this OTP with anyone.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });
    console.log('SMS sent:', message.sid);
    return { success: true, sid: message.sid };
  } catch (error) {
    console.error('SMS error:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendOTPSMS };
