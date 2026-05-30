const mongoose = require("mongoose");

const SoDoKhoiSchema = new mongoose.Schema(
  {
    name: String,
    filePath: String,
  },
  { timestamps: true, collection: "sodokhoi" }
);
module.exports = mongoose.model("SoDoKhoi", SoDoKhoiSchema);
