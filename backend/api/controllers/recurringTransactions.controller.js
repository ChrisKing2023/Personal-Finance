import recurringTransactions from "../../utils/recurringTransactions.js";
import logger from "../../utils/logger.js";

// Controller to process recurring transactions
const processRecurringTransactions = async (req, res) => {
  try {
    // Process recurring income transactions
    await recurringTransactions.processRecurringIncomeTransactions();

    // Process recurring expense transactions
    await recurringTransactions.processRecurringExpenseTransactions();

    res.status(200).json({
      message: "Recurring transactions processed successfully",
    });
  } catch (error) {
    logger.error(`Error processing recurring transactions: ${error.message}`);
    res.status(500).json({
      message: "Error processing recurring transactions",
      error: error.message,
    });
  }
};

export default processRecurringTransactions;
