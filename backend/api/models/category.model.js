import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema({
  value: {
    type: String,
    required: true,
    unique: true,
  },
  label: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["income", "expense"],
    required: true,
  },
});

const Category = mongoose.model("Category", CategorySchema);

export default Category;
