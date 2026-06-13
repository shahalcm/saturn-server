const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Configured with mailtrap/sandbox credentials by default or fallback
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: process.env.SMTP_PORT || 2525,
    auth: {
      user: process.env.SMTP_EMAIL || '',
      pass: process.env.SMTP_PASSWORD || '',
    },
  });

  const message = {
    from: `${process.env.FROM_NAME || 'Saturn Support'} <${process.env.FROM_EMAIL || 'support@saturn.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(message);
    console.log('Email sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email error:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = sendEmail;
