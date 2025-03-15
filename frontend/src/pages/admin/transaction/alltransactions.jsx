import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { toast } from "react-toastify";

const AllTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const adminCurrency = localStorage.getItem("currency") || "USD";
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("No authentication token found");
        setLoading(false);
        return;
      }

      try {
        const headers = { Authorization: `Bearer ${token}` };

        console.log("Fetching expenses...");
        const expensesRes = await axios.get(
          "http://localhost:5000/api/transaction/expense-transactions",
          { headers, params: { currency: adminCurrency } }
        );

        console.log("Fetching incomes...");
        const incomesRes = await axios.get(
          "http://localhost:5000/api/transaction/income-transactions",
          { headers, params: { currency: adminCurrency } }
        );

        console.log("Expenses response:", expensesRes.data);
        console.log("Incomes response:", incomesRes.data);

        const expenses = expensesRes.data.transactions || [];
        const incomes = incomesRes.data.transactions || [];

        const allTransactions = [
          ...expenses.map((t) => ({ ...t, type: "expense" })),
          ...incomes.map((t) => ({ ...t, type: "income" })),
        ].sort((a, b) => new Date(b.date) - new Date(a.date));

        setTransactions(allTransactions);
      } catch (error) {
        console.error("Error fetching transactions:", error);
        toast.error("Failed to fetch transactions");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [adminCurrency]);

  return (
    <div className="min-h-screen flex flex-col bg-orange-100 p-5">
      <div className="w-full max-w-7xl">
        <div className="flex justify-center relative mb-6">
          <h1 className="text-3xl font-bold text-gray-800 absolute left-1/2 transform -translate-x-1/2">
            All Transactions
          </h1>
          <button
            onClick={() => navigate("/admin/report")}
            className="ml-auto px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
          >
            Report
          </button>
        </div>

        {loading ? (
          <p className="text-center text-gray-700">Loading transactions...</p>
        ) : transactions.length === 0 ? (
          <p className="text-center text-gray-700">No transactions found.</p>
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>User Email</Th>
                <Th>Category</Th>
                <Th>Date</Th>
                <Th>Type</Th>
                <Th>Transaction Currency</Th>
                <Th>Amount</Th>
                <Th>Admin's Currency ({adminCurrency})</Th>
              </Tr>
            </Thead>
            <Tbody>
              {transactions.map((transaction) => (
                <Tr
                  key={transaction._id}
                  className="bg-white shadow-md rounded-lg"
                >
                  <Td className="text-white">{transaction.email}</Td>
                  <Td className="text-white">{transaction.category}</Td>
                  <Td className="text-white">
                    {new Date(transaction.date).toLocaleDateString()}
                  </Td>
                  <Td
                    className={
                      transaction.type === "income"
                        ? "text-green-600 font-bold"
                        : "text-red-600 font-bold"
                    }
                  >
                    {transaction.type.charAt(0).toUpperCase() +
                      transaction.type.slice(1)}
                  </Td>
                  <Td className="text-white">{transaction.currency}</Td>
                  <Td
                    className={
                      transaction.type === "income"
                        ? "text-green-600 font-bold"
                        : "text-red-600 font-bold"
                    }
                  >
                    {transaction.amount.toFixed(2)}
                  </Td>
                  <Td
                    className={
                      transaction.type === "income"
                        ? "text-green-600 font-bold"
                        : "text-red-600 font-bold"
                    }
                  >
                    {transaction.convertedAmount
                      ? Number(transaction.convertedAmount).toFixed(2)
                      : "N/A"}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default AllTransactions;
