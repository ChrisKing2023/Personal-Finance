import axios from "axios";
import logger from "../../../utils/logger.js";
import Income from "../../models/income.model.js";
import User from "../../models/user.model.js";

const EXCHANGE_API_URL = "https://api.exchangerate-api.com/v4/latest/";

const getTotalIncomeInPreferredCurrency = {
  // Function to get total income of a perticular user with their preferred currency
  async getTotalIncomeInPreferredCurrency(req, res) {
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

      // Fetch user's income transactions
      const incomes = await Income.find({ email });

      if (incomes.length === 0) {
        return res.status(200).json({
          success: true,
          totalIncome: 0,
          currency: preferredCurrency,
          message: "No income records found",
        });
      }

      let totalIncome = 0;
      const conversionRates = {};

      for (const income of incomes) {
        const { amount, currency } = income;

        if (currency === preferredCurrency) {
          totalIncome += amount;
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
          totalIncome += convertedAmount;

          console.log(
            `Converted ${amount} ${currency} -> ${convertedAmount.toFixed(2)} ${preferredCurrency} (Rate: ${exchangeRate})`
          );
        }
      }

      console.log(
        `Total Income in ${preferredCurrency}: ${totalIncome.toFixed(2)}`
      );

      res.status(200).json({
        success: true,
        totalIncome: totalIncome.toFixed(2),
        currency: preferredCurrency,
      });
    } catch (error) {
      logger.error(error.message);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
};

export default getTotalIncomeInPreferredCurrency;
