import jwt from "jsonwebtoken";
import User from "../models/user.model";

const authMiddleware = roles => {
  return async (req, res, next) => {
    try {
      //console.log("Middleware triggered. Checking authorization...");

      // Ensure headers exist before accessing them
      const authorization = req.headers?.authorization;
      //console.log("Authorization header:", authorization);

      if (!authorization || !authorization.startsWith("Bearer ")) {
        //console.log("❌ Missing or invalid token.");
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Missing or invalid token",
        });
      }

      // Extract token
      const token = authorization.split(" ")[1];
      //console.log("Extracted Token:", token);

      if (!token) {
        //console.log("❌ No token found in Authorization header.");
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Token missing",
        });
      }

      // Verify token
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (error) {
        //console.log("❌ Token verification failed:", error.message);
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Invalid or expired token",
        });
      }

      //console.log("✅ Token Decoded Successfully:", decoded);

      if (!decoded || !decoded._id) {
        //console.log("❌ Invalid token structure.");
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Invalid token structure",
        });
      }

      const { _id, role } = decoded;

      // Check if user has required role
      //console.log(`🔍 User Role: ${role}`);

      if (!roles.includes(role)) {
        // console.log("❌ User role is not authorized.");
        return res.status(403).json({
          success: false,
          message: "Forbidden: Access denied",
        });
      }

      // Find user in the database
      const user = await User.findById(_id).select("-password");
      if (!user) {
        // console.log("❌ User not found in database.");
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // console.log("✅ User authenticated:", user.username);

      req.user = user;
      next();
    } catch (error) {
      //console.log("❌ Error in authMiddleware:", error.message);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  };
};

export default authMiddleware;
