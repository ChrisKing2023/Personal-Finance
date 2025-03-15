import Expense from "../../models/expense.model.js";
import Income from "../../models/income.model.js";

const getAvailableDates = {
  async getAvailableDates(req, res) {
    try {
      const { selectedDay, selectedMonth, selectedYear } = req.query; // Day, Month, and Year are passed as query params
      const expenseDates = await Expense.distinct("date");
      const incomeDates = await Income.distinct("date");

      const allDates = [...expenseDates, ...incomeDates].map(
        date => new Date(date)
      );

      if (allDates.length === 0) {
        return res.status(200).json({ success: true, months: [], years: [] });
      }

      let filteredDates = allDates;

      // Filter by Day if provided
      if (selectedDay) {
        filteredDates = filteredDates.filter(
          date => date.getDate() === parseInt(selectedDay)
        );
      }

      // Filter by Month if provided
      if (selectedMonth) {
        filteredDates = filteredDates.filter(
          date => date.getMonth() + 1 === parseInt(selectedMonth)
        );
      }

      // Filter by Year if provided
      if (selectedYear) {
        filteredDates = filteredDates.filter(
          date => date.getFullYear() === parseInt(selectedYear)
        );
      }

      // Get available months, years, and days from filtered dates
      const months = new Set();
      const years = new Set();
      const days = new Set();

      filteredDates.forEach(date => {
        months.add(date.getMonth() + 1); // 1-based index for months
        years.add(date.getFullYear());
        days.add(date.getDate()); // Get available days for the current filter
      });

      // When a user selects a day, we also want to exclude months/years that do not have that day.
      if (selectedDay) {
        // Filter months and years that don't have the selected day
        const validMonths = new Set();
        const validYears = new Set();

        filteredDates.forEach(date => {
          if (date.getDate() === parseInt(selectedDay)) {
            validMonths.add(date.getMonth() + 1);
            validYears.add(date.getFullYear());
          }
        });

        // Update months and years based on valid days
        res.status(200).json({
          success: true,
          months: Array.from(validMonths).sort((a, b) => a - b),
          years: Array.from(validYears).sort((a, b) => a - b),
          days: Array.from(days).sort((a, b) => a - b),
        });
        return;
      }

      // If no day is selected, return all valid months and years
      res.status(200).json({
        success: true,
        months: Array.from(months).sort((a, b) => a - b),
        years: Array.from(years).sort((a, b) => a - b),
        days: Array.from(days).sort((a, b) => a - b), // Include available days
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
};

export default getAvailableDates;
