import logger from "../../../utils/logger.js";
import Expense from "../../models/expense.model.js";
import Tag from "../../models/tag.model.js";
import Budget from "../../models/budget.model.js";
import TotalSavings from "../../models/totalSavings.model.js";
import recalculateRemainingBudget from "../../service/budget.service.js";
import User from "../../models/user.model.js";
import axios from "axios";
import xss from "xss";

const EXCHANGE_API_URL = "https://api.exchangerate-api.com/v4/latest/";

const addExpense = {
  //Function for User to add a new expense
  async addExpense(req, res) {
    try {
      const {
        title,
        amount,
        date,
        category,
        description,
        currency,
        tags,
        isRecurring,
        recurrenceType,
      } = req.body;

      const email = req.user?.email;
      if (!email)
        return res.status(400).json({ message: "User email is required" });

      if (!title || !amount || !date || !category || !currency) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }
      const userCurrency = user.currency;

      // Sanitize and validate amount (should be a positive number)
      const sanitizedAmount = parseFloat(amount);
      if (isNaN(sanitizedAmount) || sanitizedAmount <= 0) {
        return res
          .status(400)
          .json({ message: "Amount must be a positive number" });
      }

      // Sanitize string inputs
      const sanitizedTitle = xss(title);
      const sanitizedCategory = xss(category);
      const sanitizedDescription = xss(description || "");
      const sanitizedCurrency = xss(currency);
      const sanitizedTags = tags ? tags.map(tag => xss(tag)) : [];

      // Handle Recurring Transactions
      let nextOccurrence = null;
      if (isRecurring) {
        if (
          !["daily", "weekly", "monthly", "yearly"].includes(recurrenceType)
        ) {
          return res.status(400).json({ message: "Invalid recurrence type" });
        }

        const initialDate = new Date(date);

        // Set nextOccurrence based on recurrence type
        if (recurrenceType === "daily") {
          nextOccurrence = new Date(
            initialDate.setDate(initialDate.getDate() + 1)
          ); // Adds one day
        } else if (recurrenceType === "weekly") {
          nextOccurrence = new Date(
            initialDate.setDate(initialDate.getDate() + 7)
          ); // Adds seven days
        } else if (recurrenceType === "monthly") {
          nextOccurrence = new Date(
            initialDate.setMonth(initialDate.getMonth() + 1)
          ); // Adds one month
        } else if (recurrenceType === "yearly") {
          nextOccurrence = new Date(
            initialDate.setFullYear(initialDate.getFullYear() + 1)
          ); // Adds one year
        }

        // Compare nextOccurrence with today and adjust if it's earlier than today
        const today = new Date();
        if (nextOccurrence < today) {
          // If nextOccurrence is before today, set it to today's date + recurrence period
          if (recurrenceType === "daily") {
            nextOccurrence = new Date(today.setDate(today.getDate() + 1));
          } else if (recurrenceType === "weekly") {
            nextOccurrence = new Date(today.setDate(today.getDate() + 7));
          } else if (recurrenceType === "monthly") {
            nextOccurrence = new Date(today.setMonth(today.getMonth() + 1));
          } else if (recurrenceType === "yearly") {
            nextOccurrence = new Date(
              today.setFullYear(today.getFullYear() + 1)
            );
          }
        }
      }

      const newExpense = new Expense({
        title: sanitizedTitle,
        amount: sanitizedAmount,
        date: new Date(date),
        category: sanitizedCategory,
        description: sanitizedDescription,
        currency: sanitizedCurrency,
        tags: sanitizedTags,
        email,
        isRecurring: !!isRecurring,
        recurrenceType: isRecurring ? recurrenceType : null,
        nextOccurrence,
      });

      await newExpense.save();

      // Save tags
      if (tags && tags.length > 0) {
        const tagDocuments = tags.map(tag => ({
          name: tag,
          transactionId: newExpense._id,
          transactionType: "Expense",
        }));
        await Tag.insertMany(tagDocuments);
      }

      res.status(201).json({
        success: true,
        message: "Expense added successfully",
        expense: newExpense,
      });

      // If category is "Savings", handle the savings update
      if (category === "Savings") {
        let totalSavings = await TotalSavings.findOne({ email });

        if (totalSavings) {
          // If TotalSavings record exists, update the saved amount
          if (totalSavings.currency !== currency) {
            // If the currencies don't match, convert the expense amount to the savings currency
            const conversionRate = await getExchangeRate(
              currency,
              totalSavings.currency
            );
            const convertedAmount = amount * conversionRate;
            totalSavings.savedAmount += convertedAmount;
          } else {
            totalSavings.savedAmount += amount;
          }
          await totalSavings.save();
        } else {
          // If no record found, create a new TotalSavings record with the user's currency
          const conversionRate =
            userCurrency !== currency
              ? await getExchangeRate(currency, userCurrency)
              : 1;
          const convertedAmount = amount * conversionRate;

          totalSavings = new TotalSavings({
            email,
            currency: userCurrency,
            savedAmount: convertedAmount,
          });
          await totalSavings.save();
        }
      }

      // Find all relevant budgets and recalculate
      const budgets = await Budget.find({
        email,
        category,
        startDate: { $lte: new Date(date) },
        endDate: { $gte: new Date(date) },
      });

      for (const budget of budgets) {
        await recalculateRemainingBudget(
          email,
          category,
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

export default addExpense;
