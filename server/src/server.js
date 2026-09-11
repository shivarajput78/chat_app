import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";

import { PORT, CLIENT_URL } from "./config.js";
import { connectDB } from "./db.js";
import { initSocket } from "./socket.js";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import chatRoutes from "./routes/chats.js";
import messageRoutes from "./routes/messages.js";
import statusRoutes from "./routes/status.js";

const app = express();
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());

app.get("/", (req, res) => res.send("Dedo API is running"));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/status", statusRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: CLIENT_URL, credentials: true },
});
initSocket(io);

connectDB().then(() => {
  server.listen(PORT, () => console.log(`Dedo server listening on port ${PORT}`));
});
