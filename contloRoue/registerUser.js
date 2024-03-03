const express = require("express");
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

// Get all users
router.get("/", async (req, res) => {
  try {
    const allUsers = await prisma.user.findMany();
    res.status(200).json({ message: "All registered users", data: allUsers });
  } catch (error) {
    console.error("Error getting registered users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Register a new user
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

// Delete a user by ID
router.delete("/:id", async (req, res) => {
  const userId = parseInt(req.params.id);
  try {
    await prisma.user.delete({
      where: {
        id: userId,
      },
    });
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update a user by ID
router.put("/:id", async (req, res) => {
  const userId = parseInt(req.params.id);
  try {
    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: req.body,
    });
    res.status(200).json({ message: "User updated successfully", data: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
