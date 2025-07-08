import React, { useState, useEffect } from "react";
import { budgetsApi, categoriesApi } from "../services/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const Budgets = () => {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentBudget, setCurrentBudget] = useState(null);
  const [formData, setFormData] = useState({
    category_id: "",
    amount: "",
    period: "monthly",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [budgetsResponse, categoriesResponse] = await Promise.all([
        budgetsApi.getAll(),
        categoriesApi.getAll(),
      ]);

      // Transform budgets data to handle Oracle's uppercase property names
      const transformedBudgets = (budgetsResponse.data.data || []).map(
        (budget) => ({
          id: budget.BUDGET_ID || budget.budget_id,
          category_id: budget.CATEGORY_ID || budget.category_id,
          amount: budget.AMOUNT || budget.amount,
          actual: budget.ACTUAL || budget.actual || 0,
          start_date: budget.START_DATE || budget.start_date,
          end_date: budget.END_DATE || budget.end_date,
          category_name: budget.CATEGORY_NAME || budget.category_name,
          category_type: budget.CATEGORY_TYPE || budget.category_type,
        })
      );

      // Transform categories data to handle Oracle's uppercase property names
      const transformedCategories = (categoriesResponse.data.data || []).map(
        (category) => ({
          id: category.CATEGORY_ID || category.category_id,
          name: category.NAME || category.name,
          type: (category.TYPE || category.type || "").toLowerCase(),
          user_id: category.USER_ID || category.user_id,
        })
      );

      // Filter for expense categories only
      const expenseCategories = transformedCategories.filter(
        (c) => c.type === "expense"
      );

      setBudgets(transformedBudgets);
      setCategories(expenseCategories);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(
        "Failed to load budgets data: " + (err.message || "Unknown error")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (budget = null) => {
    if (budget) {
      setFormData({
        category_id: budget.category_id,
        amount: budget.amount,
        period: budget.period || "monthly",
      });
      setCurrentBudget(budget);
    } else {
      setFormData({
        category_id: "",
        amount: "",
        period: "monthly",
      });
      setCurrentBudget(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentBudget(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);

      // Calculate start_date (today) and end_date based on period
      const today = new Date();
      const startDate = today.toISOString().split("T")[0]; // YYYY-MM-DD format

      // Calculate end date based on period
      let endDate = new Date(today);
      switch (formData.period) {
        case "weekly":
          endDate.setDate(today.getDate() + 7);
          break;
        case "monthly":
          endDate.setMonth(today.getMonth() + 1);
          break;
        case "yearly":
          endDate.setFullYear(today.getFullYear() + 1);
          break;
        default:
          endDate.setMonth(today.getMonth() + 1);
      }

      const payload = {
        category_id: formData.category_id,
        amount: parseFloat(formData.amount),
        period: formData.period,
        start_date: startDate,
        end_date: endDate.toISOString().split("T")[0],
      };

      console.log("Creating/updating budget with payload:", payload);

      if (currentBudget) {
        await budgetsApi.update(currentBudget.id, payload);
        setSuccessMessage("Budget updated successfully");
      } else {
        await budgetsApi.create(payload);
        setSuccessMessage("Budget created successfully");
      }

      handleCloseModal();
      fetchData();
    } catch (err) {
      console.error("Error submitting budget:", err);
      if (err.response?.data?.message?.includes("Budget amount")) {
        setError(err.response.data.message);
      } else {
        setError(err.message || "Failed to save budget");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this budget?")) {
      return;
    }

    try {
      setLoading(true);
      await budgetsApi.delete(id);
      setSuccessMessage("Budget deleted successfully");
      fetchData();
    } catch (err) {
      console.error("Error deleting budget:", err);
      setError("Failed to delete budget");
    }
  };

  // Clear messages after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Prepare chart data
  const chartData = budgets.map((budget) => {
    const category = categories.find((c) => c.id === budget.category_id);
    const actual = budget.actual || 0;
    return {
      name: category?.name || "Unknown",
      budget: parseFloat(budget.amount),
      actual: parseFloat(actual),
      utilization: Math.round(
        (parseFloat(actual) / parseFloat(budget.amount)) * 100
      ),
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Budget Management
        </h1>
        <button
          onClick={() => handleOpenModal()}
          className="btn btn-primary flex items-center"
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
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Add Budget
        </button>
      </div>
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md">
          <p>{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative">
          <span className="block sm:inline">{error}</span>
          <button
            onClick={() => setError("")}
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            aria-label="Close"
          >
            <svg
              className="h-5 w-5 text-red-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      )}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Budget Graph */}
          {budgets.length > 0 && (
            <div className="card h-80 bg-gray-100 dark:bg-gray-800">
              <h3 className="text-lg font-semibold mb-4">
                Budget vs. Actual Spending
              </h3>
              <ResponsiveContainer width="100%" height="85%">
                <BarChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [
                      `Rs. ${value.toLocaleString()}`,
                      undefined,
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="budget" name="Budget" fill="#60a5fa" />
                  <Bar dataKey="actual" name="Actual" fill="#f87171" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Budget List */}
          {budgets.length === 0 ? (
            <div className="text-center py-10">
              <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">
                No budgets found
              </h3>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                Create your first budget to start tracking your expenses
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Category
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Budget
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Actual
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Utilization
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {budgets.map((budget) => {
                    const category = categories.find(
                      (c) => c.id === budget.category_id
                    );
                    const actual = budget.actual || 0;
                    const utilization =
                      (parseFloat(actual) / parseFloat(budget.amount)) * 100;
                    const utilizationClass =
                      utilization > 100
                        ? "text-red-600 dark:text-red-400"
                        : utilization > 80
                        ? "text-yellow-600 dark:text-yellow-400"
                        : "text-green-600 dark:text-green-400";

                    return (
                      <tr
                        key={budget.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-500"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                          {category?.name || "Unknown"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                          Rs. {parseFloat(budget.amount).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                          Rs. {parseFloat(actual).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span
                              className={`text-sm font-medium ${utilizationClass}`}
                            >
                              {utilization.toFixed(0)}%
                            </span>
                            <div className="ml-2 w-24 bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                              <div
                                className={`h-2.5 rounded-full ${
                                  utilization > 100
                                    ? "bg-red-600"
                                    : utilization > 80
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                                }`}
                                style={{
                                  width: `${Math.min(utilization, 100)}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleOpenModal(budget)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(budget.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              {currentBudget ? "Edit Budget" : "Add Budget"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="category_id" className="label">
                  Category
                </label>
                <select
                  id="category_id"
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  className="input"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="amount" className="label">
                  Budget Amount
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">Rs. </span>
                  </div>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    step="0.01"
                    min="0.01"
                    value={formData.amount}
                    onChange={handleChange}
                    className="input pl-7"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="period" className="label">
                  Period
                </label>
                <select
                  id="period"
                  name="period"
                  value={formData.period}
                  onChange={handleChange}
                  className="input"
                  required
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Saving...
                    </>
                  ) : currentBudget ? (
                    "Update Budget"
                  ) : (
                    "Add Budget"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Budgets;
