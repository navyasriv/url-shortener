const express = require("express");
const router = express.Router();
const {
  shortenUrl,
  getStats,
  getAllUrls,
  deleteUrl,
} = require("../controllers/urlController");

// POST   /api/shorten         → create short URL
router.post("/shorten", shortenUrl);

// GET    /api/urls             → list all URLs (paginated)
router.get("/urls", getAllUrls);

// GET    /api/stats/:code      → get stats for a short URL
router.get("/stats/:code", getStats);

// DELETE /api/urls/:code       → delete a short URL
router.delete("/urls/:code", deleteUrl);

module.exports = router;
