const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // --- EXPLICIT SMTP CONFIGURATION FOR RENDER ---
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // --- THE FIX: AGGRESSIVE DEBUGGING & TIMEOUTS ---
    logger: true,            // Prints all email network traffic to Render logs
    debug: true,             // Includes raw SMTP connection data
    connectionTimeout: 5000, // If Google ignores us for 5 seconds, CRASH immediately.
    socketTimeout: 5000      // Do not wait infinitely for a response.
    // ------------------------------------------------
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