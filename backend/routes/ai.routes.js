// ─────────────────────────────────────────────────────────────────
//  ai.routes.js — Routes for the Vingo AI endpoint
// ─────────────────────────────────────────────────────────────────

import express from "express";
import rateLimit from "express-rate-limit";
import { isAuth } from "../middlewares/isAuth.js";
import { askAi } from "../controllers/ai.controller.js";

const aiRoutes = express.Router();

// ── SECURITY: Rate Limiter
// Why: Without this, a single user (or a bot) could hammer /api/ai/ask
//      thousands of times and drain your entire Google API quota in minutes.
//
// windowMs: 60 * 60 * 1000 = 1 hour in milliseconds
// max: 30 → each IP address can only call this endpoint 30 times per hour
// standardHeaders: true → sends "RateLimit-*" headers in the response so the
//   frontend can read how many requests are left
// legacyHeaders: false → disables the old X-RateLimit-* header format
// message: the JSON body returned when the limit is exceeded
const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,   // 1 hour window
  max: 30,                     // 30 AI requests per IP per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    reply: "⚠️ You have sent too many messages! Please wait an hour before asking Vingo AI again.",
  },
});

// Apply: isAuth (only logged-in users) + aiRateLimiter (max 30/hour) + askAi (the actual logic)
aiRoutes.post("/ask", isAuth, aiRateLimiter, askAi);

export default aiRoutes;
