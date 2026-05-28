import { Server } from "socket.io";
import User from "./models/user.model.js";

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: function (origin, callback) {
        const allowed = [
          "http://localhost:5173",
          "http://localhost:3000",
          process.env.FRONTEND_URL
        ];
        if (!origin || allowed.includes(origin) || origin.endsWith('.vercel.app')) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS: ' + origin));
        }
      },
      credentials: true,
    },
  });

  io.on("connection", (socket) => {

    socket.on("join", (userId) => {
      if (userId) {
        socket.userId = userId;
        socket.join(userId);
      }
    });

    socket.on("delivery:location", async ({ customerId, lat, lon }) => {
      if (customerId) {
        io.to(customerId).emit("location:update", { lat, lon });
      }
      
      // Persist the delivery boy's live location to the database so that
      // if the customer refreshes the page, they don't see the old location.
      if (socket.userId && lat && lon) {
        try {
          await User.findByIdAndUpdate(socket.userId, {
            location: {
              type: "Point",
              coordinates: [lon, lat],
            }
          });
        } catch (err) {
          console.error("Failed to update delivery boy location:", err);
        }
      }
    });

    socket.on("disconnect", () => {});
  });

  return io;
};

export const getIo = () => {
  if (!io) throw new Error("Socket.io not initialised");
  return io;
};
