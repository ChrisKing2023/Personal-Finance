import cron from "node-cron";
import Income from "../api/models/income.model.js";
import Expense from "../api/models/expense.model.js";
import logger from "./logger.js";

// Function to calculate the next occurrence date
const getNextOccurrence = (currentDate, recurrenceType) => {
  const nextDate = new Date(currentDate);

  // Ensure currentDate is a valid date
  if (isNaN(nextDate.getTime())) {
    throw new Error("Invalid current date provided");
  }

  switch (recurrenceType) {
    case "daily":
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case "weekly":
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case "monthly":
      nextDate.setMonth(nextDate.getMonth() + 1);
      if (nextDate.getDate() !== currentDate.getDate()) {
        nextDate.setDate(0); // Set to last day of the previous month
      }
      break;
    case "yearly":
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    default:
      throw new Error("Invalid recurrence type");
  }

  return nextDate;
};

// Function to process recurring income transactions
const processRecurringIncomeTransactions = async () => {
  try {
    const today = new Date().toISOString();

    const recurringIncomes = await Income.find({
      isRecurring: true,
      nextOccurrence: { $lte: today },
    });

    console.log("Recurring Incomes to Process:", recurringIncomes);

    if (recurringIncomes.length === 0) {
      logger.info("No recurring income transactions to process.");
      return;
    }

    const updates = [];

    for (const income of recurringIncomes) {
      console.log(`Income ID: ${income._id}`);
      const nextOccurrence = getNextOccurrence(
        income.nextOccurrence,
        income.recurrenceType
      );

      // Check for invalid nextOccurrence
      if (isNaN(nextOccurrence.getTime())) {
        console.error(
          `Invalid nextOccurrence calculated for income ID: ${income._id}`
        );
        continue; // Skip this income if the nextOccurrence is invalid
      }

      const newIncome = new Income({
        title: income.title,
        amount: income.amount,
        date: today,
        category: income.category,
        description: income.description,
        currency: income.currency,
        tags: income.tags,
        email: income.email,
        isRecurring: false,
        recurrenceType: null,
        nextOccurrence: null,
      });

      try {
        await newIncome.save();
        console.log("Saved new income:", newIncome);
      } catch (error) {
        console.error("Error saving income:", error);
      }

      updates.push({ _id: income._id, nextOccurrence });
    }

    if (updates.length > 0) {
      const updatePromises = updates.map(u =>
        Income.updateOne(
          { _id: u._id },
          { $set: { nextOccurrence: u.nextOccurrence } }
        )
      );
      await Promise.all(updatePromises); // Use Promise.all to run them concurrently
      console.log(`Updated nextOccurrence for ${updates.length} incomes`);
    }

    logger.info(
      `Recurring income processed for ${recurringIncomes.length} transactions`
    );
  } catch (error) {
    console.error(
      "Error processing recurring income transactions:",
      error.message
    );
    logger.error(
      "Error processing recurring income transactions:",
      error.message
    );
  }
};

// Function to process recurring expense transactions
const processRecurringExpenseTransactions = async () => {
  try {
    const today = new Date().toISOString();

    const recurringExpenses = await Expense.find({
      isRecurring: true,
      nextOccurrence: { $lte: today },
    });

    console.log("Recurring Expenses to Process:", recurringExpenses);

    if (recurringExpenses.length === 0) {
      logger.info("No recurring expense transactions to process.");
      return;
    }

    const updates = [];

    for (const expense of recurringExpenses) {
      console.log(`Expense ID: ${expense._id}`);
      const nextOccurrence = getNextOccurrence(
        expense.nextOccurrence,
        expense.recurrenceType
      );

      // Check for invalid nextOccurrence
      if (isNaN(nextOccurrence.getTime())) {
        console.error(
          `Invalid nextOccurrence calculated for expense ID: ${expense._id}`
        );
        continue; // Skip this expense if the nextOccurrence is invalid
      }

      const newExpense = new Expense({
        title: expense.title,
        amount: expense.amount,
        date: today,
        category: expense.category,
        description: expense.description,
        currency: expense.currency,
        tags: expense.tags,
        email: expense.email,
        isRecurring: false,
        recurrenceType: null,
        nextOccurrence: null,
      });

      try {
        await newExpense.save();
        console.log("Saved new expense:", newExpense);
      } catch (error) {
        console.error("Error saving expense:", error);
      }

      updates.push({ _id: expense._id, nextOccurrence });
    }

    if (updates.length > 0) {
      const updatePromises = updates.map(u =>
        Expense.updateOne(
          { _id: u._id },
          { $set: { nextOccurrence: u.nextOccurrence } }
        )
      );
      await Promise.all(updatePromises); // Use Promise.all to run them concurrently
      console.log(`Updated nextOccurrence for ${updates.length} expenses`);
    }

    logger.info(
      `Recurring expense processed for ${recurringExpenses.length} transactions`
    );
  } catch (error) {
    console.error(
      "Error processing recurring expense transactions:",
      error.message
    );
    logger.error(
      "Error processing recurring expense transactions:",
      error.message
    );
  }
};

if (process.env.NODE_ENV !== "test") {
  cron.schedule("0 0 * * *", async () => {
    console.log("Cron job triggered");
    try {
      await processRecurringIncomeTransactions();
      await processRecurringExpenseTransactions();
      logger.info("Recurring transactions processed.");
    } catch (error) {
      logger.error("Error in cron job: " + error.message);
    }
  });
}

export default {
  processRecurringIncomeTransactions,
  processRecurringExpenseTransactions,
};
