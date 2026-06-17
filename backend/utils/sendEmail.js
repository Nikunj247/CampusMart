const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // --- EXPLICIT SMTP CONFIGURATION FOR RENDER ---
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // This forces a strict SSL connection
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
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