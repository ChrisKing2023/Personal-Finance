import logger from "../../../utils/logger.js";
import Budget from "../../models/budget.model.js";
import axios from "axios";

const EXCHANGE_API_URL = "https://api.exchangerate-api.com/v4/latest/";

const generateUserBudget = {
  async generateUserBudget(req, res) {
    try {
      const {
        email,
        category,
        month,
        year,
        currency: userCurrency = "USD",
      } = req.query;

      // Ensure the email is provided and valid
      if (!email) {
        return res.status(400).json({ message: "Email is required." });
      }

      const filter = { email };

      // Filter by category if provided
      if (category) {
        filter.category = category;
      }

      // Add month and year filter
      if (month && year) {
        const startDate = new Date(year, month - 1, 1); // months are 0-indexed
        const endDate = new Date(year, month, 0); // last day of the month
        filter.startDate = { $gte: startDate };
        filter.endDate = { $lte: endDate };
      }

      // Fetch budget data based on filters
      const budgets = await Budget.find(filter);

      if (budgets.length === 0) {
        return res
          .status(200)
          .json({ success: true, message: "No budgets found." });
      }

      let conversionRates = {};

      // Function to get the converted amount (if needed)
      const getConvertedAmount = async (amount, currency) => {
        if (currency === userCurrency) return amount;

        if (!conversionRates[currency]) {
          try {
            const response = await axios.get(`${EXCHANGE_API_URL}${currency}`);
            conversionRates[currency] = response.data.rates;
          } catch (error) {
            logger.error(`Failed to fetch exchange rate for ${currency}`);
            return null;
          }
        }

        const exchangeRate = conversionRates[currency][userCurrency];
        return exchangeRate ? (amount * exchangeRate).toFixed(2) : null;
      };

      const budgetData = [];

      // Convert each budget item to the user preferred currency and format the response
      await Promise.all(
        budgets.map(async budget => {
          const {
            category,
            currency,
            budget: originalBudget,
            remainingBudget,
            startDate,
            endDate,
          } = budget;

          const convertedBudget = await getConvertedAmount(
            originalBudget,
            currency
          );
          const convertedRemainingBudget = await getConvertedAmount(
            remainingBudget,
            currency
          );

          // Calculate total spent as budget - remainingBudget
          const totalSpent =
            convertedBudget && convertedRemainingBudget
              ? (
                  parseFloat(convertedBudget) -
                  parseFloat(convertedRemainingBudget)
                ).toFixed(2)
              : null;

          budgetData.push({
            category,
            currency: userCurrency,
            budget: convertedBudget
              ? parseFloat(convertedBudget).toFixed(2)
              : null,
            remainingBudget: convertedRemainingBudget
              ? parseFloat(convertedRemainingBudget).toFixed(2)
              : null,
            totalSpent, // New field to represent total spent
            dateRange: `${startDate.toISOString().split("T")[0]} - ${endDate.toISOString().split("T")[0]}`,
          });
        })
      );

      res.status(200).json({
        success: true,
        budgetData,
      });
    } catch (error) {
      logger.error(error.message);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
};

export default generateUserBudget;
