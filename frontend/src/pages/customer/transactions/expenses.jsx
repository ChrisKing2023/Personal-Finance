import React, { useState, useEffect } from "react";
import axios from "axios";
import CategorySelector from "../../../components/user_components/CategoryExpenseSelector";
import CurrencySelector from "../../../components/user_components/CurrencySelector";

const Expenses = () => {
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    date: "",
    category: "",
    description: "",
    email: localStorage.getItem("email") || "",
    tags: [],
    isRecurring: false,
    recurrenceType: "none",
  });

  const [message, setMessage] = useState(null);
  const [totalExpense, setTotalExpense] = useState(0);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [currency, setCurrency] = useState(
    localStorage.getItem("currency") || "USD"
  );
  const [tagInput, setTagInput] = useState("");

  const toTitleCase = (str) => {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Fetch total expense and recent expenses
  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token is missing.");

      const preferredCurrency = localStorage.getItem("currency") || "USD";

      const response = await axios.get(
        "http://localhost:5000/api/transaction/expenses",
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { currency: preferredCurrency },
        }
      );

      const expenses = response.data.expenses;
      if (!Array.isArray(expenses)) {
        throw new Error("Invalid data format: expenses should be an array.");
      }

      // Sort expenses by createdAt in descending order to get the most recent first
      const sortedExpenses = expenses.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      // Limit to the top 5 most recent expenses
      setRecentExpenses(sortedExpenses.slice(0, 5));

      // Fetch total expense from separate endpoint
      const totalExpenseResponse = await axios.get(
        "http://localhost:5000/api/transaction/total-expense",
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { currency },
        }
      );

      setTotalExpense(Number(totalExpenseResponse.data.totalExpense) || 0);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    }
  };

  const handleDelete = async (expenseId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token is missing.");

      await axios.delete(
        `http://localhost:5000/api/transaction/expense/${expenseId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMessage({ type: "success", text: "Expense deleted successfully!" });
      fetchExpenses();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to delete expense.",
      });
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleTagInput = (e) => {
    setTagInput(e.target.value);
  };

  const handleAddTag = (e) => {
    if (e.key === "Enter" && tagInput.trim()) {
      const newTag = tagInput.trim();
      if (!formData.tags.includes(newTag)) {
        setFormData((prev) => ({
          ...prev,
          tags: [...prev.tags, newTag],
        }));
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token is missing.");
      }

      // Add new expense
      await axios.post(
        "http://localhost:5000/api/transaction/add-expense",
        {
          ...formData,
          currency,
          isRecurring: formData.isRecurring || false,
          recurrenceType: formData.recurrenceType || "none",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMessage({ type: "success", text: "Expense added successfully!" });

      // Reset form
      setFormData({
        title: "",
        amount: "",
        date: "",
        category: "",
        description: "",
        email: localStorage.getItem("email") || "",
        tags: [],
        isRecurring: false,
        recurrenceType: "none",
      });

      // Re-fetch and sort expenses by createdAt
      fetchExpenses(); // This will get the latest expenses and sort them by createdAt
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "An error occurred.",
      });
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center bg-orange-100 py-10">
      <div className="w-full max-w-5xl space-y-8">
        {/* Total Expense */}
        <div className="bg-white shadow-md rounded-lg p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800">Total Expense</h1>
          <p className="text-2xl text-green-600 font-semibold mt-2">
            {localStorage.getItem("currency") || "USD"}{" "}
            {totalExpense.toFixed(2)}
          </p>
        </div>

        <div className="flex flex-wrap gap-8">
          {/* Form Section */}
          <div className="flex-1 bg-white shadow-md rounded-lg p-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Add Expense</h2>
              <h4 className="text-xs font-bold text-red-500">
                ( * ) are Mandatory Fields
              </h4>
            </div>

            {message && (
              <div
                className={`mb-4 p-3 rounded text-center ${
                  message.type === "success"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700"
                >
                  <span className="text-red-500">*</span> Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  maxLength={50}
                  className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring focus:border-blue-300 sm:text-sm"
                />
              </div>
              <CategorySelector
                value={formData.category}
                onChange={handleChange}
              />

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tags
                </label>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full flex items-center gap-2"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-red-500"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Type a tag and press Enter"
                  value={tagInput}
                  onChange={handleTagInput}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && tagInput.trim()) {
                      handleAddTag(e);
                      setTimeout(
                        () => document.getElementById("tagInput").focus(),
                        0
                      ); // Keep focus
                    }
                  }}
                  id="tagInput"
                  className="w-full mt-2 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring focus:border-blue-300"
                />
              </div>

              {/* Currency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  <span className="text-red-500">*</span> Currency
                </label>
                <CurrencySelector
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                />
              </div>

              {/* Amount */}
              <div>
                <label
                  htmlFor="amount"
                  className="block text-sm font-medium text-gray-700"
                >
                  <span className="text-red-500">*</span> Amount
                </label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring focus:border-blue-300 sm:text-sm"
                />
              </div>

              {/* Date */}
              <div>
                <label
                  htmlFor="date"
                  className="block text-sm font-medium text-gray-700"
                >
                  <span className="text-red-500">*</span> Date
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring focus:border-blue-300 sm:text-sm"
                />
              </div>

              {/* Recurring Transaction */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mt-6">
                  <input
                    type="checkbox"
                    checked={formData.isRecurring}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        isRecurring: e.target.checked,
                        recurrenceType: e.target.checked ? "monthly" : "none",
                      }))
                    }
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  Recurring Transaction
                </label>
              </div>

              {/* Recurrence Frequency */}
              {formData.isRecurring && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Recurrence Frequency
                  </label>
                  <select
                    value={formData.recurrenceType}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        recurrenceType: e.target.value,
                      }))
                    }
                    className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring focus:border-blue-300 sm:text-sm"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              )}

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring focus:border-blue-300 sm:text-sm"
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring focus:border-blue-300"
                >
                  Add Expense
                </button>
              </div>
            </form>
          </div>

          {/* Recent Expenses Section */}
          <div className="flex-1 bg-white shadow-md rounded-lg p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Recent Expenses
            </h2>
            <ul className="space-y-4">
              {recentExpenses.map((expense) => {
                const formattedDate = new Intl.DateTimeFormat("en-US", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }).format(new Date(expense.date));

                return (
                  <li
                    key={expense._id}
                    className="p-4 bg-gray-50 rounded-lg shadow-md border hover:shadow-lg transition-shadow"
                  >
                    <div className="flex justify-between items-center">
                      {/* Left Side: Title & Details */}
                      <div>
                        <p className="text-lg font-medium text-gray-800 mb-2 flex items-center gap-2">
                          {toTitleCase(expense.title)}
                          {/* Show Recurring Badge */}
                          {expense.isRecurring && (
                            <span className="bg-purple-200 text-purple-700 text-xs font-semibold px-2 py-1 rounded-full">
                              {expense.recurrenceType === "daily" && "Daily"}
                              {expense.recurrenceType === "weekly" && "Weekly"}
                              {expense.recurrenceType === "monthly" &&
                                "Monthly"}
                              {expense.recurrenceType === "yearly" && "Yearly"}
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-black mb-2">
                          <span className="font-semibold text-black">
                            Category:
                          </span>{" "}
                          {toTitleCase(expense.category)}
                        </p>
                        <p className="text-blue-700 font-bold">
                          {formattedDate}
                        </p>
                      </div>

                      {/* Right Side: Amount */}
                      <p className="text-green-600 font-semibold text-lg">
                        {expense.currency} {expense.amount.toFixed(2)}
                      </p>
                    </div>

                    {/* Display Tags */}
                    {expense.tags && expense.tags.length > 0 && (
                      <div className="mt-2">
                        <span className="font-semibold text-black">Tags:</span>
                        <ul className="flex flex-wrap mt-1">
                          {expense.tags.map((tag) => (
                            <li
                              key={tag}
                              className="bg-gray-200 text-gray-700 px-3 py-1 mr-1 mb-1 rounded-full"
                            >
                              #{tag}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => handleDelete(expense._id)}
                        className="py-2 px-4 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded shadow-md"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Expenses;
