import logger from "../../../utils/logger.js";
import Expense from "../../models/expense.model.js";
import Income from "../../models/income.model.js";
import axios from "axios";

const EXCHANGE_API_URL = "https://api.exchangerate-api.com/v4/latest/";

const allReportController = {
  async generateReports(req, res) {
    try {
      const adminCurrency = req.query.currency || "USD"; // Admin's preferred currency
      const expenses = await Expense.find({});
      const incomes = await Income.find({});

      if (expenses.length === 0 && incomes.length === 0) {
        return res.status(200).json({ success: true, report: [] });
      }

      let conversionRates = {};

      const getConvertedAmount = async (amount, currency) => {
        if (currency === adminCurrency) return amount;

        if (!conversionRates[currency]) {
          try {
            const response = await axios.get(`${EXCHANGE_API_URL}${currency}`);
            conversionRates[currency] = response.data.rates;
          } catch (error) {
            logger.error(`Failed to fetch exchange rate for ${currency}`);
            return null;
          }
        }

        const exchangeRate = conversionRates[currency][adminCurrency];
        return exchangeRate ? (amount * exchangeRate).toFixed(2) : null;
      };

      let userReport = {};

      // Process income transactions
      await Promise.all(
        incomes.map(async income => {
          const { amount, currency, email, category, date } = income;
          const convertedAmount = await getConvertedAmount(amount, currency);

          if (!userReport[email]) {
            userReport[email] = {
              totalIncome: 0,
              totalExpense: 0,
              highestIncome: { amount: 0, category: null },
              lowestIncome: { amount: Infinity, category: null },
              highestExpense: { amount: 0, category: null },
              lowestExpense: { amount: Infinity, category: null },
              incomeEntries: 0,
              expenseEntries: 0,
              transactions: [], // Store all transactions
            };
          }

          if (convertedAmount !== null) {
            const convertedValue = parseFloat(convertedAmount);
            userReport[email].totalIncome += convertedValue;
            userReport[email].incomeEntries++;

            userReport[email].transactions.push({
              type: "income",
              currency,
              amount: convertedValue,
              category,
              date,
            });

            // Track highest and lowest income
            if (convertedValue > userReport[email].highestIncome.amount) {
              userReport[email].highestIncome = {
                currency,
                amount: convertedValue,
                category,
              };
            }
            if (convertedValue < userReport[email].lowestIncome.amount) {
              userReport[email].lowestIncome = {
                currency,
                amount: convertedValue,
                category,
              };
            }
          }
        })
      );

      // Process expense transactions
      await Promise.all(
        expenses.map(async expense => {
          const { amount, currency, email, category, date } = expense;
          const convertedAmount = await getConvertedAmount(amount, currency);

          if (!userReport[email]) {
            userReport[email] = {
              totalIncome: 0,
              totalExpense: 0,
              highestIncome: { amount: 0, category: null },
              lowestIncome: { amount: Infinity, category: null },
              highestExpense: { amount: 0, category: null },
              lowestExpense: { amount: Infinity, category: null },
              incomeEntries: 0,
              expenseEntries: 0,
              transactions: [], // Store all transactions
            };
          }

          if (convertedAmount !== null) {
            const convertedValue = parseFloat(convertedAmount);
            userReport[email].totalExpense += convertedValue;
            userReport[email].expenseEntries++;

            userReport[email].transactions.push({
              type: "expense",
              currency,
              amount: convertedValue,
              category,
              date,
            });

            // Track highest and lowest expense
            if (convertedValue > userReport[email].highestExpense.amount) {
              userReport[email].highestExpense = {
                currency,
                amount: convertedValue,
                category,
              };
            }
            if (convertedValue < userReport[email].lowestExpense.amount) {
              userReport[email].lowestExpense = {
                currency,
                amount: convertedValue,
                category,
              };
            }
          }
        })
      );

      // Convert object to array for JSON response
      const reportData = Object.keys(userReport).map(email => ({
        email,
        totalIncome: userReport[email].totalIncome.toFixed(2),
        totalExpense: userReport[email].totalExpense.toFixed(2),
        grandTotal: (
          userReport[email].totalIncome - userReport[email].totalExpense
        ).toFixed(2),
        incomeEntries: userReport[email].incomeEntries,
        expenseEntries: userReport[email].expenseEntries,
        highestIncome: userReport[email].highestIncome.amount
          ? userReport[email].highestIncome
          : null,
        lowestIncome:
          userReport[email].lowestIncome.amount !== Infinity
            ? userReport[email].lowestIncome
            : null,
        highestExpense: userReport[email].highestExpense.amount
          ? userReport[email].highestExpense
          : null,
        lowestExpense:
          userReport[email].lowestExpense.amount !== Infinity
            ? userReport[email].lowestExpense
            : null,
        transactions: userReport[email].transactions, // Include transactions with dates
      }));

      // Calculate grand totals
      const totalIncomeSum = reportData.reduce(
        (sum, user) => sum + parseFloat(user.totalIncome),
        0
      );
      const totalExpenseSum = reportData.reduce(
        (sum, user) => sum + parseFloat(user.totalExpense),
        0
      );

      res.status(200).json({
        success: true,
        report: reportData,
        totalIncome: totalIncomeSum.toFixed(2),
        totalExpense: totalExpenseSum.toFixed(2),
        grandTotal: (totalIncomeSum - totalExpenseSum).toFixed(2),
      });
    } catch (error) {
      logger.error(error.message);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
};

export default allReportController;
