import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";

const CategoryPage = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({
    value: "",
    label: "",
    type: "income",
  });
  const [editingCategory, setEditingCategory] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      headers: { Authorization: `Bearer ${token}` },
    };
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/category",
        getAuthHeaders()
      );
      setCategories(res.data);
    } catch (error) {
      toast.error("Failed to fetch categories");
    }
  };

  const handleAddCategory = async () => {
    try {
      await axios.post(
        "http://localhost:5000/api/category/add",
        newCategory,
        getAuthHeaders()
      );
      toast.success("Category added successfully");
      setNewCategory({ value: "", label: "", type: "income" });
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to add category");
    }
  };

  const handleEditCategory = async () => {
    try {
      await axios.put(
        `http://localhost:5000/api/category/edit/${editingCategory._id}`,
        editingCategory,
        getAuthHeaders()
      );
      toast.success("Category updated successfully");
      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update category");
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await axios.delete(
        `http://localhost:5000/api/category/delete/${id}`,
        getAuthHeaders()
      );
      toast.success("Category deleted successfully");
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete category");
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-lg shadow-md">
      <h1 className="text-xl font-bold mb-4">Manage Categories</h1>
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Value"
          value={newCategory.value}
          onChange={(e) =>
            setNewCategory({ ...newCategory, value: e.target.value })
          }
          className="border p-2 rounded w-full"
        />
        <input
          type="text"
          placeholder="Label"
          value={newCategory.label}
          onChange={(e) =>
            setNewCategory({ ...newCategory, label: e.target.value })
          }
          className="border p-2 rounded w-full"
        />
        <select
          value={newCategory.type}
          onChange={(e) =>
            setNewCategory({ ...newCategory, type: e.target.value })
          }
          className="border p-2 rounded"
        >
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <button
          onClick={handleAddCategory}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Add
        </button>
      </div>
      <ul>
        {categories.map((category) => (
          <li
            key={category._id}
            className="flex justify-between items-center border-b py-2"
          >
            {editingCategory?._id === category._id ? (
              <>
                <input
                  type="text"
                  value={editingCategory.value}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      value: e.target.value,
                    })
                  }
                  className="border p-1 rounded"
                />
                <input
                  type="text"
                  value={editingCategory.label}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      label: e.target.value,
                    })
                  }
                  className="border p-1 rounded"
                />
                <select
                  value={editingCategory.type}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      type: e.target.value,
                    })
                  }
                  className="border p-1 rounded"
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
                <button
                  onClick={handleEditCategory}
                  className="bg-green-500 text-white px-2 py-1 rounded"
                >
                  Save
                </button>
              </>
            ) : (
              <>
                <span>
                  {category.value} - {category.label} ({category.type})
                </span>
                <div>
                  <button
                    onClick={() => setEditingCategory(category)}
                    className="bg-yellow-500 text-white px-2 py-1 rounded mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category._id)}
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

export default CategoryPage;
