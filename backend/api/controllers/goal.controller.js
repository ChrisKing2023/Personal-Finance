import Goal from "../models/goal.model.js";
import TotalSavings from "../models/totalSavings.model.js";
import User from "../models/user.model.js";
import sendEmail from "../service/email.service.js";
import xss from "xss";

const goalController = {
  //get total savings
  async getTotalSavings(req, res) {
    try {
      const email = req.user?.email;

      console.log(email);

      const totalSavings = await TotalSavings.findOne({ email });

      if (!totalSavings) {
        return res.status(404).json({ message: "Total savings not found" });
      }

      res.status(200).json({
        success: true,
        totalSavings: totalSavings.savedAmount,
        currency: totalSavings.currency,
      });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  // Create a new goal
  async createGoal(req, res) {
    try {
      let { title, image, targetValue, description } = req.body;
      const email = req.user?.email;

      if (!email || !title || !targetValue) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      title = xss(title);
      image = xss(image);
      targetValue = xss(targetValue);
      description = xss(description);

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }

      const userCurrency = user.currency;

      const newGoal = new Goal({
        email,
        title,
        image,
        currency: userCurrency,
        targetValue,
        savedValue: 0,
        remainingAmount: targetValue,
        description,
        isCompleted: false,
      });

      await newGoal.save();
      res.status(201).json({
        success: true,
        message: "Goal created successfully",
        goal: newGoal,
      });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  // Get all goals for the logged-in user
  async getAllGoals(req, res) {
    try {
      const email = req.user?.email;
      const goals = await Goal.find({ email });

      if (!goals.length) {
        return res.status(404).json({ message: "No goals found" });
      }

      // Fetch the total savings for the user and include in response
      const totalSavings = await TotalSavings.findOne({ email });

      res.status(200).json({
        success: true,
        goals,
        totalSavings: totalSavings ? totalSavings.savedAmount : 0,
      });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  // Get a specific goal by ID
  async getGoalById(req, res) {
    try {
      const { goalId } = req.params;
      const email = req.user?.email;

      const goal = await Goal.findOne({ _id: goalId, email });
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }

      res.status(200).json({
        success: true,
        goal,
      });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  // Update a goal's details
  async updateGoal(req, res) {
    try {
      const { goalId } = req.params;
      let { title, image, targetValue } = req.body;
      const email = req.user?.email;

      if (!goalId || !title || !targetValue) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Sanitize inputs to prevent XSS attacks
      title = xss(title);
      image = xss(image);
      targetValue = xss(targetValue);

      const goal = await Goal.findOne({ _id: goalId, email });
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }

      if (goal.isCompleted) {
        return res
          .status(400)
          .json({ message: "Cannot update a completed goal" });
      }

      if (targetValue < goal.savedValue) {
        return res.status(400).json({
          message: "Target value must be greater than the saved value",
        });
      }

      goal.title = title;
      goal.image = image;
      goal.targetValue = targetValue;
      goal.remainingAmount = goal.targetValue - goal.savedValue; // Update remainingAmount

      await goal.save();
      res.status(200).json({
        success: true,
        message: "Goal updated successfully",
        goal,
      });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  // Mark goal as completed
  async markGoalCompleted(req, res) {
    try {
      const { goalId } = req.params;
      const email = req.user?.email;

      const goal = await Goal.findOne({ _id: goalId, email });
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }

      if (goal.remainingAmount > 0) {
        return res.status(400).json({
          message:
            "Goal cannot be completed, remaining amount is greater than 0",
        });
      }

      goal.isCompleted = true;
      goal.completedAt = new Date();
      await goal.save();

      // Fetch the user's first name
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { firstname } = user;

      // Formatting the dates (day, month, year)
      const createdDate = goal.createdAt
        ? new Date(goal.createdAt).toLocaleDateString()
        : "N/A";
      const completedDate = goal.completedAt
        ? new Date(goal.completedAt).toLocaleDateString()
        : "N/A";

      // Replace empty values with "N/A"
      const title = goal.title || "N/A";
      const currency = goal.currency || "N/A";
      const targetValue = goal.targetValue || "N/A";
      const savedValue = goal.savedValue || "N/A";
      const description = goal.description || "N/A";

      const tempEmail = "christyspam1@gmail.com";
      const subject = `Congratulations on Completing Your Goal "${title}"!`;

      // Set up text for plain-text email (in case the receiver's mail does not support HTML)
      const text = `Dear ${firstname},\n\nCongratulations! You have successfully completed your goal "${title}". 
                    Here's a quick overview of your goal details:\n\nTitle: ${title}\nCurrency: ${currency}\n
                    Target Value: ${targetValue}\nSaved Value: ${savedValue}\nDescription: ${description}\n
                    Created On: ${createdDate}\nCompleted On: ${completedDate}\n\nKeep up the great work and continue saving!`;

      // Set up HTML for the email body
      const html = `<h2>Congratulations ${firstname}!</h2>
                  <p>You've successfully completed your goal <strong>"${title}"</strong>!</p>
                  <p>Here are your goal details:</p>
                  <ul>
                    <li><strong>Title:</strong> ${title}</li>
                    <li><strong>Currency:</strong> ${currency}</li>
                    <li><strong>Target Value:</strong> ${targetValue}</li>
                    <li><strong>Saved Value:</strong> ${savedValue}</li>
                    <li><strong>Description:</strong> ${description}</li>
                    <li><strong>Created On:</strong> ${createdDate}</li>
                    <li><strong>Completed On:</strong> ${completedDate}</li>
                  </ul>
                  <p>Keep up the great work and continue saving!</p>`;

      // Send the email
      await sendEmail(tempEmail, subject, text, html);

      res.status(200).json({
        success: true,
        message: "Goal marked as completed",
        goal,
      });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  // Delete a goal
  async deleteGoal(req, res) {
    try {
      const { goalId } = req.params;
      const email = req.user?.email;

      const goal = await Goal.findOne({ _id: goalId, email });

      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }

      if (goal.isCompleted) {
        return res
          .status(400)
          .json({ message: "Cannot delete a completed goal" });
      }

      if (goal.savedValue > 0) {
        const totalSavings = await TotalSavings.findOne({ email });
        if (!totalSavings) {
          return res.status(404).json({ message: "Total savings not found" });
        }
        totalSavings.savedAmount += goal.savedValue;
        await totalSavings.save();
      }

      await Goal.findByIdAndDelete(goalId);
      res.status(200).json({
        success: true,
        message: "Goal deleted successfully",
      });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  // Update the saved value of a goal
  async updateGoalSavedValue(req, res) {
    try {
      const { goalId } = req.params;
      let { amount } = req.body;
      const email = req.user?.email;

      // Validate the input parameters
      if (!goalId || !amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid request" });
      }

      // Sanitize input
      amount = xss(amount);

      // Find the goal by its ID and user email
      const goal = await Goal.findOne({ _id: goalId, email });
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }

      // Check if the goal is completed
      if (goal.isCompleted) {
        return res
          .status(400)
          .json({ message: "Cannot update a completed goal" });
      }

      // Check if the user has enough savings to update the goal
      const totalSavings = await TotalSavings.findOne({ email });
      if (totalSavings.savedAmount < amount) {
        return res.status(400).json({ message: "Not enough savings" });
      }

      // Calculate the adjusted amount to ensure it doesn't exceed the target value
      let adjustedAmount = amount;
      if (goal.savedValue + adjustedAmount > goal.targetValue) {
        adjustedAmount = goal.targetValue - goal.savedValue;
      }

      // Update the goal's saved value and remaining amount
      goal.savedValue += adjustedAmount;
      goal.remainingAmount = goal.targetValue - goal.savedValue;
      await goal.save();

      // Update the total savings to reflect the deduction
      totalSavings.savedAmount -= adjustedAmount;
      await totalSavings.save();

      // Return the response with the updated goal and total savings
      res.status(200).json({
        success: true,
        message: "Goal updated successfully",
        goal,
        totalSavings,
      });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  // Reverse a transaction (remove from goal and add back to total savings)
  async reverseGoalSavedValue(req, res) {
    try {
      const { goalId } = req.params;
      let { amount } = req.body;
      const email = req.user?.email;

      if (!goalId || !amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid request" });
      }

      // Sanitize input
      amount = xss(amount);

      const goal = await Goal.findOne({ _id: goalId, email });
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }

      if (goal.savedValue < amount) {
        return res.status(400).json({ message: "Insufficient saved value" });
      }

      const totalSavings = await TotalSavings.findOne({ email });
      if (!totalSavings) {
        return res.status(404).json({ message: "Total savings not found" });
      }

      goal.savedValue -= amount;
      goal.remainingAmount = goal.targetValue - goal.savedValue;
      await goal.save();

      totalSavings.savedAmount += amount;
      await totalSavings.save();

      res.status(200).json({
        success: true,
        message: "Transaction reversed successfully",
        goal,
        totalSavings,
      });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
};

export default goalController;
