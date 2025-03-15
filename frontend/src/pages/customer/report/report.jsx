import React, { useState, useEffect } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";

const Report = () => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [userBudget, setUserBudget] = useState([]);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    email: localStorage.getItem("email") || "",
    month: "",
    year: "",
    type: "",
  });
  const [availableMonths, setAvailableMonths] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [availableDays, setAvailableDays] = useState([]);
  const preferredCurrency = localStorage.getItem("currency") || "LKR"; // Default to LKR

  useEffect(() => {
    const fetchReport = async () => {
      const { email } = filters;
      const token = localStorage.getItem("token");

      try {
        setLoading(true);
        const response = await axios.get(
          "http://localhost:5000/api/report/user-reports",
          {
            params: { email, currency: preferredCurrency }, // Pass preferredCurrency as a parameter
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setReportData(response.data.report);
        setLoading(false);
      } catch (err) {
        setError("Error fetching report data");
        setLoading(false);
      }
    };

    fetchReport();
  }, [filters, preferredCurrency]); // Add preferredCurrency as a dependency

  // Fetch user budget data
  useEffect(() => {
    const fetchUserBudget = async () => {
      const { email } = filters;
      const token = localStorage.getItem("token");
      try {
        const response = await axios.get(
          "http://localhost:5000/api/report/user-budget",
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { email, currency: preferredCurrency },
          }
        );
        setUserBudget(response.data.budgetData);
      } catch (err) {
        setError("Error fetching budget data");
      }
    };

    if (filters.email) {
      fetchUserBudget();
    }
  }, [filters, preferredCurrency]);

  const fetchAvailableDates = async () => {
    try {
      const { day, month, year } = filters;
      // Send filters to the API to get the available dates based on the selected filters
      const response = await axios.get(
        "http://localhost:5000/api/report/available-dates",
        {
          params: {
            selectedDay: day,
            selectedMonth: month,
            selectedYear: year,
          },
        }
      );

      // Set the available options based on the API response
      setAvailableDays(response.data.days);
      setAvailableMonths(response.data.months);
      setAvailableYears(response.data.years);
    } catch (error) {
      setError("Error fetching available dates");
    }
  };

  // Fetch available dates whenever filters change
  useEffect(() => {
    fetchAvailableDates();
  }, [filters]); // Trigger fetchAvailableDates whenever the filters change

  // Handle filter changes (day, month, year)
  const handleFilterChange = (filter, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [filter]: value,
    }));
  };

  const formatDate = (date) => {
    const options = { day: "2-digit", month: "short", year: "numeric" };
    return new Date(date).toLocaleDateString("en-GB", options); // Returns date in "day month year" format
  };

  // No need for conversion now, just return the amount
  const displayAmount = (amount) => {
    return amount; // Display the amount as it is in the currency it was recorded in
  };

  const generatePDF = () => {
    const doc = new jsPDF();

    // Set initial font size
    doc.setFontSize(18);
    doc.text("User Report", 20, 20);

    // Add Total Income, Expense, Grand Total
    doc.setFontSize(14);
    doc.text(
      `Total Income: ${displayAmount(
        reportData.totalIncome
      )} ${preferredCurrency}`,
      20,
      40
    );
    doc.text(
      `Total Expense: ${displayAmount(
        reportData.totalExpense
      )} ${preferredCurrency}`,
      20,
      50
    );
    doc.text(
      `Grand Total: ${displayAmount(
        reportData.grandTotal
      )} ${preferredCurrency}`,
      20,
      60
    );

    // Check if there's enough space for Income & Expense Breakdown
    let currentY = 80;
    const pageHeight = doc.internal.pageSize.height; // Get the height of the page
    const marginTop = 20;

    // Add the Filtered Date (Day, Month, Year) information
    let filterText = "Filters Applied: ";
    if (filters.day) {
      filterText += `Day: ${filters.day} `;
    }
    if (filters.month) {
      filterText += `Month: ${filters.month} `;
    }
    if (filters.year) {
      filterText += `Year: ${filters.year}`;
    }

    // Add Filters information below the title
    doc.setFontSize(12);
    doc.text(filterText, 20, currentY);

    currentY += 10; // Space after the filter information

    // Add Income & Expense Breakdown Header
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Income & Expense Breakdown", 20, currentY);

    currentY += 10;

    // Add table headers
    doc.text("Category", 20, currentY);
    doc.text("Type", 70, currentY);
    doc.text("Date", 110, currentY);
    doc.text("Amount", 160, currentY);
    currentY += 10;

    // Filter and Add Income Transactions
    const filteredIncomeTransactions = reportData.transactions
      .filter((transaction) => transaction.type === "income")
      .filter((transaction) => {
        const transactionDate = new Date(transaction.date);
        const filterDateMatches =
          (filters.day
            ? transactionDate.getDate() === parseInt(filters.day)
            : true) &&
          (filters.month
            ? transactionDate.getMonth() + 1 === parseInt(filters.month)
            : true) &&
          (filters.year
            ? transactionDate.getFullYear() === parseInt(filters.year)
            : true);
        return filterDateMatches;
      });

    if (filteredIncomeTransactions.length === 0) {
      doc.text("No Income Transactions Available", 20, currentY);
    } else {
      filteredIncomeTransactions.forEach((transaction) => {
        if (currentY + 10 > pageHeight - marginTop) {
          doc.addPage();
          currentY = marginTop; // Reset Y position to top of new page
        }

        doc.text(transaction.category, 20, currentY);
        doc.text(transaction.type, 70, currentY);
        doc.text(formatDate(transaction.date), 110, currentY);
        doc.text(
          `${displayAmount(transaction.amount)} ${preferredCurrency}`,
          160,
          currentY
        );
        currentY += 10;
      });
    }

    // Add a space before Expense Transactions
    currentY += 10;

    // Filter and Add Expense Transactions
    const filteredExpenseTransactions = reportData.transactions
      .filter((transaction) => transaction.type === "expense")
      .filter((transaction) => {
        const transactionDate = new Date(transaction.date);
        const filterDateMatches =
          (filters.day
            ? transactionDate.getDate() === parseInt(filters.day)
            : true) &&
          (filters.month
            ? transactionDate.getMonth() + 1 === parseInt(filters.month)
            : true) &&
          (filters.year
            ? transactionDate.getFullYear() === parseInt(filters.year)
            : true);
        return filterDateMatches;
      });

    if (filteredExpenseTransactions.length === 0) {
      doc.text("No Expense Transactions Available", 20, currentY);
    } else {
      filteredExpenseTransactions.forEach((transaction) => {
        if (currentY + 10 > pageHeight - marginTop) {
          doc.addPage();
          currentY = marginTop; // Reset Y position to top of new page
        }

        doc.text(transaction.category, 20, currentY);
        doc.text(transaction.type, 70, currentY);
        doc.text(formatDate(transaction.date), 110, currentY);
        doc.text(
          `${displayAmount(transaction.amount)} ${preferredCurrency}`,
          160,
          currentY
        );
        currentY += 10;
      });
    }

    // Add User Budget Overview
    currentY += 20;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("User Budget Overview", 20, currentY);
    currentY += 10;

    // Check if userBudget is available and handle multiple pages
    if (userBudget.length > 0) {
      doc.setFontSize(12);
      userBudget.forEach((budget, index) => {
        // Check if we need a new page
        if (currentY + 60 > pageHeight - marginTop) {
          doc.addPage();
          currentY = marginTop; // Reset Y position to top of new page
        }

        doc.setFont("helvetica", "bold");
        doc.text(`Category: ${budget.category}`, 20, currentY);
        doc.setFont("helvetica", "normal");
        doc.text(
          `Budgeted: ${budget.budget} ${preferredCurrency}`,
          20,
          currentY + 10
        );
        doc.text(
          `Spent: ${budget.totalSpent} ${preferredCurrency}`,
          20,
          currentY + 20
        );
        doc.text(
          `Remaining: ${budget.remainingBudget} ${preferredCurrency}`,
          20,
          currentY + 30
        );
        doc.text(`Date Range: ${budget.dateRange}`, 20, currentY + 40);
        currentY += 50; // Move to next budget entry with a 50-pixel gap

        // Add a separator line between budget entries for visual clarity
        if (index < userBudget.length - 1) {
          // Add line only if it's not the last item
          doc.setLineWidth(0.5);
          doc.setDrawColor(200, 200, 200); // Light gray color for the separator line
          doc.line(20, currentY, 190, currentY); // Draw a line across the page
          currentY += 10; // Add some space after the separator
        }
      });
    } else {
      doc.setFontSize(12);
      doc.text("No budget data available", 20, currentY);
    }

    // Save the document
    doc.save("user_report.pdf");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-100 py-10">
        <div className="animate-spin border-t-4 border-blue-600 w-16 h-16 rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-100 py-10">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">
          <h2 className="text-xl font-semibold">Error: {error}</h2>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-100 py-10">
        <div className="bg-gray-200 text-gray-700 p-4 rounded-lg">
          <h2 className="text-xl font-semibold">No Report Data Found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 py-10">
      <div className="w-full max-w-7xl mx-auto p-6 bg-white shadow-lg rounded-lg">
        {/* Generate PDF Button */}
        <div className="mt-6 text-center">
          <button
            onClick={generatePDF}
            className="bg-blue-500 text-white px-4 py-2 rounded-md"
          >
            Generate Report (PDF)
          </button>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-6">User Report</h1>

        {/* Filters Section */}
        <div className="bg-gray-200 p-4 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-bold text-gray-700 mb-4">
            Filter Report
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Day Filter */}
            <div>
              <label className="block text-gray-600 font-semibold mb-2">
                Day
              </label>
              <select
                value={filters.day}
                onChange={(e) => handleFilterChange("day", e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">All</option>
                {availableDays.map((day, index) => (
                  <option key={index} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Filter */}
            <div>
              <label className="block text-gray-600 font-semibold mb-2">
                Month
              </label>
              <select
                value={filters.month}
                onChange={(e) => handleFilterChange("month", e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">All</option>
                {availableMonths.map((month, index) => (
                  <option key={index} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Filter */}
            <div>
              <label className="block text-gray-600 font-semibold mb-2">
                Year
              </label>
              <select
                value={filters.year}
                onChange={(e) => handleFilterChange("year", e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">All</option>
                {availableYears.map((year, index) => (
                  <option key={index} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-blue-100 p-4 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-700">
              Total Income
            </h3>
            <p className="text-2xl font-bold text-blue-600">
              {displayAmount(reportData.totalIncome)} {preferredCurrency}
            </p>
          </div>

          <div className="bg-red-100 p-4 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-700">
              Total Expense
            </h3>
            <p className="text-2xl font-bold text-red-600">
              {displayAmount(reportData.totalExpense)} {preferredCurrency}
            </p>
          </div>

          <div className="bg-green-100 p-4 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-700">Grand Total</h3>
            <p className="text-2xl font-bold text-green-600">
              {displayAmount(reportData.grandTotal)} {preferredCurrency}
            </p>
          </div>
        </div>

        {/* Income and Expense Breakdown */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Income & Expense Breakdown
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Income Entries
              </h3>
              <ul className="space-y-4">
                {/* Filter Income Transactions */}
                {reportData.transactions
                  .filter((transaction) => transaction.type === "income")
                  .filter((transaction) => {
                    const transactionDate = new Date(transaction.date);
                    const filterDateMatches =
                      (filters.day
                        ? transactionDate.getDate() === parseInt(filters.day)
                        : true) &&
                      (filters.month
                        ? transactionDate.getMonth() + 1 ===
                          parseInt(filters.month)
                        : true) &&
                      (filters.year
                        ? transactionDate.getFullYear() ===
                          parseInt(filters.year)
                        : true);
                    return filterDateMatches;
                  }).length === 0 ? (
                  <li className="text-center text-gray-700">
                    No Transactions Available
                  </li>
                ) : (
                  reportData.transactions
                    .filter((transaction) => transaction.type === "income")
                    .filter((transaction) => {
                      const transactionDate = new Date(transaction.date);
                      const filterDateMatches =
                        (filters.day
                          ? transactionDate.getDate() === parseInt(filters.day)
                          : true) &&
                        (filters.month
                          ? transactionDate.getMonth() + 1 ===
                            parseInt(filters.month)
                          : true) &&
                        (filters.year
                          ? transactionDate.getFullYear() ===
                            parseInt(filters.year)
                          : true);
                      return filterDateMatches;
                    })
                    .map((transaction, index) => (
                      <li
                        key={index}
                        className="flex justify-between items-center text-gray-700"
                      >
                        {/* Category on the left */}
                        <span className="flex-1">{transaction.category}</span>

                        {/* Date in the middle */}
                        <span className="flex-1 text-center">
                          {formatDate(transaction.date)}
                        </span>

                        {/* Amount on the right */}
                        <span className="flex-1 text-right">
                          {displayAmount(transaction.amount)}{" "}
                          {preferredCurrency}
                        </span>
                      </li>
                    ))
                )}
              </ul>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Expense Entries
              </h3>
              <ul className="space-y-4">
                {/* Filter Expense Transactions */}
                {reportData.transactions
                  .filter((transaction) => transaction.type === "expense")
                  .filter((transaction) => {
                    const transactionDate = new Date(transaction.date);
                    const filterDateMatches =
                      (filters.day
                        ? transactionDate.getDate() === parseInt(filters.day)
                        : true) &&
                      (filters.month
                        ? transactionDate.getMonth() + 1 ===
                          parseInt(filters.month)
                        : true) &&
                      (filters.year
                        ? transactionDate.getFullYear() ===
                          parseInt(filters.year)
                        : true);
                    return filterDateMatches;
                  }).length === 0 ? (
                  <li className="text-center text-gray-700">
                    No Transactions Available
                  </li>
                ) : (
                  reportData.transactions
                    .filter((transaction) => transaction.type === "expense")
                    .filter((transaction) => {
                      const transactionDate = new Date(transaction.date);
                      const filterDateMatches =
                        (filters.day
                          ? transactionDate.getDate() === parseInt(filters.day)
                          : true) &&
                        (filters.month
                          ? transactionDate.getMonth() + 1 ===
                            parseInt(filters.month)
                          : true) &&
                        (filters.year
                          ? transactionDate.getFullYear() ===
                            parseInt(filters.year)
                          : true);
                      return filterDateMatches;
                    })
                    .map((transaction, index) => (
                      <li
                        key={index}
                        className="flex justify-between items-center text-gray-700"
                      >
                        {/* Category on the left */}
                        <span className="flex-1">{transaction.category}</span>

                        {/* Date in the middle */}
                        <span className="flex-1 text-center">
                          {formatDate(transaction.date)}
                        </span>

                        {/* Amount on the right */}
                        <span className="flex-1 text-right">
                          {displayAmount(transaction.amount)}{" "}
                          {preferredCurrency}
                        </span>
                      </li>
                    ))
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Highest/Lowest Income/Expense */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Highest & Lowest Transactions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-700 mb-4">
                Highest Income
              </h3>
              <p className="text-xl text-blue-600">
                {displayAmount(reportData.highestIncome.amount)}{" "}
                {preferredCurrency}
              </p>
              <p className="text-gray-500">
                Category: {reportData.highestIncome.category}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-700 mb-4">
                Lowest Income
              </h3>
              <p className="text-xl text-blue-600">
                {displayAmount(reportData.lowestIncome.amount)}{" "}
                {preferredCurrency}
              </p>
              <p className="text-gray-500">
                Category: {reportData.lowestIncome.category}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-700 mb-4">
                Highest Expense
              </h3>
              <p className="text-xl text-red-600">
                {displayAmount(reportData.highestExpense.amount)}{" "}
                {preferredCurrency}
              </p>
              <p className="text-gray-500">
                Category: {reportData.highestExpense.category}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-700 mb-4">
                Lowest Expense
              </h3>
              <p className="text-xl text-red-600">
                {displayAmount(reportData.lowestExpense.amount)}{" "}
                {preferredCurrency}
              </p>
              <p className="text-gray-500">
                Category: {reportData.lowestExpense.category}
              </p>
            </div>

            {/* User Budget Section */}
            <div className="mt-10">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-8 text-center">
                User Budget Overview
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-56">
                {userBudget.map((budget, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 w-full md:w-80 h-60 rounded-xl shadow-xl hover:scale-105 transition-transform duration-300 ease-in-out flex flex-col justify-between"
                  >
                    <h3 className="text-xl font-semibold text-white">
                      {budget.category}
                    </h3>
                    <p className="text-white text-sm">
                      <span className="font-medium text-gray-200">
                        Date Range:
                      </span>{" "}
                      {budget.dateRange}
                    </p>
                    <div className="space-y-2">
                      <p className="text-md font-bold text-white">
                        Budget:{" "}
                        <span className="text-yellow-400">
                          {budget.budget} {preferredCurrency}
                        </span>
                      </p>
                      <p className="text-md font-bold text-white">
                        Remaining:{" "}
                        <span className="text-green-400">
                          {budget.remainingBudget} {preferredCurrency}
                        </span>
                      </p>
                      <p className="text-md font-bold text-white">
                        Spent:{" "}
                        <span className="text-red-400">
                          {budget.totalSpent} {preferredCurrency}
                        </span>
                      </p>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <button className="bg-transparent border-2 border-white text-white py-1 px-4 rounded-full hover:bg-white hover:text-gray-900 transition-all duration-300">
                        View Details
                      </button>
                      <div className="text-white w-1/2">
                        <span className="font-medium">Remaining:</span>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{
                              width: `${(
                                (parseFloat(budget.remainingBudget) /
                                  parseFloat(budget.budget)) *
                                100
                              ).toFixed(0)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Report;
