import logger from "../../../utils/logger.js";
import Income from "../../models/income.model.js";

const getAllIncome = {
  async getAllIncomes(req, res) {
    try {
      const email = req.user?.email;

      if (!email) {
        return res.status(400).json({ message: "User email is required" });
      }

      const incomes = await Income.find({ email });
      res.status(200).json({
        success: true,
        incomes,
      });
    } catch (error) {
      logger.error(error.message);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
};

export default getAllIncome;
