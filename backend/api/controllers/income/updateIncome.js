import logger from "../../../utils/logger.js";
import Income from "../../models/income.model.js";
import Tag from "../../models/tag.model.js";
import xss from "xss";

const updateIncome = {
  //Function to update a specific Income

  async updateIncome(req, res) {
    try {
      const { id } = req.params;
      const {
        title,
        amount,
        date,
        category,
        description,
        currency,
        tags,
        isRecurring,
        recurrenceType,
      } = req.body;

      const email = req.user?.email;
      if (!email) {
        return res.status(400).json({ message: "User email is required" });
      }

      // Find the existing income entry
      const existingIncome = await Income.findOne({ _id: id, email });
      if (!existingIncome) {
        return res
          .status(404)
          .json({ message: "Income not found or unauthorized" });
      }

      const updatedFields = {};
      if (title) updatedFields.title = xss(title); // Sanitize title
      if (amount) {
        const sanitizedAmount = parseFloat(amount);
        if (isNaN(sanitizedAmount) || sanitizedAmount <= 0) {
          return res
            .status(400)
            .json({ message: "Amount must be a valid positive number" });
        }
        updatedFields.amount = sanitizedAmount;
      }
      if (date) {
        const sanitizedDate = new Date(date);
        if (isNaN(sanitizedDate.getTime())) {
          return res.status(400).json({ message: "Invalid date format" });
        }
        updatedFields.date = sanitizedDate;
      }
      if (category) updatedFields.category = xss(category);
      if (description) updatedFields.description = xss(description);
      if (currency) updatedFields.currency = xss(currency);
      if (tags) updatedFields.tags = tags.map(tag => xss(tag));

      if (isRecurring !== undefined) updatedFields.isRecurring = isRecurring;

      // Handle recurring logic
      if (isRecurring) {
        if (
          !["daily", "weekly", "monthly", "yearly"].includes(recurrenceType)
        ) {
          return res.status(400).json({ message: "Invalid recurrence type" });
        }
        updatedFields.recurrenceType = recurrenceType;
        const initialDate = new Date(date || new Date());

        // Calculate nextOccurrence based on the recurrence type
        let nextOccurrence;
        if (recurrenceType === "daily") {
          nextOccurrence = new Date(initialDate);
          nextOccurrence.setDate(initialDate.getDate() + 1); // Adds one day for daily
        } else if (recurrenceType === "weekly") {
          nextOccurrence = new Date(initialDate);
          nextOccurrence.setDate(initialDate.getDate() + 7); // Adds seven days for weekly
        } else if (recurrenceType === "monthly") {
          nextOccurrence = new Date(initialDate);
          nextOccurrence.setMonth(initialDate.getMonth() + 1); // Adds one month for monthly
        } else if (recurrenceType === "yearly") {
          nextOccurrence = new Date(initialDate);
          nextOccurrence.setFullYear(initialDate.getFullYear() + 1); // Adds one year for yearly
        }

        // Adjust nextOccurrence if it's earlier than today's date
        const today = new Date();
        if (nextOccurrence < today) {
          if (recurrenceType === "daily") {
            nextOccurrence = new Date(today.setDate(today.getDate() + 1));
          } else if (recurrenceType === "weekly") {
            nextOccurrence = new Date(today.setDate(today.getDate() + 7));
          } else if (recurrenceType === "monthly") {
            nextOccurrence = new Date(today.setMonth(today.getMonth() + 1));
          } else if (recurrenceType === "yearly") {
            nextOccurrence = new Date(
              today.setFullYear(today.getFullYear() + 1)
            );
          }
        }

        updatedFields.nextOccurrence = nextOccurrence;
      } else {
        updatedFields.recurrenceType = null;
        updatedFields.nextOccurrence = null;
      }

      const income = await Income.findOneAndUpdate(
        { _id: id, email },
        updatedFields,
        { new: true }
      );

      if (!income) {
        return res
          .status(404)
          .json({ message: "Income not found or unauthorized" });
      }

      // Remove old tags for this transaction
      await Tag.deleteMany({ transactionId: id });

      // Save new tags
      if (tags && tags.length > 0) {
        const tagDocuments = tags.map(tag => ({
          name: xss(tag),
          transactionId: id,
          transactionType: "Income",
        }));
        await Tag.insertMany(tagDocuments);
      }

      res.status(200).json({
        success: true,
        message: "Income updated successfully",
        income,
      });
    } catch (error) {
      logger.error(error.message);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
};

export default updateIncome;
