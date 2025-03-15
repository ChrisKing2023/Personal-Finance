import axios from "axios";
import logger from "../../../utils/logger.js";
import Expense from "../../models/expense.model.js";
import User from "../../models/user.model.js";

const EXCHANGE_API_URL = "https://api.exchangerate-api.com/v4/latest/";

const getTotalExpenseInPreferredCurrency = {
  // Function to get total expense of a perticular user with their preferred currency
  async getTotalExpenseInPreferredCurrency(req, res) {
    try {
      const email = req.user?.email;
      if (!email) {
        return res.status(400).json({ message: "User email is required" });
      }

      // Fetch user details to get preferred currency
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const preferredCurrency = user.currency || "USD";

      // Fetch user's expense transactions
      const expenses = await Expense.find({ email });

      if (expenses.length === 0) {
        return res.status(200).json({
          success: true,
          totalExpense: 0,
          currency: preferredCurrency,
          message: "No expense records found",
        });
      }

      let totalExpense = 0;
      const conversionRates = {};

      for (const expense of expenses) {
        const { amount, currency } = expense;

        if (currency === preferredCurrency) {
          totalExpense += amount;
        } else {
          if (!conversionRates[currency]) {
            try {
              const response = await axios.get(
                `${EXCHANGE_API_URL}${currency}`
              );
              conversionRates[currency] = response.data.rates;
            } catch (error) {
              logger.error(`Failed to fetch exchange rate for ${currency}`);
              return res.status(500).json({
                message: `Error fetching exchange rate for ${currency}`,
              });
            }
          }

          // Convert the amount to the preferred currency
          const exchangeRate = conversionRates[currency][preferredCurrency];
          if (!exchangeRate) {
            return res.status(400).json({
              message: `Exchange rate for ${currency} to ${preferredCurrency} not available`,
            });
          }

          const convertedAmount = amount * exchangeRate;
          totalExpense += convertedAmount;

          console.log(
            `Converted ${amount} ${currency} -> ${convertedAmount.toFixed(2)} ${preferredCurrency} (Rate: ${exchangeRate})`
          );
        }
      }

      console.log(
        `Total Expense in ${preferredCurrency}: ${totalExpense.toFixed(2)}`
      );

      res.status(200).json({
        success: true,
        totalExpense: totalExpense.toFixed(2),
        currency: preferredCurrency,
      });
    } catch (error) {
      logger.error(error.message);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
};

export default getTotalExpenseInPreferredCurrency;
