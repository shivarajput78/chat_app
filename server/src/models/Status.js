import mongoose from "mongoose";

const statusSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    mediaUrl: { type: String, default: "" },
    mediaType: { type: String, enum: ["image", "video", "text"], default: "image" },
    caption: { type: String, default: "" },
    viewers: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        viewedAt: { type: Date, default: Date.now },
      },
    ],
    createdAt: { type: Date, default: Date.now, expires: 86400 }, // TTL: auto-delete after 24h
  }
);

export default mongoose.model("Status", statusSchema);
