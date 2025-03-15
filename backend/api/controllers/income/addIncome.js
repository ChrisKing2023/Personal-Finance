import logger from "../../../utils/logger.js";
import Income from "../../models/income.model.js";
import Tag from "../../models/tag.model.js";
import xss from "xss";

//Function for User to add a new income
const addIncome = {
  async addIncome(req, res) {
    try {
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

      if (!title || !amount || !date || !category || !currency) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      if (amount <= 0) {
        return res
          .status(400)
          .json({ message: "Amount must be a Positive Number" });
      }

      // Sanitize inputs
      const sanitizedTitle = xss(title);
      const sanitizedCategory = xss(category);
      const sanitizedDescription = xss(description || ""); // Default to empty string if undefined
      const sanitizedCurrency = xss(currency);
      const sanitizedTags = tags ? tags.map(tag => xss(tag)) : [];

      // Validate Amount (ensure it's a positive number)
      const sanitizedAmount = parseFloat(amount);
      if (isNaN(sanitizedAmount) || sanitizedAmount <= 0) {
        return res
          .status(400)
          .json({ message: "Amount must be a valid positive number" });
      }

      // Handle Recurring Transactions
      let nextOccurrence = null;
      if (isRecurring) {
        if (
          !["daily", "weekly", "monthly", "yearly"].includes(recurrenceType)
        ) {
          return res.status(400).json({ message: "Invalid recurrence type" });
        }

        const initialDate = new Date(date);

        // Set nextOccurrence based on recurrence type
        if (recurrenceType === "daily") {
          nextOccurrence = new Date(initialDate);
          nextOccurrence.setDate(initialDate.getDate() + 1); // Adds one day
        } else if (recurrenceType === "weekly") {
          nextOccurrence = new Date(initialDate);
          nextOccurrence.setDate(initialDate.getDate() + 7); // Adds seven days
        } else if (recurrenceType === "monthly") {
          nextOccurrence = new Date(initialDate);
          nextOccurrence.setMonth(initialDate.getMonth() + 1); // Adds one month
        } else if (recurrenceType === "yearly") {
          nextOccurrence = new Date(initialDate);
          nextOccurrence.setFullYear(initialDate.getFullYear() + 1); // Adds one year
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
      }

      const newIncome = new Income({
        title: sanitizedTitle,
        amount: sanitizedAmount,
        date: new Date(date),
        category: sanitizedCategory,
        description: sanitizedDescription,
        currency: sanitizedCurrency,
        tags: sanitizedTags,
        email,
        isRecurring: !!isRecurring,
        recurrenceType: isRecurring ? recurrenceType : null,
        nextOccurrence,
      });

      await newIncome.save();

      // Save tags in the Tag collection
      if (sanitizedTags.length > 0) {
        const tagDocuments = sanitizedTags.map(tag => ({
          name: tag,
          transactionId: newIncome._id,
          transactionType: "Income",
        }));
        await Tag.insertMany(tagDocuments);
      }

      res.status(201).json({
        success: true,
        message: "Income added successfully",
        income: newIncome,
      });
    } catch (error) {
      logger.error(error.message);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
};

export default addIncome;
