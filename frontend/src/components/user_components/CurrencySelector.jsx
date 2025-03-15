import React, { useEffect, useState } from "react";
import Select from "react-select";

const CurrencySelector = ({ value, onChange }) => {
  const [currencyOptions, setCurrencyOptions] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState(value || null);
  const [loading, setLoading] = useState(false); // Loading state for better UX

  // Fetch currency options from the API
  useEffect(() => {
    const fetchCurrencies = async () => {
      const token = localStorage.getItem("token"); // Get the token from localStorage

      try {
        setLoading(true);
        const response = await fetch("http://localhost:5000/api/currency/", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`, // Pass token as Authorization header
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch currencies");
        }

        const data = await response.json();
        const formattedData = data.map((currency) => ({
          value: currency.value,
          label: currency.label,
        }));
        setCurrencyOptions(formattedData);
      } catch (error) {
        console.error("Failed to fetch currencies:", error);
      } finally {
        setLoading(false); // Set loading to false after the request is completed
      }
    };

    fetchCurrencies();
  }, []); // Empty dependency array means this effect runs only once when the component mounts

  const handleChange = (selectedOption) => {
    setSelectedCurrency(selectedOption.value);
    onChange({ target: { name: "currency", value: selectedOption.value } });
  };

  if (loading) {
    return <div>Loading currencies...</div>; // Optional loading state
  }

  return (
    <div>
      <Select
        id="currency"
        name="currency"
        value={currencyOptions.find(
          (currency) => currency.value === selectedCurrency
        )}
        onChange={handleChange}
        options={currencyOptions}
        isSearchable
        placeholder="Select Currency"
      />
    </div>
  );
};

export default CurrencySelector;
