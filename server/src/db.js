import mongoose from "mongoose";
import { MONGO_URI } from "./config.js";

export async function connectDB() {
  if (!MONGO_URI) {
    console.error("MONGO_URI is not set. Add it to your .env file.");
    process.exit(1);
  }
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
}
