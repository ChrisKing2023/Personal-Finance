import { Router } from "express";
import { getAllTags } from "../controllers/tag.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";

const tagRouter = Router();

// Route to fetch all tags
tagRouter.get("/", authMiddleware(["admin", "user"]), getAllTags);

export default tagRouter;
