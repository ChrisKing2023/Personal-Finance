import logger from "../../../utils/logger.js";
import Expense from "../../models/expense.model.js";

const allExpense = {
  // Function to get All expenses of the logged in user
  async getAllExpenses(req, res) {
    try {
      const email = req.user?.email;

      if (!email) {
        return res.status(400).json({ message: "User email is required" });
      }

      const expenses = await Expense.find({ email });
      res.status(200).json({
        success: true,
        expenses,
      });
    } catch (error) {
      logger.error(error.message);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
};

export default allExpense;
