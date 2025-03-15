import logger from "../../../utils/logger.js";
import Income from "../../models/income.model.js";
import Tag from "../../models/tag.model.js";

const deleteIncome = {
  //Function to delete a specific income

  async deleteIncome(req, res) {
    try {
      const { id } = req.params;
      const email = req.user?.email;

      if (!email) {
        return res.status(400).json({ message: "User email is required" });
      }

      const income = await Income.findOne({ _id: id, email });

      if (!income) {
        return res
          .status(404)
          .json({ message: "Income not found or unauthorized" });
      }

      if (income.isRecurring) {
        return res.status(400).json({
          message:
            "Cannot delete a recurring income. Please disable recurrence first.",
        });
      }

      await Income.deleteOne({ _id: id, email });

      // Remove associated tags
      await Tag.deleteMany({ transactionId: id });

      res.status(200).json({
        success: true,
        message: "Income deleted successfully",
      });
    } catch (error) {
      logger.error(error.message);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
};

export default deleteIncome;
