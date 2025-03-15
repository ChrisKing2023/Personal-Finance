import axios from "axios";
import logger from "../../utils/logger.js";
import Expense from "../models/expense.model.js";
import Budget from "../models/budget.model.js";
import sendEmail from "./email.service.js";

const EXCHANGE_API_URL = "https://api.exchangerate-api.com/v4/latest/";

// Default export of the function
async function recalculateRemainingBudget(email, category, startDate, endDate) {
  const budgets = await Budget.find({
    email,
    category,
    startDate: { $lte: new Date(endDate) },
    endDate: { $gte: new Date(startDate) },
  });

  if (budgets.length === 0) return;

  const expenses = await Expense.find({
    email,
    category,
    date: { $gte: new Date(startDate), $lte: new Date(endDate) },
  });

  const uniqueCurrencies = [...new Set(expenses.map(exp => exp.currency))];
  let conversionRates = {};

  // Fetch exchange rates for all unique currencies at once
  for (const currency of uniqueCurrencies) {
    if (currency !== budgets[0].currency) {
      // Get exchange rate for at least one budget's currency
      try {
        const response = await axios.get(`${EXCHANGE_API_URL}${currency}`);
        conversionRates[currency] = response.data.rates;
      } catch (error) {
        logger.error(`Failed to fetch exchange rate for ${currency}`);
        conversionRates[currency] = null;
      }
    }
  }

  for (const budget of budgets) {
    let totalExpenseForBudget = 0;

    for (const expense of expenses) {
      const { amount, currency, date } = expense;

      // Only count expenses that fall within this budget's date range
      if (
        new Date(date) >= new Date(budget.startDate) &&
        new Date(date) <= new Date(budget.endDate)
      ) {
        if (currency === budget.currency) {
          totalExpenseForBudget += amount;
        } else if (conversionRates[currency]?.[budget.currency]) {
          totalExpenseForBudget +=
            amount * conversionRates[currency][budget.currency];
        } else {
          logger.warn(
            `Skipping expense in ${currency}, exchange rate unavailable.`
          );
        }
      }
    }
    // Calculate the remaining budget
    const remainingBudget = budget.budget - totalExpenseForBudget;

    // If the remaining budget is 0 or below, send an email notification
    if (remainingBudget <= 0) {
      // Get today's date to be used as the budget exceeded date
      const today = new Date().toLocaleDateString();

      // Email content
      const subject = `Budget Alert: Your remaining budget is exhausted or exceeded!`;
      const text = `
    Dear User,

    We wanted to notify you that your budget for the category "${budget.category}" has been exhausted or exceeded.

    Here are the details of your budget:

    Category: ${budget.category}
    Currency: ${budget.currency}
    Budget: ${budget.budget}
    Remaining Budget: ${remainingBudget}
    From: ${new Date(budget.startDate).toLocaleDateString()}
    To: ${new Date(budget.endDate).toLocaleDateString()}
    Budget Exceeded Date: ${today}

    Please review your budget allocation and adjust accordingly.

    Best regards,
    Your Budget Management Team
  `;

      const html = `
    <h2>Dear User,</h2>
    <p>We wanted to notify you that your budget for the category <strong>"${budget.category}"</strong> has been exhausted or exceeded.</p>
    <p>Here are the details of your budget:</p>
    <ul>
      <li><strong>Category:</strong> ${budget.category}</li>
      <li><strong>Currency:</strong> ${budget.currency}</li>
      <li><strong>Budget:</strong> ${budget.budget}</li>
      <li><strong>Remaining Budget:</strong> ${remainingBudget}</li>
      <li><strong>Budget Allocated From:</strong> ${new Date(budget.startDate).toLocaleDateString()}</li>
      <li><strong>Budget Allocated To:</strong> ${new Date(budget.endDate).toLocaleDateString()}</li>
      <li><strong>Budget Exceeded Date:</strong> ${today}</li>
    </ul>
    <p>Please review your budget allocation and adjust accordingly.</p>
    <p>Best regards,<br>Finance Tracker</p>
  `;

      // Send the email to the designated email address
      try {
        await sendEmail("christyspam1@gmail.com", subject, text, html);
        logger.info(
          `Notification email sent to christyspam1@gmail.com about budget exhaustion.`
        );
      } catch (error) {
        logger.error("Failed to send budget exhaustion email:", error);
      }
    }

    // Update and save the remaining budget
    budget.remainingBudget = remainingBudget;
    await budget.save();
  }
}

export default recalculateRemainingBudget;
