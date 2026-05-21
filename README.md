# 🔗 Snip — URL Shortener

A full-stack URL shortener built with **Node.js**, **MongoDB**, and **Redis**.

## 🏗️ Architecture

```
POST /api/shorten
     ↓
  Generate short code (nanoid)
     ↓
  Save to MongoDB ──────────────────────────────┐
     ↓                                           │
  Cache in Redis (TTL: 24h)                     │
     ↓                                           │
  Return short URL                               │
                                                 │
GET /:code                                       │
     ↓                                           │
  Check Redis (cache HIT → fast redirect) ◄──── │
     ↓ cache MISS                                │
  Query MongoDB (store in Redis for next time) ◄─┘
     ↓
  Redirect to original URL
```

## 🚀 Setup

### 1. Make sure Docker containers are running

```bash
# Check your containers
docker ps

# Start MongoDB (if not running)
docker start <your-mongodb-container-name>

# Start Redis (if not running)
docker start <your-redis-container-name>
```

### 2. Update .env file

Open `.env` and update the connection details:
```
MONGO_URI=mongodb://localhost:27017/urlshortener
REDIS_HOST=localhost
REDIS_PORT=6379
```

> ⚠️ If your Docker containers use different ports, update them here.

### 3. Install dependencies

```bash
npm install
```

### 4. Run the server

```bash
# Development (auto-restarts on file change)
npm run dev

# Production
npm start
```

### 5. Open the dashboard

Go to: **http://localhost:3000**

---

## 📋 API Reference

### Create a short URL
```
POST /api/shorten
Content-Type: application/json

{
  "originalUrl": "https://www.google.com/very/long/path",
  "customCode": "google"   // optional
}
```

### Redirect (visit the short URL)
```
GET /:code
```

### Get all URLs (paginated)
```
GET /api/urls?page=1&limit=10
```

### Get stats for one URL
```
GET /api/stats/:code
```

### Delete a URL
```
DELETE /api/urls/:code
```

---

## 🧪 Test with Postman

Import these requests into Postman:

**1. Shorten a URL**
- Method: `POST`
- URL: `http://localhost:3000/api/shorten`
- Body (JSON): `{ "originalUrl": "https://github.com" }`

**2. Get all URLs**
- Method: `GET`
- URL: `http://localhost:3000/api/urls`

**3. Get stats**
- Method: `GET`
- URL: `http://localhost:3000/api/stats/YOURCODE`

**4. Delete**
- Method: `DELETE`
- URL: `http://localhost:3000/api/urls/YOURCODE`

---

## 🧠 What You Learn

| Concept | Where |
|---------|-------|
| Redis as a cache (cache-aside pattern) | `urlController.js` |
| Cache TTL / expiry | `redis.setEx()` calls |
| Cache HIT vs MISS logs | Console when you call GET /:code |
| MongoDB CRUD | `Url.js` model + controller |
| Rate limiting with Redis | `rateLimiter.js` middleware |
| REST API design | `urlRoutes.js` |
| nanoid for unique IDs | `shortenUrl()` function |

---

## 🌱 Next Steps to Enhance

1. **Add authentication** — only logged-in users can create/delete URLs
2. **Click analytics** — track clicks by country, device, time of day
3. **QR code generation** — generate a QR code for each short URL
4. **Link expiry** — URLs auto-delete after X days
5. **Deploy for free** — Railway.app or Render.com (both free tiers)
