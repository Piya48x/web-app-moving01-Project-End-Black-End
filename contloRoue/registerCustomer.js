const express = require("express");
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

// Create a new customer
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

// Delete a customer by ID
router.delete("/:id", async (req, res) => {
  const customerId = parseInt(req.params.id);
  try {
    await prisma.customer.delete({
      where: {
        id: customerId,
      },
    });
    res.status(200).json({ message: "Customer deleted successfully" });
  } catch (error) {
    console.error("Error deleting customer:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update a customer by ID
router.put("/:id", async (req, res) => {
  const customerId = parseInt(req.params.id);
  try {
    const updatedCustomer = await prisma.customer.update({
      where: {
        id: customerId,
      },
      data: req.body,
    });
    res.status(200).json({ message: "Customer updated successfully", data: updatedCustomer });
  } catch (error) {
    console.error("Error updating customer:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get all customers
router.get("/", async (req, res) => {
  try {
    const allCustomers = await prisma.customer.findMany();
    res.status(200).json({ message: "All registered customers", data: allCustomers });
  } catch (error) {
    console.error("Error getting registered customers:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
