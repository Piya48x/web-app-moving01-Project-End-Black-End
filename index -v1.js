// server.js
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer"); // Import nodemailer for sending emails
const bodyParser = require('body-parser');
const http = require('http');
const socketIo = require('socket.io');
const registerRouter = require("./contloRoue/registerUser");
const registerCustomerRouter = require("./contloRoue/registerCustomer");
const registerAdminRouter = require("./contloRoue/registerAdmin");

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);

const PORT = 3001;

app.use(express.json());
app.use(bodyParser.json());

// Enable CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173"); // แก้ไข URL เป็นโดเมนของเว็บไซต์ React ของคุณ
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Endpoint for resetting password
app.post("/api/reset-password", async (req, res) => {
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


// Register a new user

app.use("/api/register", registerRouter);

app.use("/api/register-customer", registerCustomerRouter);

app.use("/api/register-admin", registerAdminRouter);

// Login endpoint
app.post("/api/login", async (req, res) => {
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

// Receive orders from customers
app.post('/api/order', async (req, res) => {
  const { pickupLocation, destination, selectedVehicle } = req.body;

  try {
      // Save order to database
      const newOrder = await prisma.order.create({
          data: {
              pickupLocation,
              destination,
              selectedVehicle,
          },
      });

      // Emit event to notify drivers about the new order
      io.emit('newOrder', newOrder);

      // For demonstration purposes, we'll just log the order
      console.log('New order received:', newOrder);

      res.status(200).json({ message: 'Order received successfully' });
  } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
});

// Send orders to drivers
app.get('/api/orders', async (req, res) => {
  try {
      const orders = await prisma.order.findMany();
      res.json({ orders });
  } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
});

io.on('connection', (socket) => {
  console.log('A client connected');

  // Event listener when receiving 'orderReceived' event from the website
  socket.on('orderReceived', () => {
      // Emit 'orderReceived' event to all drivers
      io.emit('orderReceived');
  });
});


server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
