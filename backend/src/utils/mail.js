import nodemailer from "nodemailer";

//Nodemailer transporter configuration ( nodemailer talks to SMTP server(we used mailtrap as a fake SMTP server for dev/testing))
const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_SMTP_HOST,
  port: process.env.MAILTRAP_SMTP_PORT,
  auth: {
    user: process.env.MAILTRAP_SMTP_USER,
    pass: process.env.MAILTRAP_SMTP_PASS,
  },
});

//Generic email sending function : Takes structured email content → converts it to HTML + text → sends it using SMTP
//sending email is always an async function
const sendEmail = async (options) => {
  const mail = {
    from: "Bloom <noreply@blush.com>",
    to: options.email,
    subject: options.subject,
    html: `
    <p>Welcome to Blush ❤️</p>
    <p>Click below to verify:</p>
    <a href=${options.verificationUrl} style="display: inline-block; padding: 10px 20px; background-color: #007BFF; color: white; text-decoration: none; border-radius: 5px;">
      Verify Login
    </a>`,
  };

  try {
    await transporter.sendMail(mail);
    console.log("Email sent successfully to " + options.email);
  } catch (error) {
    console.error("Error sending email to " + options.email + ": ", error);
  }
};

export { sendEmail };
