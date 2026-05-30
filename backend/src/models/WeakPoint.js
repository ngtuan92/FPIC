const mongoose = require("mongoose");
const { Schema } = mongoose;

const weakPointSchema = new Schema(
  {
    name: {
      type: String,
      default: "",
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    imagePath: {
      type: String,
    },
    category: {
      type: String,
      enum: [
        "jtag",
        "testPin",
        "lpc",
        "footprint",
        "unusedPort",
        "vias",
        "spi",
        "smb",
      ],
    },
    device: {
      type: String,
      default: "",
      trim: true,
    },
  },

  {
    timestamps: true,
    collection: "weakpoints",
  }
);

const WeakPoint = mongoose.model("WeakPoint", weakPointSchema);

module.exports = WeakPoint;
