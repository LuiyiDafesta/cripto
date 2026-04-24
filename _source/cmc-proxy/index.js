const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3099;
const CMC_KEY = process.env.CMC_API_KEY || "";
const CMC_BASE = "https://pro-api.coinmarketcap.com";

// CORS — only allow your frontend domain
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:8080,http://localhost:5173")
  .split(",")
  .map(s => s.trim());

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes("*")) {
      cb(null, true);
    } else {
      cb(new Error("CORS blocked"));
    }
  },
}));

// Health check
app.get("/health", (_req, res) => res.json({ ok: true }));

// Proxy all /v1/* and /v2/* requests to CMC
app.get(["/v1/*", "/v2/*"], async (req, res) => {
  try {
    const url = `${CMC_BASE}${req.path}?${new URLSearchParams(req.query).toString()}`;
    const response = await fetch(url, {
      headers: {
        "X-CMC_PRO_API_KEY": CMC_KEY,
        "Accept": "application/json",
      },
    });
    const data = await response.json();
    // Cache 2 minutes
    res.set("Cache-Control", "public, max-age=120");
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.listen(PORT, () => console.log(`CMC Proxy running on :${PORT}`));
