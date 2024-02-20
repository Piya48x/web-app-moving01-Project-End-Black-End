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
    credentials: true,
  },
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

app.post("/api/logout", (req, res) => {
  try {
    // Get the token from the request headers
    const token = req.headers.authorization.split(" ")[1];

    // Verify the token if needed

    // Clear the 'token' cookie
    res.clearCookie("token");

    // Return a success message
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Error during logout:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Login endpoint
app.use("/api/login", loginRoutes);

// Receive orders from customers
app.post("/api/order", async (req, res) => {
  const {
    vehicle,
    bookingStatus,
    pickupLocation,
    dropoffLocation,
    selectedDateTime,
    totalDistance,
    totalCost,
  } = req.body;

  try {
    // Convert selectedDateTime to ISO-8601 format
    const isoDateTime = new Date(selectedDateTime).toISOString();

    // Save order to database
    const newOrder = await prisma.order.create({
      data: {
        vehicle,
        bookingStatus,
        pickupLocation,
        dropoffLocation,
        selectedDateTime: isoDateTime, // Use the converted ISO-8601 DateTime
        totalDistance,
        totalCost,
      },
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

//Booking post
app.post("/api/booking", async (req, res) => {
  const {
    vehicle,
    bookingStatus,
    pickupLocation,
    dropoffLocation,
    selectedDateTime,
    totalDistance,
    totalCost,
  } = req.body;

  try {
    // Convert selectedDateTime to ISO-8601 format
    const isoDateTime = new Date(selectedDateTime).toISOString();

    // Save order to database
    const newOrder = await prisma.booking.create({
      data: {
        vehicle,
        bookingStatus,
        pickupLocation,
        dropoffLocation,
        selectedDateTime: isoDateTime, // Use the converted ISO-8601 DateTime
        totalDistance,
        totalCost,
      },
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

// Delete a booking by ID
app.delete("/api/booking/:id", async (req, res) => {
  const bookingId = req.params.id;

  try {
    // Delete the booking from the database using Prisma
    const deletedBooking = await prisma.booking.delete({
      where: {
        id: parseInt(bookingId), // Convert bookingId to integer if needed
      },
    });

    // Log the deleted booking
    console.log("Booking deleted:", deletedBooking);

    // Send a success response
    res.status(200).json({ message: "Booking deleted successfully" });
  } catch (error) {
    // Handle errors
    console.error("Error deleting booking:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});



//Booking get
// GET endpoint to fetch all bookings
app.get("/api/bookings", async (req, res) => {
  try {
    // Fetch all bookings from the database
    const bookings = await prisma.booking.findMany();

    // Return the fetched bookings as a response
    res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


// GET endpoint to fetch all orders
app.get("/api/orders", async (req, res) => {
  try {
    // Fetch all orders from the database
    const orders = await prisma.order.findMany();

    // Return the fetched orders as a response
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


// Route to handle POST requests to /api/orders
app.post("/api/orders", async (req, res) => {
  const orderData = req.body;

  try {
    // Save the order data to the database using Prisma Client
    const newOrder = await prisma.order.create({
      data: orderData,
    });

    console.log("Order saved:", newOrder);
    res
      .status(200)
      .json({ message: "Order saved successfully", order: newOrder });
  } catch (error) {
    console.error("Error saving order:", error);
    res.status(500).json({ error: "Failed to save order" });
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

  // Event listener when receiving 'orderReceived' event from the client
  socket.on("orderReceived", (orderData) => {
    // Process the received order data
    console.log("Order received:", orderData);
    // You can perform any further processing here, such as sending notifications or triggering actions

    // Send 'newOrder' event to all connected clients
    io.emit("newOrder", orderData);
  });

  // Event listener when receiving 'orderReceived' event from the client
  socket.on("orderReceived1", (orderData) => {
    // Process the received order data
    console.log("Order received:", orderData);
    // You can perform any further processing here, such as sending notifications or triggering actions

    // Send 'newOrder' event to all connected clients
    io.emit("newOrder", orderData);
  });

  // Event listener when receiving 'orderReceived' event from the client
  socket.on("orderReceived2", (orderData) => {
    // Process the received order data
    console.log("Order received:", orderData);
    // You can perform any further processing here, such as sending notifications or triggering actions

    // Send 'newOrder' event to all connected clients
    io.emit("newOrder1", orderData);
  });

  // Event listener when receiving 'orderReceived' event from the website
  socket.on("orderCancelled", () => {
    // Emit 'orderReceived' event to all drivers
    io.emit("orderCancelled");
  });
  // Event listener when receiving 'orderReceived' event from the website
  socket.on("orderAccepted", () => {
    // Emit 'orderReceived' event to all drivers
    io.emit("orderAccepted");
  });
  socket.on("jobFinished", () => {
    // Emit 'orderReceived' event to all drivers
    io.emit("jobFinished");
  });

  // Event listener when receiving 'message' event from the client
  socket.on("message", (message) => {
    // Broadcast the message to all connected clients except the sender
    socket.broadcast.emit("message", message);
  });

  // Handle receiving user data
  socket.on('userData', (data) => {
    // Broadcast the received user data to all connected clients
    io.emit('userData', data);
  });

  // Clean up on client disconnect
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
