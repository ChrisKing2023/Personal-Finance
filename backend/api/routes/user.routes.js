import { Router } from "express";
import userController from "../controllers/user.controller";
import authMiddleware from "../middleware/authMiddleware";

const userRouter = Router();

userRouter.get("/", authMiddleware(["admin"]), userController.getAllUsers);

userRouter.get("/me", authMiddleware(["admin", "user"]), (req, res) => {
  res.json(req.user);
});

userRouter.get(
  "/:id",
  authMiddleware(["admin", "user"]),
  userController.getUserById
);
userRouter.patch(
  "/:id",
  authMiddleware(["admin", "user"]),
  userController.updateUser
);
userRouter.delete("/:id", authMiddleware(["admin"]), userController.deleteUser);

export default userRouter;
