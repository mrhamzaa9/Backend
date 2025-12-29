const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// optional: verify SMTP on startup
transporter.verify((err) => {
  if (err) console.log("SMTP Error:", err);
  else console.log("SMTP ready");
});

const sendVerificationEmail = async (user, token) => {
  const url = `http://localhost:5173/verify/${token}`;

  return transporter.sendMail({
    from: `"Multi-School LMS" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: "Verify your email",
    html: `
      <h3>Hello ${user.name}</h3>
      <p>Please verify your email by clicking the link below:</p>
      <a href="${url}">Verify Email</a>
      <p>This link will expire soon.</p>
    `
  });
};
// forget password 
const sendResetPasswordEmail = async (user, url) => {
  await transporter.sendMail({
     from: `"Multi-School LMS" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: "Password Reset",
    html: `
      <h3>Hello ${user.name}</h3>
      <p>Click below to reset your password</p>
      <a href="${url}">Reset Password</a>
      <p>This link expires in 15 minutes</p>
    `,
  });
};

module.exports = { sendVerificationEmail,sendResetPasswordEmail };
