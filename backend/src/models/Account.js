const mongoose = require("mongoose");
const Role = require("./Role");
const Schema = mongoose.Schema;

const AccountSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String },
    fullName: { type: String, required: true },
    phoneNumber: { type: String, default: "" },
    role: { type: String },
    status: { type: String, enum: ["active", "inactive"], default: "inactive" },
    lastLogin: { type: Date },
  },
  { timestamps: true, collection: "account" }
);

module.exports = mongoose.model("Account", AccountSchema);
