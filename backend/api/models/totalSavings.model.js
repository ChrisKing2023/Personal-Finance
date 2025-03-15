import mongoose from "mongoose";

const totalSavingsSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
    },
    currency: {
      type: String,
      required: true,
      trim: true,
    },
    savedAmount: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const TotalSavings = mongoose.model("TotalSavings", totalSavingsSchema);

export default TotalSavings;
