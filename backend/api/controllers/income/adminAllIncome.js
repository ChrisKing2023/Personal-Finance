import logger from "../../../utils/logger.js";
import Income from "../../models/income.model.js";
import axios from "axios";

const EXCHANGE_API_URL = "https://api.exchangerate-api.com/v4/latest/";

const adminAllIncome = {
  async getAllIncomeTransactions(req, res) {
    try {
      const adminCurrency = req.query.currency || "USD"; // Admin's preferred currency
      const transactions = await Income.find({});

      if (transactions.length === 0) {
        return res.status(200).json({ success: true, transactions: [] });
      }

      let conversionRates = {};

      const convertedTransactions = await Promise.all(
        transactions.map(async transaction => {
          const { amount, currency } = transaction;

          if (currency === adminCurrency) {
            return { ...transaction.toObject(), convertedAmount: amount };
          }

          // Fetch exchange rate if not already cached
          if (!conversionRates[currency]) {
            try {
              const response = await axios.get(
                `${EXCHANGE_API_URL}${currency}`
              );
              conversionRates[currency] = response.data.rates;
            } catch (error) {
              logger.error(`Failed to fetch exchange rate for ${currency}`);
              return { ...transaction.toObject(), convertedAmount: null };
            }
          }

          const exchangeRate = conversionRates[currency][adminCurrency];
          if (!exchangeRate) {
            return { ...transaction.toObject(), convertedAmount: null };
          }

          const convertedAmount = amount * exchangeRate;
          return {
            ...transaction.toObject(),
            convertedAmount: convertedAmount.toFixed(2),
          };
        })
      );

      res
        .status(200)
        .json({ success: true, transactions: convertedTransactions });
    } catch (error) {
      logger.error(error.message);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
};

export default adminAllIncome;
