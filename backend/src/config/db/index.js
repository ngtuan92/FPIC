import mongoose from "mongoose";

export async function connect() {
  try {
    mongoose.set("strictQuery", false);

    // Thêm sự kiện kết nối
    mongoose.connection.on("connected", () => {
      console.log("✅ Mongoose connected to DB");
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ Mongoose connection error:", err);
    });

    // Thêm timeout
    await mongoose.connect("mongodb://127.0.0.1:27017/FPIC", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // 5 giây timeout
    });

    console.log("✅ Connected to MongoDB (main function)");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
}