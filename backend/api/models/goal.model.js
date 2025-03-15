import mongoose from "mongoose";

const goalSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxLength: 100,
    },
    image: {
      type: String,
      required: false,
    },
    currency: {
      type: String,
      trim: true,
    },
    targetValue: {
      type: Number,
      required: true,
    },
    savedValue: {
      type: Number,
      default: 0,
    },
    remainingAmount: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      required: false,
      trim: true,
      maxLength: 200,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const Goal = mongoose.model("Goal", goalSchema);

export default Goal;
