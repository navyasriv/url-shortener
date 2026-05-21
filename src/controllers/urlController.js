const { nanoid } = require("nanoid");
const Url = require("../models/Url");
const { getRedisClient } = require("../config/redis");

const CACHE_TTL = parseInt(process.env.CACHE_TTL) || 86400;

// ─── POST /api/shorten ─────────────────────────────────────────────────────
// Create a new short URL
const shortenUrl = async (req, res) => {
  try {
    const { originalUrl, customCode } = req.body;

    if (!originalUrl) {
      return res.status(400).json({ error: "originalUrl is required" });
    }

    // Basic URL validation
    try {
      new URL(originalUrl);
    } catch {
      return res.status(400).json({ error: "Invalid URL format" });
    }

    const redis = getRedisClient();
    const shortCode = customCode || nanoid(7);

    // If using a custom code, check it's not already taken
    if (customCode) {
      const existing = await Url.findOne({ shortCode: customCode });
      if (existing) {
        return res.status(409).json({ error: "Custom code already in use" });
      }
    }

    // Save to MongoDB
    const newUrl = await Url.create({ shortCode, originalUrl });

    // Cache in Redis: shortCode -> originalUrl
    await redis.setEx(`url:${shortCode}`, CACHE_TTL, originalUrl);

    return res.status(201).json({
      success: true,
      shortCode,
      shortUrl: `${process.env.BASE_URL}/${shortCode}`,
      originalUrl,
      createdAt: newUrl.createdAt,
    });
  } catch (error) {
    console.error("shortenUrl error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ─── GET /:code ────────────────────────────────────────────────────────────
// Redirect to original URL
const redirectToOriginal = async (req, res) => {
  try {
    const { code } = req.params;
    const redis = getRedisClient();

    // 1️⃣ Check Redis cache first (fast path)
    const cachedUrl = await redis.get(`url:${code}`);
    if (cachedUrl) {
      console.log(`⚡ Cache HIT for: ${code}`);

      // Increment click count in MongoDB asynchronously (don't await)
      Url.updateOne({ shortCode: code }, { $inc: { clicks: 1 } }).exec();

      return res.redirect(cachedUrl);
    }

    // 2️⃣ Cache MISS — check MongoDB
    console.log(`🔍 Cache MISS for: ${code} — querying MongoDB`);
    const urlDoc = await Url.findOneAndUpdate(
      { shortCode: code },
      { $inc: { clicks: 1 } },
      { new: true }
    );

    if (!urlDoc) {
      return res.status(404).json({ error: "Short URL not found" });
    }

    // 3️⃣ Store in Redis for next time
    await redis.setEx(`url:${code}`, CACHE_TTL, urlDoc.originalUrl);

    return res.redirect(urlDoc.originalUrl);
  } catch (error) {
    console.error("redirectToOriginal error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ─── GET /api/stats/:code ──────────────────────────────────────────────────
// Get stats for a short URL
const getStats = async (req, res) => {
  try {
    const { code } = req.params;

    const urlDoc = await Url.findOne({ shortCode: code });
    if (!urlDoc) {
      return res.status(404).json({ error: "Short URL not found" });
    }

    return res.json({
      shortCode: urlDoc.shortCode,
      shortUrl: `${process.env.BASE_URL}/${urlDoc.shortCode}`,
      originalUrl: urlDoc.originalUrl,
      clicks: urlDoc.clicks,
      createdAt: urlDoc.createdAt,
      updatedAt: urlDoc.updatedAt,
    });
  } catch (error) {
    console.error("getStats error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ─── GET /api/urls ─────────────────────────────────────────────────────────
// Get all URLs (with pagination)
const getAllUrls = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [urls, total] = await Promise.all([
      Url.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Url.countDocuments(),
    ]);

    return res.json({
      urls: urls.map((u) => ({
        shortCode: u.shortCode,
        shortUrl: `${process.env.BASE_URL}/${u.shortCode}`,
        originalUrl: u.originalUrl,
        clicks: u.clicks,
        createdAt: u.createdAt,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("getAllUrls error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ─── DELETE /api/urls/:code ────────────────────────────────────────────────
// Delete a short URL
const deleteUrl = async (req, res) => {
  try {
    const { code } = req.params;
    const redis = getRedisClient();

    const deleted = await Url.findOneAndDelete({ shortCode: code });
    if (!deleted) {
      return res.status(404).json({ error: "Short URL not found" });
    }

    // Remove from Redis cache too
    await redis.del(`url:${code}`);

    return res.json({
      success: true,
      message: `Short URL '${code}' deleted successfully`,
    });
  } catch (error) {
    console.error("deleteUrl error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { shortenUrl, redirectToOriginal, getStats, getAllUrls, deleteUrl };
