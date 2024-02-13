const nodemailer = require("nodemailer");

// กำหนดค่าสำหรับ transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "your_email@gmail.com",
    pass: "your_password",
  },
});

// นำเข้าฟังก์ชัน sendPasswordResetEmail ที่ใช้ transporter
const sendPasswordResetEmail = async (email, resetLink) => {
  const mailOptions = {
    from: "your_email@gmail.com",
    to: email,
    subject: "Reset Password",
    html: `Click <a href="${resetLink}">here</a> to reset your password`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Password reset email sent successfully");
  } catch (error) {
    console.error("Error sending password reset email:", error);
  }
};

module.exports = { sendPasswordResetEmail };
