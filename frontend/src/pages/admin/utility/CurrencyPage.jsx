import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";

const CurrencyPage = () => {
  const [currencies, setCurrencies] = useState([]);
  const [newCurrency, setNewCurrency] = useState({ value: "", label: "" });
  const [editingCurrency, setEditingCurrency] = useState(null);

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      headers: { Authorization: `Bearer ${token}` },
    };
  };

  const fetchCurrencies = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/currency",
        getAuthHeaders()
      );
      setCurrencies(res.data);
    } catch (error) {
      toast.error("Failed to fetch currencies");
    }
  };

  const handleAddCurrency = async () => {
    try {
      await axios.post(
        "http://localhost:5000/api/currency/add",
        newCurrency,
        getAuthHeaders()
      );
      toast.success("Currency added successfully");
      setNewCurrency({ value: "", label: "" });
      fetchCurrencies();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to add currency");
    }
  };

  const handleEditCurrency = async () => {
    try {
      await axios.put(
        `http://localhost:5000/api/currency/edit/${editingCurrency._id}`,
        editingCurrency,
        getAuthHeaders()
      );
      toast.success("Currency updated successfully");
      setEditingCurrency(null);
      fetchCurrencies();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update currency");
    }
  };

  const handleDeleteCurrency = async (id) => {
    try {
      await axios.delete(
        `http://localhost:5000/api/currency/delete/${id}`,
        getAuthHeaders()
      );
      toast.success("Currency deleted successfully");
      fetchCurrencies();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete currency");
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-lg shadow-md">
      <h1 className="text-xl font-bold mb-4">Manage Currencies</h1>
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Value"
          value={newCurrency.value}
          onChange={(e) =>
            setNewCurrency({ ...newCurrency, value: e.target.value })
          }
          className="border p-2 rounded w-full"
        />
        <input
          type="text"
          placeholder="Label"
          value={newCurrency.label}
          onChange={(e) =>
            setNewCurrency({ ...newCurrency, label: e.target.value })
          }
          className="border p-2 rounded w-full"
        />
        <button
          onClick={handleAddCurrency}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Add
        </button>
      </div>
      <ul>
        {currencies.map((currency) => (
          <li
            key={currency._id}
            className="flex justify-between items-center border-b py-2"
          >
            {editingCurrency?._id === currency._id ? (
              <>
                <input
                  type="text"
                  value={editingCurrency.value}
                  onChange={(e) =>
                    setEditingCurrency({
                      ...editingCurrency,
                      value: e.target.value,
                    })
                  }
                  className="border p-1 rounded"
                />
                <input
                  type="text"
                  value={editingCurrency.label}
                  onChange={(e) =>
                    setEditingCurrency({
                      ...editingCurrency,
                      label: e.target.value,
                    })
                  }
                  className="border p-1 rounded"
                />
                <button
                  onClick={handleEditCurrency}
                  className="bg-green-500 text-white px-2 py-1 rounded"
                >
                  Save
                </button>
              </>
            ) : (
              <>
                <span>
                  {currency.value} - {currency.label}
                </span>
                <div>
                  <button
                    onClick={() => setEditingCurrency(currency)}
                    className="bg-yellow-500 text-white px-2 py-1 rounded mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCurrency(currency._id)}
                    className="bg-red-500 text-white px-2 py-1 rounded"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CurrencyPage;
