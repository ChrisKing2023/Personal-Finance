import React, { useState, useEffect } from "react";
import axios from "axios";
import { format } from "date-fns";
import CategorySelector from "../../../components/user_components/CategoryExpenseSelector";
import clsx from "clsx";

const getCurrency = () => localStorage.getItem("currency") || "USD";

const Budgets = () => {
  const [currency, setCurrency] = useState(getCurrency());
  const [budgets, setBudgets] = useState([]);
  const [form, setForm] = useState({
    category: "",
    budget: "",
    startDate: "",
    endDate: "",
  });
  const [filter, setFilter] = useState({
    month: "",
    year: "",
    category: "",
  });
  const [availableFilters, setAvailableFilters] = useState({
    months: [],
    years: [],
    categories: [],
  });
  const [message, setMessage] = useState(null);

  const token = localStorage.getItem("token");
  const email = localStorage.getItem("email");

  useEffect(() => {
    setCurrency(getCurrency());
    if (!token || !email) {
      setMessage({
        type: "error",
        text: token ? "Email is required." : "Authentication token is missing.",
      });
      return;
    }

    const fetchBudgets = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/budget/getbudgets",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const budgetsData = response.data.budgets || [];
        const months = [
          ...new Set(
            budgetsData.map(
              (budget) => new Date(budget.startDate).getMonth() + 1
            )
          ),
        ];
        const years = [
          ...new Set(
            budgetsData.map((budget) =>
              new Date(budget.startDate).getFullYear()
            )
          ),
        ];
        const categories = [
          ...new Set(budgetsData.map((budget) => budget.category)),
        ];

        setAvailableFilters({ months, years, categories });
        setBudgets(budgetsData);
      } catch (error) {
        setMessage({ type: "error", text: "Failed to fetch budgets." });
      }
    };

    fetchBudgets();
  }, [token, email]);

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post(
        "http://localhost:5000/api/budget/add",
        { ...form, email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage({
        type: "success",
        text: "Budget added/updated successfully.",
      });
      setForm({ category: "", budget: "", startDate: "", endDate: "" });
    } catch (error) {
      setMessage({ type: "error", text: "Failed to add/update budget." });
    }
  };

  const filteredBudgets = budgets.filter((budget) => {
    const startDate = new Date(budget.startDate);
    return (
      (filter.month
        ? startDate.getMonth() + 1 === Number(filter.month)
        : true) &&
      (filter.year ? startDate.getFullYear() === Number(filter.year) : true) &&
      (filter.category ? budget.category === filter.category : true)
    );
  });

  // Function to calculate progress bar color based on remaining budget
  const getProgressBarColor = (remainingBudget) => {
    return clsx({
      "bg-green-500": remainingBudget >= 25000,
      "bg-orange-500": remainingBudget >= 10000 && remainingBudget < 25000,
      "bg-red-500": remainingBudget < 10000,
    });
  };

  // Function to calculate progress bar width
  const getProgressBarWidth = (remainingBudget, totalBudget) => {
    return `${(remainingBudget / totalBudget) * 100}%`;
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this budget?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/budget/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setBudgets(budgets.filter((budget) => budget._id !== id));
      setMessage({ type: "success", text: "Budget deleted successfully." });
    } catch (error) {
      setMessage({ type: "error", text: "Failed to delete budget." });
    }
  };

  // Function to capitalize each word in a category
  const formatCategory = (category) =>
    category
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-purple-50 p-8">
      <div className="max-w-5xl mx-auto bg-white shadow-2xl rounded-2xl p-8 transform transition-all duration-300 hover:shadow-3xl">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-8 text-center">
          Manage Your Budgets
        </h1>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-100 text-green-800 border-l-4 border-green-500"
                : "bg-red-100 text-red-800 border-l-4 border-red-500"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <CategorySelector
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700">
                Budget
              </label>
              <input
                type="number"
                name="budget"
                value={form.budget}
                onChange={handleFormChange}
                className="w-full mt-1 p-3 border-2 border-indigo-300 rounded-lg focus:outline-none focus:border-indigo-500 transition-all duration-300 hover:shadow-md"
                placeholder="Enter budget amount"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={handleFormChange}
                className="w-full mt-1 p-3 border-2 border-indigo-300 rounded-lg focus:outline-none focus:border-indigo-500 transition-all duration-300 hover:shadow-md"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700">
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={handleFormChange}
                className="w-full mt-1 p-3 border-2 border-indigo-300 rounded-lg focus:outline-none focus:border-indigo-500 transition-all duration-300 hover:shadow-md"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-3 rounded-lg shadow-lg hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105"
          >
            Save Budget
          </button>
        </form>

        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-700">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block font-medium text-gray-700">Month</label>
              <select
                name="month"
                value={filter.month}
                onChange={(e) =>
                  setFilter({ ...filter, month: e.target.value })
                }
                className="w-full mt-1 p-3 border-2 border-indigo-300 rounded-lg focus:outline-none focus:border-indigo-500 transition-all duration-300 hover:shadow-md"
              >
                <option value="">All</option>
                {availableFilters.months.map((month) => (
                  <option key={month} value={month}>
                    {new Date(0, month - 1).toLocaleString("default", {
                      month: "long",
                    })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium text-gray-700">Year</label>
              <select
                name="year"
                value={filter.year}
                onChange={(e) => setFilter({ ...filter, year: e.target.value })}
                className="w-full mt-1 p-3 border-2 border-indigo-300 rounded-lg focus:outline-none focus:border-indigo-500 transition-all duration-300 hover:shadow-md"
              >
                <option value="">All</option>
                {availableFilters.years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium text-gray-700">
                Category
              </label>
              <select
                name="category"
                value={filter.category}
                onChange={(e) =>
                  setFilter({ ...filter, category: e.target.value })
                }
                className="w-full mt-1 p-3 border-2 border-indigo-300 rounded-lg focus:outline-none focus:border-indigo-500 transition-all duration-300 hover:shadow-md"
              >
                <option value="">All</option>
                {availableFilters.categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-700 mb-6">Budgets</h2>
          <div className="space-y-4">
            {filteredBudgets.map((budget) => {
              const progressBarColor = getProgressBarColor(
                budget.remainingBudget
              );
              const progressBarWidth = getProgressBarWidth(
                budget.remainingBudget,
                budget.budget
              );

              return (
                <div
                  key={budget._id}
                  className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-300 rounded-lg shadow-md hover:scale-102 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-indigo-700 text-lg">
                      {formatCategory(budget.category)}
                    </h3>
                    <button
                      onClick={() => handleDelete(budget._id)}
                      className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600 transition-all duration-300 shadow-md"
                    >
                      Delete
                    </button>
                  </div>
                  <p className="text-gray-700">
                    <strong>Budget:</strong> {currency} {budget.budget}
                  </p>
                  <p className="text-gray-700">
                    <strong>Remaining:</strong> {currency}{" "}
                    {budget.remainingBudget}
                  </p>
                  <p className="text-gray-700">
                    <strong>Period:</strong>{" "}
                    {format(new Date(budget.startDate), "dd MMM yyyy")} -{" "}
                    {format(new Date(budget.endDate), "dd MMM yyyy")}
                  </p>
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={clsx("h-2.5 rounded-full", progressBarColor)}
                        style={{ width: progressBarWidth }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Budgets;
