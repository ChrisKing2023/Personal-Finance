import addExpense from "./addExpense";
import adminAllExpense from "./adminAllExpense";
import allExpense from "./allExpense";
import deleteExpense from "./deleteExpense";
import totalExpenseForAdmin from "./totalExpenseForAdmin";
import totalExpenseInpreferredCurrency from "./totalExpenseInPreferredCurrency";
import updateExpense from "./updateExpense";

const expenseController = {
  ...addExpense,
  ...adminAllExpense,
  ...allExpense,
  ...deleteExpense,
  ...totalExpenseForAdmin,
  ...totalExpenseInpreferredCurrency,
  ...updateExpense,
};

export default expenseController;
