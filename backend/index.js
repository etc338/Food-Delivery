import express from "express";
import http from "http";
import dotenv from "dotenv";
dotenv.config({ quiet: true });
import connectDb from "./config/db.js";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import cors from "cors";
import userRoutes from "./routes/user.routes.js";
import itemRoutes from "./routes/item.routes.js";
import shopRoutes from "./routes/shop.routes.js";
import orderRoutes from "./routes/order.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import { initSocket } from "./socket.js";

const app = express();
const httpServer = http.createServer(app);

initSocket(httpServer);

const port = process.env.PORT || 8000;

app.use(cors({
  origin: function (origin, callback) {
    const allowed = [
      "http://localhost:5173",
      "http://localhost:3000",
      process.env.FRONTEND_URL
    ];
    // Allow if it's in the allowed list, OR if it's a Vercel deployment, OR if there's no origin (like Postman)
    if (!origin || allowed.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS: ' + origin));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Trust the proxy (Required for express-rate-limit to get the real IP if hosted online)
app.set("trust proxy", 1);

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/shop", shopRoutes);
app.use("/api/item", itemRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/ai", aiRoutes);

// If the port is still busy (race condition on restart), retry after 1.5s.
httpServer.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.warn(`Port ${port} busy — retrying in 1.5s...`);
    setTimeout(() => httpServer.listen(port), 1500);
  } else {
    throw err;
  }
});

httpServer.listen(port, () => {
  connectDb();
  console.log(`Server is running on port ${port}`);
});

// nodemon.json sets signal=SIGTERM. We close all connections before exiting
// so the OS releases the port before nodemon starts the new process.
const shutdown = () => {
  httpServer.closeAllConnections?.();
  httpServer.close(() => process.exit(0));
};

process.on("SIGTERM", shutdown);
process.once("SIGUSR2", () => {
  httpServer.closeAllConnections?.();
  httpServer.close(() => process.kill(process.pid, "SIGUSR2"));
});
