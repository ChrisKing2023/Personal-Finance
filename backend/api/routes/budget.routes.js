import express from "express";
import budgetController from "../controllers/budget.controller.js";
import authMiddleware from "../middleware/authMiddleware";

const router = express.Router();

// Add or Update Budget
router.post(
  "/add",
  authMiddleware(["user"]),
  budgetController.addOrUpdateBudget
);

// Get All Budgets for a User
router.get(
  "/getbudgets",
  authMiddleware(["admin", "user"]),
  budgetController.getBudgets
);

// Delete a Budget
router.delete(
  "/delete/:id",
  authMiddleware(["user"]),
  budgetController.deleteBudget
);

export default router;
