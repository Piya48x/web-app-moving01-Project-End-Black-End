const express = require("express");
const { PrismaClient } = require("@prisma/client");
const bodyParser = require("body-parser");
const http = require("http");
const socketIo = require("socket.io");
const registerRouter = require("./contloRoue/registerUser");
const registerCustomerRouter = require("./contloRoue/registerCustomer");
const registerAdminRouter = require("./contloRoue/registerAdmin");
const loginRoutes = require("./contloRoue/loginRoutes");
const resetPasswordRoutes = require("./contloRoue/resetPasswordRoutes");

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(express.json());
app.use(bodyParser.json());

// Enable CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

// Endpoint for resetting password
app.use("/api/reset-password", resetPasswordRoutes);

// Register a new user
app.use("/api/register", registerRouter);
app.use("/api/register-customer", registerCustomerRouter);
app.use("/api/register-admin", registerAdminRouter);

// Login endpoint
app.use("/api/login", loginRoutes);

// Receive orders from customers
app.post("/api/order", async (req, res) => {
  const { pickupLocation, destination, selectedVehicle } = req.body;

  try {
    // Save order to database
    const newOrder = await prisma.order.create({
      data: {
        pickupLocation,
        destination,
        selectedVehicle
      }
    });

    // Emit event to notify drivers about the new order
    io.emit("newOrder", newOrder);

    // For demonstration purposes, we'll just log the order
    console.log("New order received:", newOrder);

    res.status(200).json({ message: "Order received successfully" });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Send orders to drivers
app.get("/api/orders", async (req, res) => {
  try {
    const orders = await prisma.order.findMany();
    res.json({ orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

io.on("connection", (socket) => {
  console.log("A client connected");

  // Event listener when receiving 'orderReceived' event from the website
  socket.on("orderReceived", () => {
    // Emit 'orderReceived' event to all drivers
    io.emit("orderReceived");
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
