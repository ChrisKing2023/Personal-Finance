import nodemailer from "nodemailer";
import logger from "../../utils/logger";
import xss from "xss";

// Create reusable transporter object
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  auth: {
    user: process.env.USER,
    pass: process.env.APP_PASSWORD,
  },
});

// Verify the connection configuration
transporter.verify(function (error, success) {
  if (error) {
    logger.info("Email Service Error:", error);
  } else {
    logger.info(`Email Service is ready to send messages`);
  }
});

// Email sending function
const sendEmail = (to, subject, text, html = "") => {
  // Sanitize subject and text
  subject = xss(subject.trim());
  text = xss(text.trim());

  // If HTML content is provided, sanitize it to prevent XSS
  if (html) {
    html = xss(html);
  }

  const mailOptions = {
    from: process.env.USER,
    to,
    subject,
    text,
    html,
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        reject(error); // Reject the promise on error
      } else {
        resolve(info); // Resolve the promise on success
      }
    });
  });
};

export default sendEmail;
