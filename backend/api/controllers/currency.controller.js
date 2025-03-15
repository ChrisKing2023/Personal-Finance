import Currency from "../models/currency.model";
import xss from "xss";

const currencyController = {
  // Get all currencies
  async getCurrencies(req, res) {
    try {
      const currencies = await Currency.find();
      res.status(200).json(currencies);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch currencies." });
    }
  },

  async addCurrency(req, res) {
    try {
      let { value, label } = req.body;

      value = xss(value);
      label = xss(label);

      if (!value || !label) {
        return res
          .status(400)
          .json({ error: "Both value and label are required." });
      }

      const existingCurrency = await Currency.findOne({ value });
      console.log("Existing currency check:", existingCurrency);

      if (existingCurrency) {
        return res.status(400).json({ error: "Currency already exists." });
      }

      const currency = new Currency({ value, label });
      console.log("Saving new currency:", currency);

      await currency.save();
      res
        .status(201)
        .json({ message: "Currency added successfully.", currency });
    } catch (error) {
      console.error("Error adding currency:", error); // Log the error for debugging
      res.status(500).json({ error: "Failed to add currency." });
    }
  },

  // Edit a currency (Admin only)
  async editCurrency(req, res) {
    try {
      const { id } = req.params;
      let { value, label } = req.body;

      value = xss(value);
      label = xss(label);

      if (!value || !label) {
        return res
          .status(400)
          .json({ error: "Both value and label are required." });
      }

      const updatedCurrency = await Currency.findByIdAndUpdate(
        id,
        { value, label },
        { new: true }
      );

      if (!updatedCurrency) {
        return res.status(404).json({ error: "Currency not found." });
      }

      res
        .status(200)
        .json({ message: "Currency updated successfully.", updatedCurrency });
    } catch (error) {
      res.status(500).json({ error: "Failed to update currency." });
    }
  },

  // Delete a currency (Admin only)
  async deleteCurrency(req, res) {
    try {
      const { id } = req.params;

      const deletedCurrency = await Currency.findByIdAndDelete(id);
      if (!deletedCurrency) {
        return res.status(404).json({ error: "Currency not found." });
      }

      res.status(200).json({ message: "Currency deleted successfully." });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete currency." });
    }
  },
};

export default currencyController;
