import React, { useState, useEffect } from "react";
import axios from "axios";
import { jsPDF } from "jspdf"; // Import jsPDF for PDF generation

const UserSummaryReport = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch the report data from the backend
  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          "http://localhost:5000/api/report/user-summary-report",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
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
  }, []);

  // Function to generate the PDF report using jsPDF
  // Function to generate the PDF report using jsPDF
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(0, 102, 204);
    doc.text("User Summary Report", 20, 20);

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);

    // Add Report Details Section
    doc.setFontSize(14);
    doc.text("Report Overview", 20, 30);
    doc.setFontSize(12);
    doc.text(`Total Users: ${reportData.totalUsers || 0}`, 20, 40);
    doc.text(`Total Admins: ${reportData.totalAdmins || 0}`, 20, 50);
    doc.text(`Total People: ${reportData.totalPeople || 0}`, 20, 60);

    // Adding Highest and Lowest Currency Count
    doc.text(
      `Highest Currency: ${
        reportData.highestCurrencyCount.currency || "N/A"
      } (${reportData.highestCurrencyCount.count || 0})`,
      20,
      70
    );
    doc.text(
      `Lowest Currency: ${reportData.lowestCurrencyCount.currency || "N/A"} (${
        reportData.lowestCurrencyCount.count || 0
      })`,
      20,
      80
    );

    // Adding Highest and Lowest Country Count
    doc.text(
      `Highest Country: ${reportData.highestCountryCount.country || "N/A"} (${
        reportData.highestCountryCount.count || 0
      })`,
      20,
      90
    );
    doc.text(
      `Lowest Country: ${reportData.lowestCountryCount.country || "N/A"} (${
        reportData.lowestCountryCount.count || 0
      })`,
      20,
      100
    );

    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(20, 110, 190, 110); // Horizontal line to separate sections

    // Add User Details Section
    doc.setFontSize(14);
    doc.text("User Details", 20, 120);

    // Create a table with column headers
    const tableColumns = [
      "Username",
      "Role",
      "Currency",
      "Country",
      "Last Login",
    ];

    let y = 130; // Starting position for the table

    // Header row
    doc.setFontSize(12);
    tableColumns.forEach((col, i) => {
      if (typeof col === "string" && col.length) {
        const x = 20 + i * 30; // Increased spacing between columns
        if (x + col.length * 1.5 < 210) {
          doc.text(col, x, y);
        }
      }
    });

    // Draw a line under the header
    doc.line(20, y + 2, 190, y + 2);

    y += 15; // Increased row height

    // User data rows
    if (Array.isArray(reportData.users)) {
      reportData.users.forEach((user, index) => {
        if (user && typeof user === "object") {
          const rowData = [
            user.username,
            user.role,
            user.currency,
            user.country,
            new Date(user.last_login).toLocaleString(),
          ];

          rowData.forEach((data, i) => {
            const x = 20 + i * 30; // Increased spacing between columns
            if (
              typeof data === "string" &&
              data.length &&
              x + data.length * 1.5 < 210
            ) {
              doc.text(data, x, y);
            }
          });

          y += 15; // Move to the next row with more space between rows

          // Check for page overflow and add a page if needed
          if (y > 270) {
            // If the table exceeds the page height (just before bottom margin)
            doc.addPage(); // Add a new page
            y = 20; // Reset the y position for the new page
            doc.setFontSize(14);
            doc.text("User Details", 20, y); // Add title again on new page
            y += 10; // Adjust for title space
          }
        }
      });
    }

    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(20, y + 2, 190, y + 2); // Final line

    // Download the PDF
    doc.save("user-summary-report.pdf");
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!reportData) {
    return <div>No report data available.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="text-center mb-4">
        <h1 className="text-3xl font-bold text-blue-600">
          User Summary Report
        </h1>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-700">
            Report Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-100 rounded-md shadow-md">
              <h3 className="font-medium text-gray-800">Total Users</h3>
              <p className="text-lg text-gray-600">{reportData.totalUsers}</p>
            </div>

            <div className="p-4 bg-gray-100 rounded-md shadow-md">
              <h3 className="font-medium text-gray-800">Total Admins</h3>
              <p className="text-lg text-gray-600">{reportData.totalAdmins}</p>
            </div>

            <div className="p-4 bg-gray-100 rounded-md shadow-md">
              <h3 className="font-medium text-gray-800">Total People</h3>
              <p className="text-lg text-gray-600">{reportData.totalPeople}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Highest and Lowest Currency/Count */}
            <div className="p-4 bg-gray-100 rounded-md shadow-md">
              <h3 className="font-medium text-gray-800">Highest Currency</h3>
              <p className="text-lg text-gray-600">
                {reportData.highestCurrencyCount.currency} (
                {reportData.highestCurrencyCount.count})
              </p>
            </div>

            <div className="p-4 bg-gray-100 rounded-md shadow-md">
              <h3 className="font-medium text-gray-800">Lowest Currency</h3>
              <p className="text-lg text-gray-600">
                {reportData.lowestCurrencyCount.currency} (
                {reportData.lowestCurrencyCount.count})
              </p>
            </div>

            <div className="p-4 bg-gray-100 rounded-md shadow-md">
              <h3 className="font-medium text-gray-800">Highest Country</h3>
              <p className="text-lg text-gray-600">
                {reportData.highestCountryCount.country} (
                {reportData.highestCountryCount.count})
              </p>
            </div>

            <div className="p-4 bg-gray-100 rounded-md shadow-md">
              <h3 className="font-medium text-gray-800">Lowest Country</h3>
              <p className="text-lg text-gray-600">
                {reportData.lowestCountryCount.country} (
                {reportData.lowestCountryCount.count})
              </p>
            </div>
          </div>

          {/* Displaying the User Table */}
          <h2 className="text-2xl font-semibold text-gray-700 mt-6">
            User Details
          </h2>
          <table className="min-w-full table-auto mt-4">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">Username</th>
                <th className="px-4 py-2 text-left">First Name</th>
                <th className="px-4 py-2 text-left">Last Name</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Role</th>
                <th className="px-4 py-2 text-left">Currency</th>
                <th className="px-4 py-2 text-left">Contact</th>
                <th className="px-4 py-2 text-left">Country</th>
                <th className="px-4 py-2 text-left">Last Login</th>
              </tr>
            </thead>
            <tbody>
              {reportData.users.map((user, index) => (
                <tr key={index}>
                  <td className="border px-4 py-2">{user.username}</td>
                  <td className="border px-4 py-2">{user.firstname}</td>
                  <td className="border px-4 py-2">{user.lastname}</td>
                  <td className="border px-4 py-2">{user.email}</td>
                  <td className="border px-4 py-2">{user.role}</td>
                  <td className="border px-4 py-2">{user.currency}</td>
                  <td className="border px-4 py-2">{user.contact}</td>
                  <td className="border px-4 py-2">{user.country}</td>
                  <td className="border px-4 py-2">
                    {new Date(user.last_login).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 text-center">
        {/* Button to download the report as a PDF */}
        <button
          onClick={handleDownloadPDF}
          className="px-6 py-2 text-white bg-blue-600 rounded-md shadow-md hover:bg-blue-700"
        >
          Download Report as PDF
        </button>
      </div>
    </div>
  );
};

export default UserSummaryReport;
