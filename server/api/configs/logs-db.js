import mongoose from "mongoose";

export async function connectToMongoDB() {
  try {
    console.log("▪️▪️▪️Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGODB_CONNECTION_STRING);

    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connect error:", error);

    process.exit(1);
  }
}
