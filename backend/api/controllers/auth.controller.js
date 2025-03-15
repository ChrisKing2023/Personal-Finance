import User from "../models/user.model.js";
import { validationResult } from "express-validator";
import logger from "../../utils/logger.js";
import bcrypt from "bcrypt";
import genAuthToken from "../../utils/genAuthToken.js";
import { emailOrUsername } from "../../utils/helpers.js";
import xss from "xss";

const authController = {
  async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      let {
        username,
        firstname,
        lastname,
        email,
        password,
        role,
        currency,
        avatar,
        contact,
        address,
        city,
        postalCode,
        country,
      } = req.body;

      // Sanitize inputs using xss
      username = xss(username);
      firstname = xss(firstname);
      lastname = xss(lastname);
      email = xss(email);
      password = xss(password);
      contact = xss(contact);
      address = xss(address);
      city = xss(city);
      postalCode = xss(postalCode);
      country = xss(country);

      // Check if username or email already exists
      const userNameExists = await User.findOne({ username });
      if (userNameExists) {
        return res
          .status(400)
          .json({ message: "Username already exists", success: false });
      }

      const userExists = await User.findOne({ email });
      if (userExists) {
        return res
          .status(400)
          .json({ message: "User already exists", success: false });
      }

      // Hash the password
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = new User({
        username,
        firstname,
        lastname,
        email,
        password: hashedPassword,
        role,
        currency,
        avatar,
        contact,
        address,
        city,
        postalCode,
        country,
        created_date: new Date(),
        last_login: new Date(),
      });

      try {
        const savedUser = await user.save();
        savedUser.password = undefined;
        const token = genAuthToken(savedUser);

        res.status(201).json({ user: savedUser, token: token, success: true });
      } catch (error) {
        logger.error(error.message);
        res
          .status(500)
          .json({ success: false, message: "Internal server error" });
      }
    } catch (error) {
      logger.error(error.message);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  async login(req, res) {
    let { username, password } = req.body;

    username = xss(username);
    password = xss(password);

    const type = emailOrUsername(username);

    try {
      let user;
      if (type === "email") {
        user = await User.findOne({ email: username });
      } else {
        user = await User.findOne({ username: username });
      }

      if (!user) {
        return res
          .status(400)
          .json({ success: false, message: "User not found" });
      }

      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid password" });
      }

      user.password = undefined;

      const token = genAuthToken(user);
      res.status(200).json({
        success: true,
        message: "Succesfully logged in",
        user: user,
        token: token,
      });
    } catch (error) {
      logger.error(error.message);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  async checkAuth(req, res) {
    try {
      const user = await User.findById(req.user._id).select("-password");

      const { authorization } = req.headers;

      if (!authorization) {
        return res.status(401).json({ sucess: false, message: "Unauthorized" });
      }

      const token = authorization.split(" ")[1];

      res.status(200).json({ success: true, user: user, token: token });
    } catch (error) {
      logger.error(error.message);
      res.status(500).json({ sucess: false, message: "Internal server error" });
    }
  },

  async logout(req, res) {
    try {
      // Clear the authentication token or session cookie
      res.clearCookie("token");

      res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
      logger.error("Logout error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
};

export default authController;
