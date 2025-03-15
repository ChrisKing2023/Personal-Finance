import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware";
import goalController from "../controllers/goal.controller";

const goalRouter = Router();

goalRouter.get(
  "/total-savings",
  authMiddleware(["user"]),
  goalController.getTotalSavings
);

// Create a new goal
goalRouter.post("/", authMiddleware(["user"]), goalController.createGoal);

// Get all goals for the logged-in user
goalRouter.get("/", authMiddleware(["user"]), goalController.getAllGoals);

// Get a single goal by its ID
goalRouter.get(
  "/:goalId",
  authMiddleware(["user"]),
  goalController.getGoalById
);

// Update goal details (targetValue, title, image, etc.)
goalRouter.put("/:goalId", authMiddleware(["user"]), goalController.updateGoal);

// Mark goal as completed
goalRouter.patch(
  "/complete/:goalId",
  authMiddleware(["user"]),
  goalController.markGoalCompleted
);

// Delete goal
goalRouter.delete(
  "/:goalId",
  authMiddleware(["user"]),
  goalController.deleteGoal
);

// Update the saved value of a goal
goalRouter.patch(
  "/saved-value/:goalId/",
  authMiddleware(["user"]),
  goalController.updateGoalSavedValue
);

// Reverse a transaction
goalRouter.patch(
  "/reverse-saved-value/:goalId/",
  authMiddleware(["user"]),
  goalController.reverseGoalSavedValue
);

export default goalRouter;
