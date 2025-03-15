import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware";
import transactionIncomeController from "../controllers/income/income.controller";
import transactionExpenseController from "../controllers/expense/expense.controller";
import processRecurringTransactions from "../controllers/recurringTransactions.controller";

const transactionRouter = Router();

transactionRouter.post(
  "/add-income",
  authMiddleware(["user"]),
  transactionIncomeController.addIncome
);

transactionRouter.get(
  "/incomes",
  authMiddleware(["admin", "user"]),
  transactionIncomeController.getAllIncomes
);

transactionRouter.delete(
  "/income/:id",
  authMiddleware(["user"]),
  transactionIncomeController.deleteIncome
);

transactionRouter.patch(
  "/income/:id",
  authMiddleware(["user"]),
  transactionIncomeController.updateIncome
);

transactionRouter.get(
  "/income-transactions",
  authMiddleware(["admin"]),
  transactionIncomeController.getAllIncomeTransactions
);

transactionRouter.get(
  "/total-income",
  authMiddleware(["admin", "user"]),
  transactionIncomeController.getTotalIncomeInPreferredCurrency
);

transactionRouter.get(
  "/total-income-all",
  authMiddleware(["admin"]),
  transactionIncomeController.getTotalIncomeForAdmin
);

//Expense related Transaction Routers

transactionRouter.post(
  "/add-expense",
  authMiddleware(["user"]),
  transactionExpenseController.addExpense
);

transactionRouter.get(
  "/expenses",
  authMiddleware(["admin", "user"]),
  transactionExpenseController.getAllExpenses
);

transactionRouter.delete(
  "/expense/:id",
  authMiddleware(["user"]),
  transactionExpenseController.deleteExpense
);

transactionRouter.patch(
  "/expense/:id",
  authMiddleware(["user"]),
  transactionExpenseController.updateExpense
);

transactionRouter.get(
  "/expense-transactions",
  authMiddleware(["admin"]),
  transactionExpenseController.getAllExpenseTransactions
);

transactionRouter.get(
  "/total-expense",
  authMiddleware(["admin", "user"]),
  transactionExpenseController.getTotalExpenseInPreferredCurrency
);

transactionRouter.get(
  "/total-expense-all",
  authMiddleware(["admin"]),
  transactionExpenseController.getTotalExpenseForAdmin
);

transactionRouter.get(
  "/test-recurring-transactions",
  processRecurringTransactions
);
export default transactionRouter;
