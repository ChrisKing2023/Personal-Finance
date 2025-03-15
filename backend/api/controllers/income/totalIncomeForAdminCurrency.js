import axios from "axios";
import logger from "../../../utils/logger.js";
import Income from "../../models/income.model.js";
import User from "../../models/user.model.js";

const EXCHANGE_API_URL = "https://api.exchangerate-api.com/v4/latest/";

const incomeController = {
  // Function to get all incomes converted to the admin's preferred currency
  async getTotalIncomeForAdmin(req, res) {
    try {
      // Fetch admin's details to get their preferred currency
      const admin = await User.findOne({ email: req.user.email });
      if (!admin) {
        return res.status(404).json({ message: "Admin user not found" });
      }
      const adminCurrency = admin.currency || "USD";

      // Fetch all incomes from the database
      const incomes = await Income.find({});
      if (incomes.length === 0) {
        return res.status(200).json({
          success: true,
          totalIncome: 0,
          currency: adminCurrency,
          message: "No income records found",
        });
      }

      let totalIncome = 0;
      const conversionRates = {};

      for (const income of incomes) {
        const { amount, currency } = income;

        if (currency === adminCurrency) {
          totalIncome += amount;
        } else {
          // Fetch exchange rate if not already fetched
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

          // Convert the amount to the admin's preferred currency
          const exchangeRate = conversionRates[currency][adminCurrency];
          if (!exchangeRate) {
            return res.status(400).json({
              message: `Exchange rate for ${currency} to ${adminCurrency} not available`,
            });
          }

          const convertedAmount = amount * exchangeRate;
          totalIncome += convertedAmount;

          console.log(
            `Converted ${amount} ${currency} -> ${convertedAmount.toFixed(2)} ${adminCurrency} (Rate: ${exchangeRate})`
          );
        }
      }

      console.log(
        `Total Income in ${adminCurrency}: ${totalIncome.toFixed(2)}`
      );

      res.status(200).json({
        success: true,
        totalIncome: totalIncome.toFixed(2),
        currency: adminCurrency,
      });
    } catch (error) {
      logger.error(error.message);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
};

export default incomeController;
