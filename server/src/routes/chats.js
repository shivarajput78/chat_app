import express from "express";
import Chat from "../models/Chat.js";
import { protect } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { uploadBuffer } from "../utils/cloudinary.js";

const router = express.Router();

// Get (or create) a 1-on-1 chat with another user.
router.post("/", protect, async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ message: "userId is required" });

  let chat = await Chat.findOne({
    isGroup: false,
    participants: { $all: [req.user._id, userId], $size: 2 },
  })
    .populate("participants", "-password")
    .populate({ path: "latestMessage", populate: { path: "sender", select: "name avatar" } });

  if (!chat) {
    chat = await Chat.create({ isGroup: false, participants: [req.user._id, userId] });
    chat = await chat.populate("participants", "-password");
  }
  res.json(chat);
});

// Get all chats for logged-in user, most recently active first.
router.get("/", protect, async (req, res) => {
  const chats = await Chat.find({ participants: req.user._id })
    .populate("participants", "-password")
    .populate("admins", "-password")
    .populate({ path: "latestMessage", populate: { path: "sender", select: "name avatar" } })
    .sort({ updatedAt: -1 });
  res.json(chats);
});

router.post("/group", protect, upload.single("avatar"), async (req, res) => {
  try {
    let { name, userIds } = req.body;
    userIds = typeof userIds === "string" ? JSON.parse(userIds) : userIds;
    if (!name || !userIds || userIds.length < 1) {
      return res.status(400).json({ message: "Group name and at least one other member are required" });
    }
    let groupAvatar = "";
    if (req.file) {
      const { url } = await uploadBuffer(req.file.buffer, { folder: "dedo/groups" });
      groupAvatar = url;
    }
    let chat = await Chat.create({
      isGroup: true,
      groupName: name,
      groupAvatar,
      participants: [...userIds, req.user._id],
      admins: [req.user._id],
    });
    chat = await chat.populate("participants", "-password");
    res.status(201).json(chat);
  } catch (err) {
    res.status(500).json({ message: "Could not create group", error: err.message });
  }
});

router.put("/group/rename", protect, async (req, res) => {
  const { chatId, name } = req.body;
  const chat = await Chat.findByIdAndUpdate(chatId, { groupName: name }, { new: true }).populate(
    "participants",
    "-password"
  );
  res.json(chat);
});

router.put("/group/add", protect, async (req, res) => {
  const { chatId, userId } = req.body;
  const chat = await Chat.findByIdAndUpdate(
    chatId,
    { $addToSet: { participants: userId } },
    { new: true }
  ).populate("participants", "-password");
  res.json(chat);
});

router.put("/group/remove", protect, async (req, res) => {
  const { chatId, userId } = req.body;
  const chat = await Chat.findByIdAndUpdate(
    chatId,
    { $pull: { participants: userId, admins: userId } },
    { new: true }
  ).populate("participants", "-password");
  res.json(chat);
});

export default router;
