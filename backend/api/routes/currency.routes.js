import express from "express";
import currencyController from "../controllers/currency.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/",
  authMiddleware(["admin", "user"]),
  currencyController.getCurrencies
);

router.post("/add", authMiddleware(["admin"]), currencyController.addCurrency);

router.put(
  "/edit/:id",
  authMiddleware(["admin"]),
  currencyController.editCurrency
);

router.delete(
  "/delete/:id",
  authMiddleware(["admin"]),
  currencyController.deleteCurrency
);

export default router;
