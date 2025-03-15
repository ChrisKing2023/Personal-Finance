import addIncome from "./addIncome.js";
import adminAllIncome from "./adminAllIncome.js";
import allIncome from "./allIncome.js";
import deleteIncome from "./deleteIncome.js";
import totalIncomeForAdminCurrency from "./totalIncomeForAdminCurrency.js";
import totalIncomeInPreferredCurrency from "./totalIncomeInPreferredCurrency.js";
import updateIncome from "./updateIncome.js";

const incomeController = {
  ...addIncome,
  ...adminAllIncome,
  ...allIncome,
  ...deleteIncome,
  ...totalIncomeForAdminCurrency,
  ...totalIncomeInPreferredCurrency,
  ...updateIncome,
};

export default incomeController;
