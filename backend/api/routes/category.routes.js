import express from "express";
import categoryController from "../controllers/category.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/",
  authMiddleware(["admin", "user"]),
  categoryController.getCategories
);

router.get(
  "/income",
  authMiddleware(["admin", "user"]),
  categoryController.getIncomes
);
router.get(
  "/expense",
  authMiddleware(["admin", "user"]),
  categoryController.getExpenses
);

router.post(
  "/add",
  authMiddleware(["admin"]),
  categoryController.createCategory
);

router.put(
  "/edit/:id",
  authMiddleware(["admin"]),
  categoryController.updateCategory
);

router.delete(
  "/delete/:id",
  authMiddleware(["admin"]),
  categoryController.deleteCategory
);

export default router;
