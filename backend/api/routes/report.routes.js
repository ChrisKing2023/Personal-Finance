import express from "express";
import ReportController from "../controllers/report/report.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/reports",
  authMiddleware(["admin"]),
  ReportController.generateReports
);
router.get(
  "/user-reports",
  authMiddleware(["admin", "user"]),
  ReportController.generateUserReport
);
router.get(
  "/user-budget",
  authMiddleware(["admin", "user"]),
  ReportController.generateUserBudget
);
router.get("/available-dates", ReportController.getAvailableDates);

router.get(
  "/user-summary-report",
  authMiddleware(["admin"]),
  ReportController.generateUserSummaryReport
);

export default router;
