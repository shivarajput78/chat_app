import express from "express";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { uploadBuffer } from "../utils/cloudinary.js";

const router = express.Router();

router.get("/me", protect, async (req, res) => {
  res.json(req.user);
});

// Search users by name/email, excluding self. Used for "start new chat".
router.get("/", protect, async (req, res) => {
  const search = req.query.search || "";
  const users = await User.find({
    _id: { $ne: req.user._id },
    $or: [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ],
  }).select("-password");
  res.json(users);
});

router.put("/me", protect, upload.single("avatar"), async (req, res) => {
  try {
    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.about) updates.about = req.body.about;
    if (req.file) {
      const { url } = await uploadBuffer(req.file.buffer, { folder: "dedo/avatars" });
      updates.avatar = url;
    }
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Could not update profile", error: err.message });
  }
});

export default router;
