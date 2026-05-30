const mongoose = require("mongoose");
const { Schema } = mongoose;

const microchipSchema = new Schema(
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
      default: "",
    },
    device: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "microchips",
  }
);

const Microchip = mongoose.model("Microchip", microchipSchema);

module.exports = Microchip;
