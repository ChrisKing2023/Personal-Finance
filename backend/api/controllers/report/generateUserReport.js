import logger from "../../../utils/logger.js";
import Expense from "../../models/expense.model.js";
import Income from "../../models/income.model.js";
import axios from "axios";
import { startOfMonth, endOfMonth } from "date-fns";

const EXCHANGE_API_URL = "https://api.exchangerate-api.com/v4/latest/";

const generateUserReport = {
  async generateUserReport(req, res) {
    try {
      const {
        currency: userCurrency = "USD",
        type,
        month,
        year,
        email,
      } = req.query;

      if (!email) {
        return res.status(400).json({ message: "Email is required." });
      }

      const filter = { email };

      // Apply type filter
      if (type) {
        filter.type = type;
      }

      // Apply month and year filter
      if (month && year) {
        const startDate = startOfMonth(new Date(year, month - 1)); // Start of the month
        const endDate = endOfMonth(new Date(year, month - 1)); // End of the month
        filter.date = { $gte: startDate, $lte: endDate };
      }

      // Fetch transactions
      const expenses = await Expense.find();
      const incomes = await Income.find();

      console.log(expenses);
      console.log(incomes);

      // If no transactions exist, return zero totals
      if (expenses.length === 0 && incomes.length === 0) {
        return res.status(200).json({
          success: true,
          report: {
            totalIncome: "0.00",
            totalExpense: "0.00",
            grandTotal: "0.00",
            incomeEntries: 0,
            expenseEntries: 0,
            highestIncome: null,
            lowestIncome: null,
            highestExpense: null,
            lowestExpense: null,
            recurringEntries: 0,
            transactions: [],
          },
        });
      }

      let conversionRates = {}; // Store exchange rates

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

      let userReport = {
        totalIncome: 0,
        totalExpense: 0,
        highestIncome: { amount: 0, category: null },
        lowestIncome: { amount: Infinity, category: null },
        highestExpense: { amount: 0, category: null },
        lowestExpense: { amount: Infinity, category: null },
        incomeEntries: 0,
        expenseEntries: 0,
        recurringEntries: 0,
        transactions: [],
      };

      // Process incomes
      await Promise.all(
        incomes.map(async income => {
          const { amount, currency, category, date, isRecurring } = income;
          const convertedAmount = await getConvertedAmount(amount, currency);

          if (convertedAmount !== null) {
            const convertedValue = parseFloat(convertedAmount);
            userReport.totalIncome += convertedValue;
            userReport.incomeEntries++;

            if (isRecurring) userReport.recurringEntries++;

            userReport.transactions.push({
              type: "income",
              currency,
              amount: convertedValue,
              category,
              date,
            });

            if (convertedValue > userReport.highestIncome.amount) {
              userReport.highestIncome = { amount: convertedValue, category };
            }
            if (convertedValue < userReport.lowestIncome.amount) {
              userReport.lowestIncome = { amount: convertedValue, category };
            }
          }
        })
      );

      // Process expenses
      await Promise.all(
        expenses.map(async expense => {
          const { amount, currency, category, date, isRecurring } = expense;
          const convertedAmount = await getConvertedAmount(amount, currency);

          if (convertedAmount !== null) {
            const convertedValue = parseFloat(convertedAmount);
            userReport.totalExpense += convertedValue;
            userReport.expenseEntries++;

            if (isRecurring) userReport.recurringEntries++;

            userReport.transactions.push({
              type: "expense",
              currency,
              amount: convertedValue,
              category,
              date,
            });

            if (convertedValue > userReport.highestExpense.amount) {
              userReport.highestExpense = { amount: convertedValue, category };
            }
            if (convertedValue < userReport.lowestExpense.amount) {
              userReport.lowestExpense = { amount: convertedValue, category };
            }
          }
        })
      );

      // Ensure correct zero totals when filtering
      if (month && year) {
        if (userReport.incomeEntries === 0) userReport.totalIncome = 0;
        if (userReport.expenseEntries === 0) userReport.totalExpense = 0;
      }

      const grandTotal = userReport.totalIncome - userReport.totalExpense;

      res.status(200).json({
        success: true,
        report: {
          totalIncome: userReport.totalIncome.toFixed(2),
          totalExpense: userReport.totalExpense.toFixed(2),
          grandTotal: grandTotal.toFixed(2),
          incomeEntries: userReport.incomeEntries,
          expenseEntries: userReport.expenseEntries,
          highestIncome: userReport.highestIncome.amount
            ? userReport.highestIncome
            : null,
          lowestIncome:
            userReport.lowestIncome.amount !== Infinity
              ? userReport.lowestIncome
              : null,
          highestExpense: userReport.highestExpense.amount
            ? userReport.highestExpense
            : null,
          lowestExpense:
            userReport.lowestExpense.amount !== Infinity
              ? userReport.lowestExpense
              : null,
          recurringEntries: userReport.recurringEntries,
          transactions: userReport.transactions,
        },
      });
    } catch (error) {
      logger.error(error.message);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
};

export default generateUserReport;
