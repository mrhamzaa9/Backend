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

// ================= VERIFY EMAIL =================
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
    `,
  });
};

// ================= RESET PASSWORD =================
const sendResetPasswordEmail = async (user, url) => {
  return transporter.sendMail({
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

// ================= ASSIGNMENT EMAIL =================
const sendMail = async ({ email, name, courseName, task, finalAt }) => {
  return transporter.sendMail({
    from: `"Multi-School LMS" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `New Assignment: ${task}`,
    html: `
      <h3>Hello ${name}</h3>
      <p>A new assignment has been posted.</p>

      <p>
        <b>Course:</b> ${courseName}<br/>
        <b>Assignment:</b> ${task}<br/>
        <b>Deadline:</b> ${
          finalAt ? new Date(finalAt).toLocaleString() : "N/A"
        }
      </p>

      <p>Please login to LMS to view details.</p>
      <br/>
      <p>— Multi-School LMS</p>
    `,
  });
};

// ================= EXPORTS =================
module.exports = {
  sendVerificationEmail,
  sendResetPasswordEmail,
  sendMail,
};
