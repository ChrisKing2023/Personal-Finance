import { Router } from "express";
import authController from "../controllers/auth.controller";
import authMiddleware from "../middleware/authMiddleware";

const authRouter = Router();

//Register a User
authRouter.post("/register", authController.register);

//User or Admin Login
authRouter.post("/login", authController.login);

//Check User or Admin Authorization
authRouter.post(
  "/check-auth",
  authMiddleware(["admin", "user"]),
  authController.checkAuth
);

//User or Admin Logout
authRouter.post("/logout", authController.logout);

export default authRouter;
