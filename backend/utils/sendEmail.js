const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // --- EXPLICIT SMTP CONFIGURATION FOR RENDER ---
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,             // Changed from 465 to Render-friendly 587
    secure: false,         // Must be false for port 587
    requireTLS: true,      // Forces secure encryption even on port 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    logger: true,
    debug: true,
  });

  const mailOptions = {
    // Best practice: Google prefers the 'from' address to match the authenticated user
    from: `"CampusMart Security" <${process.env.EMAIL_USER}>`, 
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;