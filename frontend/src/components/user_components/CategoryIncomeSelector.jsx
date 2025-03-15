import React, { useEffect, useState } from "react";
import Select from "react-select";
import axios from "axios";

const CategorySelector = ({ value, onChange }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token"); // Retrieve the token from localStorage
      if (!token) {
        setError("User is not authenticated.");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          "http://localhost:5000/api/category/income",
          {
            headers: {
              Authorization: `Bearer ${token}`, // Include the token in the Authorization header
            },
          }
        );
        const fetchedCategories = response.data.map((category) => ({
          value: category.value,
          label: category.label,
        }));
        setCategories(fetchedCategories);
      } catch (error) {
        setError("Failed to fetch categories. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleChange = (selectedOption) => {
    onChange({ target: { name: "category", value: selectedOption.value } });
  };

  if (loading) {
    return <div>Loading categories...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div>
      <label
        htmlFor="category"
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        <span className="text-red-500">*</span> Category
      </label>
      <Select
        id="category"
        name="category"
        value={categories.find((category) => category.value === value)}
        onChange={handleChange}
        options={categories}
        isSearchable
        placeholder="Select Category"
      />
    </div>
  );
};

export default CategorySelector;
