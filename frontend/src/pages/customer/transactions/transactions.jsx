import React, { useState, useEffect } from "react";
import axios from "axios";
import EditTransactionModal from "../../../components/user_components/EditTransactionModal";
import { useNavigate } from "react-router-dom";

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [filters, setFilters] = useState({
    type: "",
    category: "",
    month: "",
    year: "",
  });
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    type: "",
    category: "",
    currency: "",
    amount: "",
    date: "",
  });
  const [categories, setCategories] = useState([]);
  const [months, setMonths] = useState([]);
  const [years, setYears] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [message, setMessage] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryDescription, setCategoryDescription] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tagDescription, setTagDescription] = useState(null);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const navigate = useNavigate();

  const fetchTransactions = async () => {
    try {
      const email = localStorage.getItem("email");
      const token = localStorage.getItem("token");
      if (!email) throw new Error("Email is missing in localStorage.");

      const [incomeResponse, expenseResponse] = await Promise.all([
        axios.get(`http://localhost:5000/api/transaction/incomes`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { email },
        }),
        axios.get(`http://localhost:5000/api/transaction/expenses`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { email },
        }),
      ]);

      const incomes = incomeResponse.data.incomes || [];
      const expenses = expenseResponse.data.expenses || [];
      const allTransactions = [...incomes, ...expenses].map((tx) => ({
        ...tx,
        currency: tx.currency,
      }));

      setTransactions(allTransactions);
      setFilteredTransactions(allTransactions);

      const uniqueCategories = [
        ...new Set(allTransactions.map((tx) => tx.category)),
      ];
      setCategories(uniqueCategories);

      const uniqueMonths = [
        ...new Set(
          allTransactions.map((tx) => new Date(tx.date).getMonth() + 1)
        ),
      ].sort((a, b) => a - b);

      const uniqueYears = [
        ...new Set(
          allTransactions.map((tx) => new Date(tx.date).getFullYear())
        ),
      ].sort((a, b) => a - b);

      setMonths(uniqueMonths);
      setYears(uniqueYears);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    if (filters.type) {
      filtered = filtered.filter((tx) => tx.type === filters.type);
    }
    if (filters.category) {
      filtered = filtered.filter((tx) => tx.category === filters.category);
    }
    if (filters.month) {
      filtered = filtered.filter(
        (tx) => new Date(tx.date).getMonth() + 1 === Number(filters.month)
      );
    }
    if (filters.year) {
      filtered = filtered.filter(
        (tx) => new Date(tx.date).getFullYear() === Number(filters.year)
      );
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter((tx) =>
        selectedTags.every((tag) => tx.tags && tx.tags.includes(tag))
      );
    }

    setFilteredTransactions(filtered);
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setEditForm({
      title: transaction.title,
      type: transaction.type,
      category: transaction.category,
      currency: transaction.currency,
      amount: transaction.amount,
      date: transaction.date ? transaction.date.split("T")[0] : "",
      isRecurring: transaction.isRecurring || false,
      recurrenceType: transaction.recurrenceType || "",
    });
  };

  const handleSaveEdit = async () => {
    try {
      console.log("Data being sent to the backend:", editForm);

      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token is missing.");

      const endpoint = `http://localhost:5000/api/transaction/${editForm.type}/${editingTransaction._id}`;
      await axios.patch(
        endpoint,
        {
          ...editForm,
          currency: editForm.currency,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMessage({
        type: "success",
        text: "Transaction updated successfully!",
      });

      fetchTransactions();
      setEditingTransaction(null);
    } catch (error) {
      console.error("Error updating transaction:", error);
    }
  };

  const handleDelete = async (transactionId, type) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token is missing.");

      // Select the correct API endpoint based on the type of transaction

      const endpoint =
        type === "income"
          ? `http://localhost:5000/api/transaction/income/${transactionId}`
          : `http://localhost:5000/api/transaction/expense/${transactionId}`;

      // Make the DELETE request
      await axios.delete(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessage({
        type: "success",
        text: "Transaction deleted successfully!",
      });
      // Refresh the transactions after deletion
      fetchTransactions();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to delete income.",
      });
    }
  };

  const formatAmount = (amount, currency, type) => {
    return type === "income" ? (
      <span className="text-green-500">{`${amount}`}</span>
    ) : (
      <span className="text-red-500">{`-${amount}`}</span>
    );
  };

  const capitalizeWords = (str) =>
    str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, selectedTags]);

  const handleTagInputChange = (e) => {
    const value = e.target.value;
    setTagInput(value);

    if (value.trim() === "") {
      setSuggestedTags([]);
    } else {
      const filtered = availableTags.filter(
        (tag) =>
          typeof tag === "string" &&
          tag.toLowerCase().startsWith(value.toLowerCase())
      );
      setSuggestedTags(filtered);
    }
  };

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" && tagInput.trim() !== "") {
      e.preventDefault();
      if (!selectedTags.includes(tagInput.trim())) {
        setSelectedTags([...selectedTags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const removeTag = (tag) => {
    setSelectedTags((prevTags) => prevTags.filter((t) => t !== tag));
  };

  const fetchTags = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/tags", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAvailableTags(response.data.tags || []);
    } catch (error) {
      console.error("Error fetching tags:", error);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const handleCategoryClick = (category, description) => {
    // Show the modal with the category description
    setCategoryDescription(description);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCategoryDescription(null);
  };

  const handleTagClick = (tags) => {
    // Join tags as a string with commas and set them to be displayed in the modal
    setTagDescription(tags ? tags.join(", ") : "No tags available.");
    setIsTagModalOpen(true);
  };

  const closeTagModal = () => {
    setIsTagModalOpen(false);
    setTagDescription(null);
  };

  const handleReportClick = () => {
    navigate("/user/report");
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 py-10">
      {/* Filters */}
      <div className="w-full max-w-7xl mx-auto space-y-8">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>

            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {capitalizeWords(category)}
                </option>
              ))}
            </select>

            <select
              name="month"
              value={filters.month}
              onChange={handleFilterChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Months</option>
              {months.map((month) => (
                <option key={month} value={month}>
                  {new Date(0, month - 1).toLocaleString("default", {
                    month: "long",
                  })}
                </option>
              ))}
            </select>

            <select
              name="year"
              value={filters.year}
              onChange={handleFilterChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Years</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Tag Filter Section */}
          <div className="mt-4 relative">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Filter by Tags
            </h3>
            <div className="flex flex-wrap items-center border border-gray-300 rounded-md p-2">
              {selectedTags.map((tag) => (
                <span
                  key={tag}
                  className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full flex items-center m-1"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={handleTagInputChange}
                onKeyDown={handleTagKeyDown}
                placeholder="Type and press Enter..."
                className="flex-1 outline-none bg-transparent px-2 py-1"
              />
            </div>

            {/* Suggested Tags Dropdown */}
            {suggestedTags.length > 0 && (
              <div className="absolute bg-white border rounded shadow-md w-full mt-1 z-10">
                {suggestedTags.map((tag) => (
                  <div
                    key={tag}
                    onClick={() => {
                      if (!selectedTags.includes(tag)) {
                        setSelectedTags([...selectedTags, tag]);
                      }
                      setTagInput("");
                      setSuggestedTags([]);
                    }}
                    className="p-2 cursor-pointer hover:bg-gray-200"
                  >
                    {tag}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Transactions
            </h2>
            <button
              onClick={handleReportClick}
              className="px-8 py-2 mb-4 bg-purple-500 text-white rounded-md hover:bg-purple-700"
            >
              Report
            </button>
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
          {filteredTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="px-4 py-2 border border-gray-300">Title</th>
                    <th className="px-4 py-2 border border-gray-300">Type</th>
                    <th className="px-4 py-2 border border-gray-300">Tags</th>
                    <th className="px-4 py-2 border border-gray-300">
                      Category
                    </th>
                    <th className="px-4 py-2 border border-gray-300">
                      Recurring
                    </th>
                    <th className="px-4 py-2 border border-gray-300">
                      Currency
                    </th>
                    <th className="px-4 py-2 border border-gray-300">Amount</th>
                    <th className="px-4 py-2 border border-gray-300">Date</th>
                    <th className="px-4 py-2 border border-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-gray-100">
                      <td className="px-4 py-2 border border-gray-300">
                        {capitalizeWords(tx.title)}
                      </td>
                      <td
                        className={`px-4 py-2 border border-gray-300 text-center ${
                          tx.type === "income"
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        {capitalizeWords(tx.type)}
                      </td>
                      <td className="px-4 py-2 border border-gray-300 text-center">
                        <button
                          onClick={() => handleTagClick(tx.tags)} // Pass the tags array here
                          className="text-indigo-600 hover:underline"
                        >
                          {tx.tags?.length || 0} {/* Show the number of tags */}
                        </button>
                      </td>
                      <td className="px-4 py-2 border border-gray-300 text-center">
                        {tx.description ? (
                          <button
                            onClick={() =>
                              handleCategoryClick(tx.category, tx.description)
                            }
                            className="text-blue-600 hover:underline"
                          >
                            {capitalizeWords(tx.category)}
                          </button>
                        ) : (
                          <span>{capitalizeWords(tx.category)}</span>
                        )}
                      </td>
                      <td
                        className={`px-4 py-2 border border-gray-300 text-center ${
                          tx.recurrenceType === null
                            ? "text-black"
                            : "text-purple-500"
                        }`}
                      >
                        {tx.isRecurring
                          ? capitalizeWords(tx.recurrenceType)
                          : "No"}
                      </td>
                      <td className="px-4 py-2 border border-gray-300 text-center">
                        {tx.currency}
                      </td>
                      <td className="px-4 py-2 border border-gray-300 text-center">
                        {formatAmount(tx.amount, tx.currency, tx.type)}
                      </td>
                      <td className="px-4 py-2 border border-gray-300">
                        {tx.date.split("T")[0]}
                      </td>
                      <td className="px-4 py-2 border border-gray-300 space-x-2">
                        <button
                          onClick={() => handleEdit(tx)}
                          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(tx._id, tx.type)}
                          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No transactions found.</p>
          )}
        </div>
      </div>

      {editingTransaction && (
        <EditTransactionModal
          editForm={editForm}
          setEditForm={setEditForm}
          setEditingTransaction={setEditingTransaction}
          handleSaveEdit={handleSaveEdit}
          capitalizeWords={capitalizeWords}
        />
      )}

      {/* Modal for category description */}
      {isModalOpen && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg max-w-xs w-full">
            <h3 className="text-xl font-bold mb-4">Category Description</h3>
            <p>{categoryDescription}</p>
            <button
              onClick={closeModal}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Modal for tag description */}
      {isTagModalOpen && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg max-w-xs w-full">
            <h3 className="text-xl font-bold mb-4">Tag Description</h3>
            <p>{tagDescription}</p>
            <button
              onClick={closeTagModal}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
