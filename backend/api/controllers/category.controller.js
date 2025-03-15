import Category from "../models/category.model.js";
import xss from "xss";

const categoryController = {
  // Get all categories
  async getCategories(req, res) {
    try {
      const categories = await Category.find();
      res.status(200).json(categories);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving categories", error });
    }
  },

  // Get all income categories
  async getIncomes(req, res) {
    try {
      const incomes = await Category.find({ type: "income" });
      res.status(200).json(incomes);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error retrieving income categories", error });
    }
  },

  // Get all expense categories
  async getExpenses(req, res) {
    try {
      const expenses = await Category.find({ type: "expense" });
      res.status(200).json(expenses);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error retrieving expense categories", error });
    }
  },

  // Add a new category
  async createCategory(req, res) {
    let { value, label, type } = req.body;

    // Sanitize inputs
    value = xss(value);
    label = xss(label);
    type = xss(type);

    if (!value || !label || !type) {
      return res.status(400).json({ message: "All fields are required" });
    }

    try {
      const newCategory = new Category({ value, label, type });
      await newCategory.save();
      res.status(201).json(newCategory);
    } catch (error) {
      res.status(500).json({ message: "Error creating category", error });
    }
  },

  // Update a category
  async updateCategory(req, res) {
    const { id } = req.params;
    let { value, label, type } = req.body;

    // Sanitize inputs
    value = xss(value);
    label = xss(label);
    type = xss(type);

    if (!value || !label || !type) {
      return res.status(400).json({ message: "All fields are required" });
    }

    try {
      const updatedCategory = await Category.findByIdAndUpdate(
        id,
        { value, label, type },
        { new: true } // Return the updated document
      );

      if (!updatedCategory) {
        return res.status(404).json({ message: "Category not found" });
      }

      res
        .status(200)
        .json({ message: "Category updated successfully", updatedCategory });
    } catch (error) {
      res.status(500).json({ message: "Error updating category", error });
    }
  },

  // Delete a category
  async deleteCategory(req, res) {
    const { id } = req.params;

    try {
      const deletedCategory = await Category.findByIdAndDelete(id);
      if (!deletedCategory) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.status(200).json({ message: "Category deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting category", error });
    }
  },
};

export default categoryController;
