import { useRef, useEffect, useState } from "react";
import axios from "axios";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { toast } from "react-toastify";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import moment from "moment";

const ReportsPage = () => {
  const [reportData, setReportData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    email: "",
    income: "",
    maxIncome: "",
    expense: "",
    maxExpense: "",
    month: "",
  });
  const adminCurrency = localStorage.getItem("currency") || "USD";
  const chartRef = useRef(null);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("No authentication token found");
        setLoading(false);
        return;
      }

      try {
        const headers = { Authorization: `Bearer ${token}` };
        const response = await axios.get(
          "http://localhost:5000/api/report/reports",
          {
            headers,
            params: { currency: adminCurrency },
          }
        );

        if (response.data.success) {
          setReportData(response.data.report);
          setFilteredData(response.data.report);
          setTotalIncome(response.data.totalIncome);
          setTotalExpense(response.data.totalExpense);
        }
      } catch (error) {
        console.error("Error fetching reports:", error);
        toast.error("Failed to fetch reports");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [adminCurrency]);

  useEffect(() => {
    console.log("Raw Report Data:", reportData);

    const filtered = reportData.filter((user) => {
      const matchesEmail = filters.email
        ? user.email.includes(filters.email)
        : true;
      const matchesIncome = filters.income
        ? user.totalIncome >= parseFloat(filters.income)
        : true;
      const matchesExpense = filters.expense
        ? user.totalExpense >= parseFloat(filters.expense)
        : true;

      const userHasValidTransactions = user.transactions?.some((t) =>
        moment(t.date, moment.ISO_8601, true).isValid()
      );

      console.log(
        `Filtering User: ${user.email}, Has Transactions: ${userHasValidTransactions}`
      );

      const matchesMonth = filters.month
        ? user.transactions?.some(
            (t) =>
              moment(t.date, moment.ISO_8601, true).isValid() &&
              moment(t.date).format("YYYY-MM") === filters.month
          )
        : true;

      const matchesMaxIncome = filters.maxIncome
        ? user.totalIncome <= parseFloat(filters.maxIncome)
        : true;
      const matchesMaxExpense = filters.maxExpense
        ? user.totalExpense <= parseFloat(filters.maxExpense)
        : true;

      return (
        matchesEmail &&
        matchesIncome &&
        matchesMaxIncome &&
        matchesExpense &&
        matchesMaxExpense &&
        matchesMonth
      );
    });

    console.log("Filtered Data:", filtered);
    setFilteredData(filtered); // Keep user-level data for table

    // Generate chart data separately
    const monthlyData = {};
    filtered.forEach((user) => {
      user.transactions?.forEach((t) => {
        if (moment(t.date, moment.ISO_8601, true).isValid()) {
          const month = moment(t.date).format("YYYY-MM");

          if (!monthlyData[month]) {
            monthlyData[month] = { month, totalIncome: 0, totalExpense: 0 };
          }

          if (t.type === "income") {
            monthlyData[month].totalIncome += parseFloat(t.amount);
          } else if (t.type === "expense") {
            monthlyData[month].totalExpense += parseFloat(t.amount);
          }
        }
      });
    });

    console.log("setChartData function:", setChartData);
    setChartData(Object.values(monthlyData)); // Ensure the chart gets separate processed data
  }, [filters, reportData]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const generatePDF = async () => {
    const doc = new jsPDF();
    doc.text("User Financial Report", 14, 10);

    autoTable(doc, {
      startY: 20,
      head: [
        [
          "User Email",
          "Total Income",
          "Income Entries",
          "Highest Income",
          "Total Expense",
          "Expense Entries",
          "Highest Expense",
          "Grand Total",
        ],
      ],
      body: filteredData.map((user) => [
        user.email,
        `${user.totalIncome} ${adminCurrency}`,
        user.incomeEntries,
        user.highestIncome
          ? `${user.highestIncome.amount} (${user.highestIncome.category})`
          : "N/A",
        `${user.totalExpense} ${adminCurrency}`,
        user.expenseEntries,
        user.highestExpense
          ? `${user.highestExpense.amount} (${user.highestExpense.category})`
          : "N/A",
        `${(user.totalIncome - user.totalExpense).toFixed(2)} ${adminCurrency}`,
      ]),
    });

    if (chartRef.current) {
      const canvas = await html2canvas(chartRef.current);
      const imgData = canvas.toDataURL("image/png");
      doc.addPage();
      doc.text("Income & Expense Chart", 14, 10);
      doc.addImage(imgData, "PNG", 10, 20, 180, 100);
    }

    doc.save("Financial_Report.pdf");
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-yellow-50 p-5">
      <div className="w-full max-w-7xl">
        <div className="flex justify-between items-center mb-4 ">
          <h1 className="text-3xl font-bold text-gray-800 mb-10 ml-96">
            User Financial Reports
          </h1>
          <button
            onClick={generatePDF}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Generate PDF Report
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-12">
          <input
            type="text"
            name="email"
            placeholder="Filter by Email"
            className="p-2 border-2 border-black rounded "
            onChange={handleFilterChange}
          />
          <input
            type="number"
            name="income"
            placeholder="Min Income"
            className="p-2 border-2 border-black rounded"
            onChange={handleFilterChange}
          />
          <input
            type="number"
            name="expense"
            placeholder="Min Expense"
            className="p-2 border-2 border-black rounded"
            onChange={handleFilterChange}
          />
          <input
            type="month"
            name="month"
            className="p-2 border-2 border-black rounded"
            onChange={handleFilterChange}
          />

          <input
            type="number"
            name="maxIncome"
            placeholder="Max Income"
            className="p-2 border-2 border-black rounded"
            onChange={handleFilterChange}
          />
          <input
            type="number"
            name="maxExpense"
            placeholder="Max Expense"
            className="p-2 border-2 border-black rounded"
            onChange={handleFilterChange}
          />
        </div>

        {loading ? (
          <p className="text-center text-gray-700">Loading reports...</p>
        ) : (
          <>
            <Table>
              <Thead>
                <Tr>
                  <Th>User Email</Th>
                  <Th>Total Income ({adminCurrency})</Th>
                  <Th>Income Entries</Th>
                  <Th>Highest Income (Category)</Th>
                  <Th>Total Expense ({adminCurrency})</Th>
                  <Th>Expense Entries</Th>
                  <Th>Highest Expense (Category)</Th>
                  <Th>Grand Total ({adminCurrency})</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredData.map((user) => (
                  <Tr
                    key={user.email}
                    className="bg-white shadow-md rounded-lg"
                  >
                    <Td className="text-white">{user.email}</Td>
                    <Td className="text-green-600 font-bold">
                      {user.totalIncome}
                    </Td>
                    <Td className="text-white text-center">
                      {user.incomeEntries}
                    </Td>
                    <Td className="text-white">
                      {user.highestIncome
                        ? `${user.highestIncome.amount} (${user.highestIncome.category})`
                        : "N/A"}
                    </Td>
                    <Td className="text-red-600 font-bold">
                      {user.totalExpense}
                    </Td>
                    <Td className="text-white text-center">
                      {user.expenseEntries}
                    </Td>
                    <Td className="text-white">
                      {user.highestExpense
                        ? `${user.highestExpense.amount} (${user.highestExpense.category})`
                        : "N/A"}
                    </Td>
                    <Td
                      className={`font-bold ${
                        user.totalIncome - user.totalExpense >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {(user.totalIncome - user.totalExpense).toFixed(2)}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            <div
              ref={chartRef}
              className="mt-6 p-4 bg-white shadow-md rounded-lg"
            >
              <h2 className="text-xl font-bold text-gray-800 text-center mb-4">
                Income & Expense Per Month
              </h2>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData}>
                  <XAxis
                    dataKey="month"
                    tickFormatter={(tick) =>
                      moment(tick, "YYYY-MM").format("MMMM YYYY")
                    }
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="totalIncome"
                    fill="#22c55e"
                    name="Total Income"
                  />
                  <Bar
                    dataKey="totalExpense"
                    fill="#ef4444"
                    name="Total Expense"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
