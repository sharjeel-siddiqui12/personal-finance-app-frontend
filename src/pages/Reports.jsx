import React, { useState, useEffect } from "react";
import { reportsApi } from "../services/api";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
];

const Reports = () => {
  const [dateRange, setDateRange] = useState(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 3); // Look back 3 months

    return {
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
    };
  });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeReportType, setActiveReportType] = useState("monthly");

  // Fix the monthly report API call - replace the fetchReportData function

  // Replace the fetchReportData function

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Log the retrieval attempt
      console.log(`Fetching report data for ${activeReportType} type`);

      let response;
      if (activeReportType === "monthly") {
        const today = new Date();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const year = today.getFullYear();
        console.log(`Fetching monthly report for ${month}/${year}`);
        response = await reportsApi.getMonthly(month, year);
      } else {
        console.log(
          `Fetching custom date range report from ${dateRange.startDate} to ${dateRange.endDate}`
        );
        response = await reportsApi.getByDateRange(
          dateRange.startDate,
          dateRange.endDate
        );
      }

      console.log("API Response:", response);

      // Process the data with case-insensitive property access
      if (response?.data) {
        // Extract the actual data (check both .data.data and .data formats)
        const rawData = response.data.data || response.data;
        console.log("Raw data:", rawData);

        // Standardize data structure to handle case sensitivity
        const transformedData = {
          summary: {
            totalIncome: getNumericValue(
              rawData.summary,
              "totalIncome",
              "TOTALINCOME"
            ),
            totalExpense: getNumericValue(
              rawData.summary,
              "totalExpense",
              "TOTALEXPENSE"
            ),
            netSavings: getNumericValue(
              rawData.summary,
              "netSavings",
              "NETSAVINGS"
            ),
          },
          transactions: Array.isArray(rawData.transactions)
            ? rawData.transactions
            : [],
          expensesByCategory: transformExpensesByCategory(rawData),
          incomeVsExpense: transformIncomeVsExpense(rawData),
          period: rawData.period || {
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
          },
        };

        console.log("Transformed data:", transformedData);
        setReportData(transformedData);
      } else {
        console.error("Invalid API response format:", response);
        throw new Error("Invalid response format from API");
      }
    } catch (err) {
      console.error("Error fetching report data:", err);
      setError(
        "Failed to load report data: " + (err.message || "Unknown error")
      );
    } finally {
      setLoading(false);
    }
  };

  // Improved helper functions for data extraction
  const getNumericValue = (obj, ...keys) => {
    if (!obj) return 0;

    for (const key of keys) {
      // Try exact match
      if (obj[key] !== undefined) {
        return Number(obj[key]) || 0;
      }

      // Try case-insensitive match
      const lowerKey = key.toLowerCase();
      const upperKey = key.toUpperCase();

      for (const objKey of Object.keys(obj)) {
        if (objKey.toLowerCase() === lowerKey) {
          return Number(obj[objKey]) || 0;
        }
      }
    }

    return 0;
  };

  // Transform expenses by category data
  const transformExpensesByCategory = (rawData) => {
    const expenseKey = findKey(
      rawData,
      "expensesByCategory",
      "EXPENSESBYCATEGORY"
    );
    const rawExpenses = rawData[expenseKey] || [];

    if (!Array.isArray(rawExpenses) || rawExpenses.length === 0) {
      return [];
    }

    return rawExpenses.map((item) => ({
      category: findValue(item, "category", "CATEGORY"),
      amount: Number(findValue(item, "amount", "AMOUNT")) || 0,
    }));
  };

  // Transform income vs expense data
  const transformIncomeVsExpense = (rawData) => {
    const ivseKey = findKey(rawData, "incomeVsExpense", "INCOMEVSEXPENSE");
    const rawIvsE = rawData[ivseKey] || [];

    if (!Array.isArray(rawIvsE) || rawIvsE.length === 0) {
      return [];
    }

    return rawIvsE.map((item) => ({
      date: findValue(item, "date", "DATE"),
      income: Number(findValue(item, "income", "INCOME")) || 0,
      expense: Number(findValue(item, "expense", "EXPENSE")) || 0,
    }));
  };

  // Find key in object ignoring case
  const findKey = (obj, ...keys) => {
    if (!obj) return null;

    for (const key of keys) {
      if (obj[key] !== undefined) return key;

      const lowerKey = key.toLowerCase();
      const objKeys = Object.keys(obj);

      for (const objKey of objKeys) {
        if (objKey.toLowerCase() === lowerKey) {
          return objKey;
        }
      }
    }

    return keys[0]; // Default to first key if not found
  };

  // Find value in object with multiple possible keys
  const findValue = (obj, ...keys) => {
    if (!obj) return null;

    for (const key of keys) {
      if (obj[key] !== undefined) return obj[key];

      const lowerKey = key.toLowerCase();
      const objKeys = Object.keys(obj);

      for (const objKey of objKeys) {
        if (objKey.toLowerCase() === lowerKey) {
          return obj[objKey];
        }
      }
    }

    return null;
  };

  // Helper function to get property value case-insensitively
  const getPropertyValue = (obj, propName) => {
    if (!obj) return null;

    // Direct match
    if (obj[propName] !== undefined) return obj[propName];

    // Try uppercase
    if (obj[propName.toUpperCase()] !== undefined)
      return obj[propName.toUpperCase()];

    // Try lowercase
    if (obj[propName.toLowerCase()] !== undefined)
      return obj[propName.toLowerCase()];

    return null;
  };

  useEffect(() => {
    fetchReportData();
  }, [activeReportType]);

  // Fix the handleDownload function by replacing the date formatting

  const handleDownload = async (format) => {
    try {
      setLoading(true);

      // Get current date for filename in YYYY-MM-DD format
      const today = new Date();
      const formattedDate = today.toISOString().split("T")[0]; // Simple YYYY-MM-DD format

      // Get date range params - either currently selected range or current month for monthly reports
      let startDate = dateRange.startDate;
      let endDate = dateRange.endDate;

      if (activeReportType === "monthly") {
        // Use same dates as monthly report
        const today = new Date();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const year = today.getFullYear();
        startDate = `${year}-${month}-01`;

        // Last day of month
        const lastDay = new Date(year, month, 0).getDate();
        endDate = `${year}-${month}-${lastDay}`;
      }

      if (format === "pdf") {
        const response = await reportsApi.downloadPdf(startDate, endDate);

        // Create a download link
        const url = window.URL.createObjectURL(
          new Blob([response.data], { type: "application/pdf" })
        );
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `financial_report_${formattedDate}.pdf`);
        document.body.appendChild(link);
        link.click();

        // Cleanup
        window.URL.revokeObjectURL(url);
        link.remove();
      } else if (format === "csv") {
        const response = await reportsApi.downloadCsv(startDate, endDate);

        // Create a download link
        const url = window.URL.createObjectURL(
          new Blob([response.data], { type: "text/csv" })
        );
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `financial_report_${formattedDate}.csv`);
        document.body.appendChild(link);
        link.click();

        // Cleanup
        window.URL.revokeObjectURL(url);
        link.remove();
      }
    } catch (err) {
      console.error(`Error downloading ${format} report:`, err);
      setError(`Failed to download ${format.toUpperCase()} report`);
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGenerateReport = (e) => {
    e.preventDefault();
    fetchReportData();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Financial Reports
      </h1>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            className={`px-4 py-2 rounded-md ${
              activeReportType === "monthly"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
            }`}
            onClick={() => setActiveReportType("monthly")}
          >
            Monthly Report
          </button>
          <button
            className={`px-4 py-2 rounded-md ${
              activeReportType === "custom"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
            }`}
            onClick={() => setActiveReportType("custom")}
          >
            Custom Date Range
          </button>
        </div>

        {activeReportType === "custom" && (
          <form onSubmit={handleGenerateReport} className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="label">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={dateRange.startDate}
                  onChange={handleDateRangeChange}
                  className="input"
                  required
                />
              </div>
              <div>
                <label htmlFor="endDate" className="label">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={dateRange.endDate}
                  onChange={handleDateRangeChange}
                  className="input"
                  required
                />
              </div>
            </div>
            <div className="mt-4">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "Generating..." : "Generate Report"}
              </button>
            </div>
          </form>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md">
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : reportData && reportData.summary ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Income
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  Rs. {reportData.summary.totalIncome?.toFixed(2) || "0.00"}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Expenses
                </p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  Rs. {reportData.summary.totalExpense?.toFixed(2) || "0.00"}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Net Savings
                </p>
                <p
                  className={`text-2xl font-bold ${
                    (reportData.summary.netSavings || 0) >= 0
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  Rs. {reportData.summary.netSavings?.toFixed(2) || "0.00"}
                </p>
              </div>
            </div>

            {/* Data Debug - Uncomment to see available data */}
            {/* <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded my-4 overflow-auto max-h-40 text-xs">
  <pre>{JSON.stringify(reportData, null, 2)}</pre>
</div> */}

            {/* Charts section with improved container styling */}
            {/* Charts section with improved container styling and data validation */}
            {reportData?.incomeVsExpense?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* Income vs Expense Chart */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 h-80">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                    Income vs. Expenses
                  </h3>
                  <div style={{ height: "calc(100% - 32px)" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={reportData.incomeVsExpense}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => [
                            `Rs. ${value.toLocaleString()}`,
                            undefined,
                          ]}
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #ccc",
                          }}
                        />
                        <Legend />
                        <Bar dataKey="income" name="Income" fill="#4ade80" />
                        <Bar dataKey="expense" name="Expense" fill="#f87171" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Expense by Category Chart */}
                {reportData.expensesByCategory?.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 h-80">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                      Expenses by Category
                    </h3>
                    <div style={{ height: "calc(100% - 32px)" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={reportData.expensesByCategory}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius="70%"
                            dataKey="amount"
                            nameKey="category"
                            label={({ name, percent }) =>
                              `${name} ${(percent * 100).toFixed(0)}%`
                            }
                          >
                            {reportData.expensesByCategory.map(
                              (entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              )
                            )}
                          </Pie>
                          <Tooltip
                            formatter={(value) => [
                              `Rs. ${value.toLocaleString()}`,
                              "Amount",
                            ]}
                            contentStyle={{
                              backgroundColor: "white",
                              border: "1px solid #ccc",
                            }}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 my-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">
                  No transaction data available for the selected period
                </p>
              </div>
            )}
            {/* Rest of charts with similar null checks... */}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => handleDownload("pdf")}
                className="btn btn-secondary flex items-center"
                disabled={loading}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download PDF
              </button>
              <button
                onClick={() => handleDownload("csv")}
                className="btn btn-secondary flex items-center"
                disabled={loading}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download CSV
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              Generate a report to view your financial data
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
