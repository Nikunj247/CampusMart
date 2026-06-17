const { Resend } = require('resend');

// Initialize Resend with your API Key from Render
const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (options) => {
  try {
    await resend.emails.send({
      // On Resend's free tier, you must send from this exact default address
      from: 'CampusMart <onboarding@resend.dev>', 
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html || `<p>${options.message}</p>`,
    });
    
    console.log(`✨ OTP Email successfully dispatched via Resend API to ${options.email}`);
  } catch (error) {
    console.error("💥 RESEND API CRASH:", error);
    throw error; // Pass the error back to authController so it can handle it
  }
};

module.exports = sendEmail;