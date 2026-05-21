require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const connectMongoDB = require("./config/mongodb");
const { connectRedis } = require("./config/redis");
const urlRoutes = require("./routes/urlRoutes");
const rateLimiter = require("./middleware/rateLimiter");
const { redirectToOriginal } = require("./controllers/urlController");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// ── Rate Limiter (applied to API routes only) ───────────────────────────────
app.use("/api", rateLimiter);

// ── API Routes ──────────────────────────────────────────────────────────────
app.use("/api", urlRoutes);

// ── Redirect Route ──────────────────────────────────────────────────────────
// Must be AFTER /api routes so it doesn't catch /api/* paths
app.get("/:code", redirectToOriginal);

// ── Root ────────────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// ── Start Server ────────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    await connectMongoDB();
    await connectRedis();

    app.listen(PORT, () => {
      console.log(`\n🚀 Server running at http://localhost:${PORT}`);
      console.log(`📋 API Docs:`);
      console.log(`   POST   /api/shorten       → Create short URL`);
      console.log(`   GET    /api/urls           → List all URLs`);
      console.log(`   GET    /api/stats/:code    → Get URL stats`);
      console.log(`   DELETE /api/urls/:code     → Delete URL`);
      console.log(`   GET    /:code              → Redirect to original\n`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
