const express = require("express");
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { user, email, password, confirmPassword, phoneNumber, address } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if the user already exists with the provided email
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    // If user already exists, return an error
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create a new customer
    const newCustomer = await prisma.customer.create({
      data: {
        user,
        email,
        password: hashedPassword,
        phoneNumber,
        address,
      },
    });

    // If everything is correct, log in the customer
    res.status(200).json({
      message: "Customer registered and logged in successfully",
      data: newCustomer,
    });
  } catch (error) {
    console.error("Error registering customer:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
