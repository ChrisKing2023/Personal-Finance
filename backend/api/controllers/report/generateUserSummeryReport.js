import User from "../../models/user.model.js";
import logger from "../../../utils/logger.js";

const generateUserSummaryReport = {
  async generateUserSummaryReport(req, res) {
    try {
      // Fetch all users from the database with required fields
      const users = await User.find().select(
        "username firstname lastname email role currency contact country last_login"
      );

      // If no users are found, return an empty report
      if (!users || users.length === 0) {
        return res.status(200).json({
          success: true,
          report: {
            totalUsers: 0,
            totalAdmins: 0,
            totalPeople: 0,
            highestCurrencyCount: null,
            highestCountryCount: null,
            lowestCurrencyCount: null,
            lowestCountryCount: null,
            users: [], // Empty array since no users
          },
        });
      }

      let totalUsers = 0;
      let totalAdmins = 0;
      let highestCurrencyCount = { currency: null, count: 0 };
      let lowestCurrencyCount = { currency: null, count: Infinity };
      let highestCountryCount = { country: null, count: 0 };
      let lowestCountryCount = { country: null, count: Infinity };
      const currencyCount = {};
      const countryCount = {};

      // Process each user
      users.forEach(user => {
        totalUsers++;

        if (user.role === "admin") {
          totalAdmins++;
        }

        // Count currencies
        if (currencyCount[user.currency]) {
          currencyCount[user.currency]++;
        } else {
          currencyCount[user.currency] = 1;
        }

        // Count countries (only if user.country is defined and not empty)
        if (user.country && user.country.trim() !== "") {
          if (countryCount[user.country]) {
            countryCount[user.country]++;
          } else {
            countryCount[user.country] = 1;
          }
        }
      });

      // Determine the highest and lowest currency count
      for (const currency in currencyCount) {
        const count = currencyCount[currency];
        if (count > highestCurrencyCount.count) {
          highestCurrencyCount = { currency, count };
        }
        if (count < lowestCurrencyCount.count) {
          lowestCurrencyCount = { currency, count };
        }
      }

      // Determine the highest and lowest country count
      for (const country in countryCount) {
        const count = countryCount[country];
        if (count > highestCountryCount.count) {
          highestCountryCount = { country, count };
        }
        if (count < lowestCountryCount.count) {
          lowestCountryCount = { country, count };
        }
      }

      // If no countries are found, set the country count to null
      if (highestCountryCount.count === 0) highestCountryCount = null;
      if (lowestCountryCount.count === Infinity) lowestCountryCount = null;

      // Generate the final report
      const totalPeople = totalUsers + totalAdmins;
      res.status(200).json({
        success: true,
        report: {
          totalUsers,
          totalAdmins,
          totalPeople,
          highestCurrencyCount,
          highestCountryCount,
          lowestCurrencyCount,
          lowestCountryCount,
          users, // Include user data in the report
        },
      });
    } catch (error) {
      logger.error(error.message);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
};

export default generateUserSummaryReport;
