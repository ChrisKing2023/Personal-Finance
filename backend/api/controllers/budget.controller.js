import axios from "axios";
import logger from "../../utils/logger.js";
import Budget from "../models/budget.model.js";
import Expense from "../models/expense.model.js";
import User from "../models/user.model.js";
import xss from "xss";

const EXCHANGE_API_URL = "https://api.exchangerate-api.com/v4/latest/";

const budgetController = {
  async addOrUpdateBudget(req, res) {
    try {
      let { category, budget, startDate, endDate } = req.body;
      const email = req.user?.email;

      if (!email) {
        return res.status(400).json({ message: "User email is required" });
      }

      // Sanitize and validate inputs
      category = xss(category);
      budget = xss(budget);
      startDate = xss(startDate);
      endDate = xss(endDate);

      if (!category || !budget || budget < 0 || !startDate || !endDate) {
        return res.status(400).json({ message: "Invalid input values" });
      }

      // Fetch user
      const user = await User.findOne({ email });

      if (!user) {
        console.log("Error: User not found");
        return res.status(404).json({ message: "User not found" });
      }

      const preferredCurrency = user.currency || "USD";

      // Fetch expenses
      const expenses = await Expense.find({
        email,
        category,
        date: { $gte: new Date(startDate), $lte: new Date(endDate) },
      });

      let totalExpenseAmount = 0;
      const uniqueCurrencies = [...new Set(expenses.map(exp => exp.currency))];

      // Fetch exchange rates
      const conversionRates = {};
      for (const currency of uniqueCurrencies) {
        if (currency !== preferredCurrency) {
          try {
            const response = await axios.get(`${EXCHANGE_API_URL}${currency}`);
            conversionRates[currency] = response.data.rates[preferredCurrency];
          } catch (error) {
            console.error(`Failed to fetch exchange rate for ${currency}`);
            conversionRates[currency] = null;
          }
        }
      }

      // Convert expenses
      for (const expense of expenses) {
        const { amount, currency } = expense;

        if (currency === preferredCurrency) {
          totalExpenseAmount += amount;
        } else if (conversionRates[currency]) {
          totalExpenseAmount += amount * conversionRates[currency];
        } else {
          console.log(`Skipping expense in ${currency}, using original value`);
          totalExpenseAmount += amount;
        }
      }

      // Check if budget exists
      let budgetData = await Budget.findOne({
        email,
        category,
        startDate,
        endDate,
      });

      if (budgetData) {
        console.log("Updating existing budget");
        budgetData.budget = budget;
        budgetData.remainingBudget = budget - totalExpenseAmount;

        console.log(budgetData.remainingBudget);
        budgetData.currency = preferredCurrency;

        console.log(budgetData.currency);
        await budgetData.save();

        return res.status(200).json({
          success: true,
          message: "Budget updated successfully",
          budget: budgetData,
        });
      }

      // Create a new budget entry

      budgetData = new Budget({
        email,
        category,
        budget,
        remainingBudget: budget - totalExpenseAmount,
        startDate,
        endDate,
        currency: preferredCurrency,
      });

      await budgetData.save();

      res.status(201).json({
        success: true,
        message: "Budget created successfully",
        budget: {
          _id: budgetData._id,
          email: budgetData.email,
          category: budgetData.category,
          budget: budgetData.budget,
          remainingBudget: budgetData.remainingBudget,
          startDate: budgetData.startDate,
          endDate: budgetData.endDate,
          currency: budgetData.currency,
        },
      });
    } catch (error) {
      console.error("Error in addOrUpdateBudget:", error.message);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  async getBudgets(req, res) {
    try {
      const email = req.user?.email;

      if (!email) {
        return res.status(400).json({ message: "User email is required" });
      }

      const budgets = await Budget.find({ email });

      res.status(200).json({
        success: true,
        budgets,
      });
    } catch (error) {
      logger.error(error.message);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  async deleteBudget(req, res) {
    try {
      const { id } = req.params;
      const email = req.user?.email;

      if (!email) {
        return res.status(400).json({ message: "User email is required" });
      }

      const budgetData = await Budget.findById(id);

      if (!budgetData) {
        return res.status(404).json({ message: "Budget not found" });
      }

      await Budget.findByIdAndDelete(id);

      res.status(200).json({
        success: true,
        message: "Budget deleted successfully",
      });
    } catch (error) {
      logger.error(error.message);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
};

export default budgetController;
