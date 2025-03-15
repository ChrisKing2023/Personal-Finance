import logger from "../../../utils/logger.js";
import Expense from "../../models/expense.model.js";
import Tag from "../../models/tag.model.js";
import Budget from "../../models/budget.model.js";
import TotalSavings from "../../models/totalSavings.model.js";
import recalculateRemainingBudget from "../../service/budget.service.js";
import User from "../../models/user.model.js";
import axios from "axios";

const EXCHANGE_API_URL = "https://api.exchangerate-api.com/v4/latest/";

const allExpense = {
  async updateExpense(req, res) {
    try {
      const { id } = req.params;
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

      const existingExpense = await Expense.findOne({ _id: id, email });
      if (!existingExpense) {
        return res
          .status(404)
          .json({ message: "Expense not found or unauthorized" });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }

      const userCurrency = user.currency;

      // Fetch budgets linked to this expense
      const budgets = await Budget.find({
        email,
        category: existingExpense.category,
        startDate: { $lte: new Date(existingExpense.date) },
        endDate: { $gte: new Date(existingExpense.date) },
      });

      // Refund the old amount before updating
      for (const budget of budgets) {
        await recalculateRemainingBudget(
          email,
          budget.category,
          budget.startDate,
          budget.endDate
        );
      }

      // Prepare updated fields
      const updatedFields = {};
      if (title) updatedFields.title = title;
      if (date) updatedFields.date = new Date(date);
      if (description) updatedFields.description = description;
      if (tags) updatedFields.tags = tags;
      if (isRecurring !== undefined) updatedFields.isRecurring = isRecurring;
      if (typeof category !== "undefined") {
        updatedFields.category = category;
      } else {
        updatedFields.category = existingExpense.category; // Retain previous category
      }

      if (typeof currency !== "undefined") {
        updatedFields.currency = currency;
      } else {
        updatedFields.currency = existingExpense.currency; // Retain previous currency
      }

      // Retain existing amount if not provided in the request body
      if (typeof amount !== "undefined") {
        if (isNaN(amount) || !isFinite(amount)) {
          return res.status(400).json({ message: "Invalid or missing amount" });
        }

        updatedFields.amount = amount;
      } else {
        updatedFields.amount = existingExpense.amount; // Retain previous amount
      }

      if (isRecurring) {
        if (
          !["daily", "weekly", "monthly", "yearly"].includes(recurrenceType)
        ) {
          return res.status(400).json({ message: "Invalid recurrence type" });
        }
        updatedFields.recurrenceType = recurrenceType;
        const initialDate = new Date(date || new Date());

        // Set nextOccurrence based on recurrence type
        let nextOccurrence;
        if (recurrenceType === "daily") {
          nextOccurrence = new Date(
            initialDate.setDate(initialDate.getDate() + 1)
          ); // Adds one day for daily
        } else if (recurrenceType === "weekly") {
          nextOccurrence = new Date(
            initialDate.setDate(initialDate.getDate() + 7)
          ); // Adds seven days for weekly
        } else if (recurrenceType === "monthly") {
          nextOccurrence = new Date(
            initialDate.setMonth(initialDate.getMonth() + 1)
          ); // Adds one month for monthly
        } else if (recurrenceType === "yearly") {
          nextOccurrence = new Date(
            initialDate.setFullYear(initialDate.getFullYear() + 1)
          ); // Adds one year for yearly
        }

        // Adjust nextOccurrence if it's earlier than today's date
        const today = new Date();
        if (nextOccurrence < today) {
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
        updatedFields.nextOccurrence = nextOccurrence;
      } else {
        updatedFields.recurrenceType = null;
        updatedFields.nextOccurrence = null;
      }

      const updatedExpense = await Expense.findOneAndUpdate(
        { _id: id, email },
        updatedFields,
        { new: true }
      );

      if (!updatedExpense) {
        return res
          .status(404)
          .json({ message: "Expense not found or unauthorized" });
      }

      // Remove old tags and save new ones
      await Tag.deleteMany({ transactionId: id });
      if (tags && tags.length > 0) {
        const tagDocuments = tags.map(tag => ({
          name: tag,
          transactionId: id,
          transactionType: "Expense",
        }));
        await Tag.insertMany(tagDocuments);
      }

      // Handle Savings Category Logic
      const newCategory = category || existingExpense.category;
      const newAmount =
        typeof amount !== "undefined" ? amount : existingExpense.amount;
      const newCurrency = currency || existingExpense.currency;

      // 1. If neither the previous nor the updated category is "Savings", do nothing.
      // 2. If the category is "Savings", update the total savings.

      if (existingExpense.category !== "Savings" && newCategory !== "Savings") {
        // Case 1: Neither before nor after is "Savings" -> Do nothing
      } else {
        let totalSavings = await TotalSavings.findOne({ email });

        if (
          existingExpense.category === "Savings" &&
          newCategory !== "Savings"
        ) {
          // Case 2: Deduct savedAmount if changing category from "Savings"
          if (totalSavings) {
            let convertedAmount;
            if (totalSavings.currency !== existingExpense.currency) {
              const conversionRate = await getExchangeRate(
                existingExpense.currency,
                totalSavings.currency
              );
              if (isNaN(conversionRate) || !isFinite(conversionRate)) {
                return res
                  .status(400)
                  .json({ message: "Invalid conversion rate" });
              }
              convertedAmount = existingExpense.amount * conversionRate;
            } else {
              convertedAmount = existingExpense.amount;
            }

            totalSavings.savedAmount = Math.max(
              0,
              totalSavings.savedAmount - convertedAmount
            );
            await totalSavings.save();
          }
        } else if (
          existingExpense.category !== "Savings" &&
          newCategory === "Savings"
        ) {
          // Case 3: Add savedAmount if changing category to "Savings"

          if (isNaN(newAmount) || !isFinite(newAmount)) {
            return res
              .status(400)
              .json({ message: "Amount is required for Savings category" });
          }

          let totalSavings = await TotalSavings.findOne({ email });

          if (!totalSavings) {
            const conversionRate =
              userCurrency !== newCurrency
                ? await getExchangeRate(newCurrency, userCurrency)
                : 1;

            if (isNaN(conversionRate) || !isFinite(conversionRate)) {
              return res
                .status(400)
                .json({ message: "Invalid conversion rate" });
            }

            const convertedAmount = newAmount * conversionRate;
            totalSavings = new TotalSavings({
              email,
              currency: userCurrency,
              savedAmount: convertedAmount,
            });

            await totalSavings.save();
          } else {
            let convertedAmount;
            if (totalSavings.currency !== newCurrency) {
              const conversionRate = await getExchangeRate(
                newCurrency,
                totalSavings.currency
              );
              if (isNaN(conversionRate) || !isFinite(conversionRate)) {
                return res
                  .status(400)
                  .json({ message: "Invalid conversion rate" });
              }
              convertedAmount = newAmount * conversionRate;
            } else {
              convertedAmount = newAmount;
            }

            totalSavings.savedAmount += convertedAmount;
            await totalSavings.save();
          }
        } else if (
          existingExpense.category === "Savings" &&
          newCategory === "Savings"
        ) {
          // Case 4: Update savedAmount if the category is still "Savings"
          if (
            existingExpense.category === "Savings" &&
            newCategory === "Savings"
          ) {
            // If the amount changes, we need to update total savings accordingly
            if (newAmount !== existingExpense.amount) {
              if (totalSavings) {
                let convertedAmount;

                // Step 1: Deduct the old amount
                if (totalSavings.currency !== existingExpense.currency) {
                  const conversionRate = await getExchangeRate(
                    existingExpense.currency,
                    totalSavings.currency
                  );
                  if (isNaN(conversionRate) || !isFinite(conversionRate)) {
                    return res
                      .status(400)
                      .json({ message: "Invalid conversion rate" });
                  }
                  convertedAmount = existingExpense.amount * conversionRate;
                } else {
                  convertedAmount = existingExpense.amount;
                }

                totalSavings.savedAmount -= convertedAmount;

                // Step 2: Add the new amount
                if (totalSavings.currency !== newCurrency) {
                  const conversionRate = await getExchangeRate(
                    newCurrency,
                    totalSavings.currency
                  );
                  if (isNaN(conversionRate) || !isFinite(conversionRate)) {
                    return res
                      .status(400)
                      .json({ message: "Invalid conversion rate" });
                  }
                  convertedAmount = newAmount * conversionRate;
                } else {
                  convertedAmount = newAmount;
                }

                totalSavings.savedAmount += convertedAmount;

                await totalSavings.save();
              }
            }
          }
        }
      }

      res.status(200).json({
        success: true,
        message: "Expense updated successfully",
        expense: updatedExpense,
      });

      // Recalculate budgets with updated values
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

export default allExpense;
