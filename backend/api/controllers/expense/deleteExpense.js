import logger from "../../../utils/logger.js";
import Expense from "../../models/expense.model.js";
import Tag from "../../models/tag.model.js";
import Budget from "../../models/budget.model.js";
import TotalSavings from "../../models/totalSavings.model.js";
import recalculateRemainingBudget from "../../service/budget.service.js";
import axios from "axios";

const EXCHANGE_API_URL = "https://api.exchangerate-api.com/v4/latest/";

const deleteExpense = {
  //Function to delete a specific expense
  async deleteExpense(req, res) {
    try {
      const { id } = req.params;
      const email = req.user?.email;

      if (!email)
        return res.status(400).json({ message: "User email is required" });

      const expense = await Expense.findOne({ _id: id, email });

      if (!expense) {
        return res
          .status(404)
          .json({ message: "Expense not found or unauthorized" });
      }

      if (expense.isRecurring) {
        return res.status(400).json({
          message:
            "Cannot delete a recurring expense. Please disable recurrence first.",
        });
      }

      // Fetch budgets linked to this expense
      const budgets = await Budget.find({
        email,
        category: expense.category,
        startDate: { $lte: new Date(expense.date) },
        endDate: { $gte: new Date(expense.date) },
      });

      // Refund the amount to the budget before deleting
      for (const budget of budgets) {
        await recalculateRemainingBudget(
          email,
          budget.category,
          budget.startDate,
          budget.endDate
        );
      }

      // Handle the savings category deduction
      if (expense.category === "Savings") {
        let totalSavings = await TotalSavings.findOne({ email });

        if (totalSavings) {
          // If TotalSavings record exists, subtract the expense amount
          if (totalSavings.currency !== expense.currency) {
            // If currencies don't match, convert the expense amount to the savings currency
            const conversionRate = await getExchangeRate(
              expense.currency,
              totalSavings.currency
            );
            const convertedAmount = expense.amount * conversionRate;
            totalSavings.savedAmount -= convertedAmount;
          } else {
            totalSavings.savedAmount -= expense.amount;
          }
          await totalSavings.save();
        }
      }

      await Expense.deleteOne({ _id: id, email });

      // Remove associated tags
      await Tag.deleteMany({ transactionId: id });

      res.status(200).json({
        success: true,
        message: "Expense deleted successfully",
      });

      // Recalculate remaining budgets
      for (const budget of budgets) {
        await recalculateRemainingBudget(
          email,
          expense.category,
          budget.startDate,
          budget.endDate
        );
      }
    } catch (error) {
      logger.error(error.message);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
};

// Helper function to get exchange rates
const getExchangeRate = async (fromCurrency, toCurrency) => {
  try {
    const response = await axios.get(`${EXCHANGE_API_URL}${fromCurrency}`);
    const exchangeRates = response.data.rates;
    return exchangeRates[toCurrency] || 1; // Return conversion rate or 1 if not found
  } catch (error) {
    logger.error("Error fetching exchange rates:", error);
    return 1; // If error, return 1 (no conversion)
  }
};

export default deleteExpense;
