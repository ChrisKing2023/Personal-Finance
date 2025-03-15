import logger from "../../utils/logger.js";
import User from "../models/user.model.js";
import { validationResult } from "express-validator";
import bcrypt from "bcrypt";
import xss from "xss";

const userController = {
  async getAllUsers(req, res) {
    try {
      console.log("Fetching all users...");

      const users = await User.find().select("-password");

      console.log(`Retrieved ${users.length} users`);
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error.message);
      logger.error(error.message);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  async getUserById(req, res) {
    try {
      console.log("Fetching all users...");
      const user = await User.findById(req.params.id).select("-password");
      res.json(user);
    } catch (error) {
      logger.error(error.message);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  async updateUser(req, res) {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res
          .status(400)
          .json({ message: "Invalid input", errors: errors.array() });
      }

      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Authorization: Ensure non-admins can only update their own account
      if (
        req.user.role !== "admin" &&
        req.user._id.toString() !== req.params.id
      ) {
        return res
          .status(403)
          .json({ message: "Forbidden: You can only update your own profile" });
      }

      // If previous password is provided, verify it
      const previousPassword = req.body.prevPassword;
      if (previousPassword) {
        const isMatch = await bcrypt.compare(previousPassword, user.password);
        if (!isMatch) {
          return res.status(400).json({ message: "Invalid password" });
        }
      }

      // If new password is provided, hash it
      if (req.body.newPassword) {
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(req.body.newPassword, salt);
        user.password = hashedPassword;
      }

      // Handle updates, including empty strings
      const fields = [
        "username",
        "firstname",
        "lastname",
        "email",
        "role",
        "avatar",
        "contact",
        "address",
        "city",
        "postalCode",
        "country",
        "currency",
      ];

      fields.forEach(field => {
        if (req.body.hasOwnProperty(field)) {
          let sanitizedValue =
            req.body[field].trim() === "" ? null : req.body[field];
          sanitizedValue = sanitizedValue
            ? xss(sanitizedValue)
            : sanitizedValue;
          user[field] = sanitizedValue;
        }
      });

      if (req.user.role === "admin" && req.body.hasOwnProperty("role")) {
        user.role = req.body.role;
      }

      // Save the updated user document
      await user.save();

      res.json({ message: "User updated successfully", user });
    } catch (error) {
      logger.error("Error during user update:", error.message);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  async deleteUser(req, res) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Use deleteOne to delete the user
      await User.deleteOne({ _id: req.params.id });

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      logger.error(error.message);
      res.status(500).json({ message: "Internal server error" });
    }
  },
};

export default userController;
