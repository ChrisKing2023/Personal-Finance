import mongoose from "mongoose";

const currencySchema = new mongoose.Schema(
  {
    value: { type: String, required: true, unique: true },
    label: { type: String, required: true },
  },
  { timestamps: true }
);

const Currency = mongoose.model("Currency", currencySchema);

export default Currency;
