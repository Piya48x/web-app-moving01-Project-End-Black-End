const express = require('express');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    // Check if email and newPassword are provided
    if (!email || !newPassword) {
      return res.status(400).json({ message: "Email and newPassword are required" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password for all types of users
    const updatedUser = await prisma.user.updateMany({
      where: {
        email,
      },
      data: {
        password: hashedPassword,
      },
    });

    const updatedCustomer = await prisma.customer.updateMany({
      where: {
        email,
      },
      data: {
        password: hashedPassword,
      },
    });

    const updatedAdmin = await prisma.admin.updateMany({
      where: {
        email,
      },
      data: {
        password: hashedPassword,
      },
    });

    // Check if any user is updated
    if (!updatedUser && !updatedCustomer && !updatedAdmin) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Failed to reset password" });
  }
});

module.exports = router;
