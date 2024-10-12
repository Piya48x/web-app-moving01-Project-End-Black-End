const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if the admin exists with the provided email and password
    const existingAdmin = await prisma.admin.findFirst({
      where: {
        email,
      },
    });

    if (existingAdmin) {
      // If the user is an admin, compare passwords
      const passwordMatch = await bcrypt.compare(
        password,
        existingAdmin.password
      );
      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      // If password matches, generate admin token
      const token = jwt.sign(
        { userId: existingAdmin.id },
        process.env.SECRET_KEY
      );
      // If password matches, return admin data along with token
      return res.status(200).json({
        message: "Admin login successful",
        token,
        data: existingAdmin,
      });
    }

    // Check if the customer exists with the provided email and password
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        email,
      },
    });

    if (existingCustomer) {
      // If the user is a customer, compare passwords
      const passwordMatch = await bcrypt.compare(
        password,
        existingCustomer.password
      );
      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      // If password matches, generate customer token
      const token = jwt.sign(
        { userId: existingCustomer.id },
        process.env.SECRET_KEY
      );
      // If password matches, return customer data along with token
      return res.status(200).json({
        message: "Customer login successful",
        token,
        data: existingCustomer,
      });
    }

    // Check if the user exists with the provided email
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (!existingUser) {
      // If no user, admin, or customer exists with the provided email, return an error
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Compare passwords for regular user
    const passwordMatch = await bcrypt.compare(password, existingUser.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // If the user is a regular user and password matches, generate user token
    const token = jwt.sign({ userId: existingUser.id }, process.env.SECRET_KEY);
    // If password matches, return user data along with token
    res.status(200).json({
      message: "User login successful",
      token,
      data: existingUser,
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
