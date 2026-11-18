const express = require("express");
const helmet = require("helmet");
const crypto = require("crypto");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SESSION_SECRET = process.env.SESSION_SECRET;

if (!ADMIN_PASSWORD || !SESSION_SECRET) {
  console.error("Missing ADMIN_PASSWORD or SESSION_SECRET environment variable.");
  process.exit(1);
}

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"]
    }
  }
}));
app.use(express.json({ limit: "10kb" }));

const COOKIE_NAME = "ff_admin";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const startedAt = Date.now();

// Prototype settings are held in memory and reset when the service restarts.
// No game credentials are requested or stored.
let settings = {
  monitoringEnabled: false,
  playerUid: "",
  playerLabel: "",
  bio: ""
};

function sign(value) {
  return crypto.createHmac("sha256", SESSION_SECRET).update(value).digest("hex");
}
function safeEqual(a, b) {
  const aa = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}
function makeToken() {
  const expires = Date.now() + COOKIE_MAX_AGE;
  const payload = String(expires);
  return `${payload}.${sign(payload)}`;
}
function isAuthenticated(req) {
  const raw = req.headers.cookie || "";
  const entry = raw.split(";").map(v => v.trim()).find(v => v.startsWith(COOKIE_NAME + "="));
  if (!entry) return false;
  const token = decodeURIComponent(entry.slice(COOKIE_NAME.length + 1));
  const parts = token.split(".");
  if (parts.length !== 2 || !/^\d+$/.test(parts[0])) return false;
  if (Number(parts[0]) < Date.now()) return false;
  return safeEqual(parts[1], sign(parts[0]));
}
function requireAuth(req, res, next) {
  if (!isAuthenticated(req)) return res.status(401).json({ error: "লগইন প্রয়োজন।" });
  next();
}
function cookieOptions(maxAge) {
  return [
    `${COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    `Max-Age=${Math.floor(maxAge / 1000)}`,
    process.env.NODE_ENV === "production" ? "Secure" : ""
  ].filter(Boolean).join("; ");
}

app.post("/api/login", (req, res) => {
  const password = req.body && req.body.password;
  if (typeof password !== "string" || !safeEqual(password, ADMIN_PASSWORD)) {
    return res.status(401).json({ error: "পাসওয়ার্ড সঠিক নয়।" });
  }
  const token = makeToken();
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${COOKIE_MAX_AGE / 1000}${secure}`);
  res.json({ ok: true });
});

app.post("/api/logout", (req, res) => {
  res.setHeader("Set-Cookie", cookieOptions(0));
  res.json({ ok: true });
});

app.get("/api/me", (req, res) => res.json({ authenticated: isAuthenticated(req) }));

app.get("/api/status", requireAuth, (req, res) => {
  res.json({
    service: "online",
    monitoringEnabled: settings.monitoringEnabled,
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    mode: "dashboard-only",
    account: {
      playerUid: settings.playerUid,
      playerLabel: settings.playerLabel,
      bio: settings.bio
    }
  });
});

app.put("/api/settings", requireAuth, (req, res) => {
  const body = req.body || {};
  const playerUid = String(body.playerUid || "").trim().slice(0, 32);
  const playerLabel = String(body.playerLabel || "").trim().slice(0, 40);
  const bio = String(body.bio || "").trim().slice(0, 150);
  settings = {
    monitoringEnabled: body.monitoringEnabled === true,
    playerUid,
    playerLabel,
    bio
  };
  res.json({ ok: true, settings });
});

app.get("/health", (_req, res) => res.status(200).json({ ok: true }));

app.use(express.static(path.join(__dirname, "public")));
app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Dashboard listening on port ${PORT}`);
});
