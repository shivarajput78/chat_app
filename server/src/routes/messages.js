import express from "express";
import Message from "../models/Message.js";
import Chat from "../models/Chat.js";
import { protect } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { uploadBuffer } from "../utils/cloudinary.js";

const router = express.Router();

router.get("/:chatId", protect, async (req, res) => {
  const messages = await Message.find({ chat: req.params.chatId })
    .populate("sender", "name avatar")
    .sort({ createdAt: 1 });
  res.json(messages);
});

router.post("/", protect, upload.single("media"), async (req, res) => {
  try {
    const { chatId, content } = req.body;
    if (!chatId) return res.status(400).json({ message: "chatId is required" });

    let mediaUrl = "";
    let mediaType = "none";
    if (req.file) {
      const { url, resourceType } = await uploadBuffer(req.file.buffer, { folder: "dedo/messages" });
      mediaUrl = url;
      mediaType =
        resourceType === "image" ? "image" : resourceType === "video" ? "video" : "file";
    }
    if (!content && mediaType === "none") {
      return res.status(400).json({ message: "Message must have text or media" });
    }

    let message = await Message.create({
      chat: chatId,
      sender: req.user._id,
      content: content || "",
      mediaUrl,
      mediaType,
      deliveredTo: [req.user._id],
      readBy: [req.user._id],
    });
    message = await message.populate("sender", "name avatar");

    await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: "Could not send message", error: err.message });
  }
});

// Mark every message in a chat as read by the current user.
router.put("/seen/:chatId", protect, async (req, res) => {
  await Message.updateMany(
    { chat: req.params.chatId, readBy: { $ne: req.user._id } },
    { $addToSet: { readBy: req.user._id, deliveredTo: req.user._id } }
  );
  res.json({ ok: true });
});

export default router;
