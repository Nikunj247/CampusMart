const { Resend } = require('resend');

// Initialize Resend with your API Key from Render
const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (options) => {
  try {
    await resend.emails.send({
      from: 'CampusMart <otp@thecampusmart.tech>', 
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html || `<p>${options.message}</p>`,
    });
    console.log(`✉️ Email successfully sent to ${options.email}`);
  } catch (error) {
    console.error("🚨 Resend Email Dispatch Error:", error);
    throw new Error("Email delivery failed.");
  }
};

module.exports = sendEmail;