const express = require("express");
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const {
      user,
      email,
      password,
      brand,
      colorCar,
      licensePlate,
      phoneNumber,
      firstName,
      lastName,
      typeCar,
    } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        user,
        email,
        password: hashedPassword,
        brand,
        colorCar,
        licensePlate,
        phoneNumber,
        firstName,
        lastName,
        typeCar,
      },
    });

    res.status(201).json({ message: "User registered successfully", data: newUser });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
