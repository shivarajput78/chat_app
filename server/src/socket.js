import User from "./models/User.js";

// Each connected client joins a room named after their own userId, so we can
// target them directly with io.to(userId) regardless of which chat they're in.
export function initSocket(io) {
  io.on("connection", (socket) => {
    let currentUserId = null;

    socket.on("setup", async (userId) => {
      if (!userId) return;
      currentUserId = userId;
      socket.join(userId);
      socket.emit("connected");
      await User.findByIdAndUpdate(userId, { isOnline: true });
      socket.broadcast.emit("user_online", { userId });
    });

    socket.on("join_chat", (chatId) => {
      socket.join(chatId);
    });

    socket.on("leave_chat", (chatId) => {
      socket.leave(chatId);
    });

    socket.on("typing", ({ chatId, userId, name }) => {
      socket.to(chatId).emit("typing", { chatId, userId, name });
    });

    socket.on("stop_typing", ({ chatId, userId }) => {
      socket.to(chatId).emit("stop_typing", { chatId, userId });
    });

    // message has already been persisted via REST; this just fans it out live.
    socket.on("send_message", ({ chatId, message }) => {
      socket.to(chatId).emit("receive_message", { chatId, message });
    });

    socket.on("messages_read", ({ chatId, userId }) => {
      socket.to(chatId).emit("messages_read", { chatId, userId });
    });

    socket.on("status_posted", (status) => {
      socket.broadcast.emit("status_posted", status);
    });

    // ---- WebRTC signaling for voice/video calls ----
    socket.on("call_user", ({ to, from, offer, callType, chatId, callerName, callerAvatar }) => {
      io.to(to).emit("incoming_call", { from, offer, callType, chatId, callerName, callerAvatar });
    });

    socket.on("answer_call", ({ to, answer }) => {
      io.to(to).emit("call_answered", { answer });
    });

    socket.on("ice_candidate", ({ to, candidate }) => {
      io.to(to).emit("ice_candidate", { candidate });
    });

    socket.on("reject_call", ({ to }) => {
      io.to(to).emit("call_rejected");
    });

    socket.on("end_call", ({ to }) => {
      io.to(to).emit("call_ended");
    });

    socket.on("disconnect", async () => {
      if (currentUserId) {
        const lastSeen = new Date();
        await User.findByIdAndUpdate(currentUserId, { isOnline: false, lastSeen });
        socket.broadcast.emit("user_offline", { userId: currentUserId, lastSeen });
      }
    });
  });
}
