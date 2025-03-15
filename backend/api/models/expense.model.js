import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxLength: 50,
    },

    amount: {
      type: Number,
      required: true,
    },

    type: {
      type: String,
      default: "expense",
    },

    date: {
      type: Date,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: false,
      trim: true,
      maxLength: 50,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },

    currency: {
      type: String,
      required: true,
      default: "USD",
    },

    tags: {
      type: [String],
      default: [],
    },
    isRecurring: { type: Boolean, default: false },
    recurrenceType: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly", null],
      default: null,
    },
    nextOccurrence: { type: Date, default: null },
  },
  { timestamps: true }
);

const Expense = mongoose.model("Expense", expenseSchema);

export default Expense;
