import React, { useState, useEffect } from "react";
import { goalsApi } from "../services/goalService";
import { format } from "date-fns";
import { SavingsGoalChart } from "../components/DashboardGraphs";

const SavingsGoals = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentGoal, setCurrentGoal] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    target_amount: "",
    current_amount: "",
    target_date: "",
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [allocateModalOpen, setAllocateModalOpen] = useState(false);
  const [allocateData, setAllocateData] = useState({
    amount: "",
    goal_id: "",
  });
  const [celebrationGoal, setCelebrationGoal] = useState(null);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const response = await goalsApi.getGoals();

      // Format and transform the data
      const formattedGoals = response.data.data.map((goal) => ({
        ...goal,
        formattedTargetDate: format(new Date(goal.TARGET_DATE), "yyyy-MM-dd"),
        percentComplete: Math.round(
          (goal.CURRENT_AMOUNT / goal.TARGET_AMOUNT) * 100
        ),
      }));

      setGoals(formattedGoals);
    } catch (err) {
      console.error("Error fetching goals:", err);
      setError("Failed to load savings goals");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (goal = null) => {
    if (goal) {
      setFormData({
        name: goal.NAME,
        target_amount: goal.TARGET_AMOUNT,
        current_amount: goal.CURRENT_AMOUNT,
        target_date: format(new Date(goal.TARGET_DATE), "yyyy-MM-dd"),
      });
      setCurrentGoal(goal);
    } else {
      setFormData({
        name: "",
        target_amount: "",
        current_amount: "",
        target_date: format(
          new Date().setMonth(new Date().getMonth() + 1),
          "yyyy-MM-dd"
        ),
      });
      setCurrentGoal(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setError(null);
  };

  const handleOpenAllocateModal = (goal = null) => {
    // If no goals exist at all, show error message
    if (goals.length === 0) {
      setError("You need to create at least one goal before allocating funds");
      return;
    }

    // If a specific goal is provided and it's completed, show error
    if (goal && goal.IS_COMPLETED === 1) {
      setError("Cannot allocate funds to a completed goal");
      return;
    }

    // Check if all goals are completed
    const incompleteGoals = goals.filter((g) => g.IS_COMPLETED !== 1);
    if (incompleteGoals.length === 0) {
      setError("All goals are completed! Create a new goal to allocate funds.");
      return;
    }

    setAllocateData({
      amount: "",
      goal_id: goal ? goal.GOAL_ID : "",
    });
    setAllocateModalOpen(true);
  };

  const handleCloseAllocateModal = () => {
    setAllocateModalOpen(false);
    setError(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAllocateInputChange = (e) => {
    const { name, value } = e.target;
    setAllocateData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentGoal) {
        const response = await goalsApi.updateGoal(
          currentGoal.GOAL_ID,
          formData
        );
        if (response.data.isNewlyCompleted) {
          setCelebrationGoal(response.data.data);
        }
        setSuccess("Goal updated successfully");
      } else {
        await goalsApi.createGoal(formData);
        setSuccess("New goal created successfully");
      }
      handleCloseModal();
      fetchGoals();
    } catch (err) {
      console.error("Error saving goal:", err);
      setError(err.response?.data?.message || "Failed to save goal");
    }
  };

  const handleAllocate = async (e) => {
    e.preventDefault();
    try {
      const response = await goalsApi.allocateToGoal(allocateData);

      if (response.data.isNewlyCompleted) {
        setCelebrationGoal(response.data.data);
      }

      handleCloseAllocateModal();
      setSuccess("Funds allocated successfully");
      fetchGoals();
    } catch (err) {
      console.error("Error allocating funds:", err);
      setError(err.response?.data?.message || "Failed to allocate funds");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this savings goal?")) {
      return;
    }

    try {
      await goalsApi.deleteGoal(id);
      setSuccess("Goal deleted successfully");
      fetchGoals();
    } catch (err) {
      console.error("Error deleting goal:", err);
      setError("Failed to delete goal");
    }
  };

  // Clear notifications after 3 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Auto-close celebration after 5 seconds
  useEffect(() => {
    if (celebrationGoal) {
      const timer = setTimeout(() => {
        setCelebrationGoal(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [celebrationGoal]);

  // Process goals data for chart
  const getChartData = () => {
    return goals.map((goal) => ({
      goal: goal.NAME,
      percentComplete: goal.percentComplete || 0,
      target: goal.TARGET_AMOUNT,
      current: goal.CURRENT_AMOUNT,
    }));
  };

  if (loading && goals.length === 0) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Savings Goals
        </h1>
        <div className="flex space-x-3">
          {goals.length > 0 ? (
            <button
              onClick={() => handleOpenAllocateModal()}
              className="btn btn-secondary"
            >
              Allocate Funds
            </button>
          ) : (
            <button
              onClick={() =>
                setError(
                  "You need to create at least one goal before allocating funds"
                )
              }
              className="btn btn-secondary opacity-50 cursor-not-allowed"
              disabled
            >
              Allocate Funds
            </button>
          )}
          <button onClick={() => handleOpenModal()} className="btn btn-primary">
            Create New Goal
          </button>
        </div>
      </div>

      {/* Success and Error Messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md">
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md">
          <p>{success}</p>
        </div>
      )}

      {/* Goal Achievement Celebration */}
      {celebrationGoal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md text-center shadow-lg relative animate-bounce">
            <button
              onClick={() => setCelebrationGoal(null)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              &times;
            </button>
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Congratulations!
            </h2>
            <p className="text-lg mb-2 text-gray-700 dark:text-gray-300">
              You've achieved your savings goal:
            </p>
            <p className="text-xl font-bold mb-4 text-primary-600 dark:text-primary-400">
              {celebrationGoal.NAME}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              Target: Rs.{" "}
              {parseInt(celebrationGoal.TARGET_AMOUNT).toLocaleString()}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              Saved: Rs.{" "}
              {parseInt(celebrationGoal.CURRENT_AMOUNT).toLocaleString()}
            </p>
            <button
              className="mt-6 btn btn-primary"
              onClick={() => setCelebrationGoal(null)}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Goals Chart */}
      {goals.length > 0 && (
        <div className="h-96 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <SavingsGoalChart data={getChartData()} />
        </div>
      )}

      {/* Goals List */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        {goals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Goal Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Progress
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Target Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {goals.map((goal) => (
                  <tr key={goal.GOAL_ID}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {goal.NAME}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-48 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mr-2">
                          <div
                            className={`h-2.5 rounded-full ${
                              goal.percentComplete >= 100
                                ? "bg-green-500"
                                : goal.percentComplete >= 50
                                ? "bg-blue-500"
                                : "bg-yellow-500"
                            }`}
                            style={{
                              width: `${Math.min(goal.percentComplete, 100)}%`,
                            }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {`${goal.percentComplete}% (Rs. ${parseInt(
                            goal.CURRENT_AMOUNT
                          ).toLocaleString()} / Rs. ${parseInt(
                            goal.TARGET_AMOUNT
                          ).toLocaleString()})`}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(goal.TARGET_DATE), "MMM d, yyyy")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {goal.IS_COMPLETED === 1 ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                          Completed
                        </span>
                      ) : new Date(goal.TARGET_DATE) < new Date() ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100">
                          Overdue
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                          In Progress
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {goal.IS_COMPLETED === 1 ? (
                        <button
                          onClick={() =>
                            setError(
                              "Cannot allocate funds to a completed goal"
                            )
                          }
                          className="text-gray-400 cursor-not-allowed"
                          title="Goal is already completed"
                        >
                          Allocate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenAllocateModal(goal)}
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                          Allocate
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenModal(goal)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(goal.GOAL_ID)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
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
          <div className="py-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
              No savings goals yet
            </h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Get started by creating a new savings goal.
            </p>
            <div className="mt-6">
              <button
                onClick={() => handleOpenModal()}
                className="btn btn-primary"
              >
                Create Goal
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Goal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              {currentGoal ? "Edit Savings Goal" : "Create New Savings Goal"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
                  htmlFor="name"
                >
                  Goal Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div className="mb-4">
                <label
                  className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
                  htmlFor="target_amount"
                >
                  Target Amount (Rs.)
                </label>
                <input
                  type="number"
                  id="target_amount"
                  name="target_amount"
                  value={formData.target_amount}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  min="0"
                  step="1"
                  required
                />
              </div>
              <div className="mb-4">
                <label
                  className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
                  htmlFor="current_amount"
                >
                  Current Amount (Rs.)
                </label>
                <input
                  type="number"
                  id="current_amount"
                  name="current_amount"
                  value={formData.current_amount}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  min="0"
                  step="1"
                />
              </div>
              <div className="mb-4">
                <label
                  className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
                  htmlFor="target_date"
                >
                  Target Date
                </label>
                <input
                  type="date"
                  id="target_date"
                  name="target_date"
                  value={formData.target_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {currentGoal ? "Update Goal" : "Create Goal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Allocate Funds Modal */}
      {allocateModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Allocate Funds
            </h2>
            <form onSubmit={handleAllocate}>
              <div className="mb-4">
                <label
                  className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
                  htmlFor="amount"
                >
                  Amount (Rs.)
                </label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={allocateData.amount}
                  onChange={handleAllocateInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  min="0"
                  step="1"
                  required
                />
              </div>
              <div className="mb-4">
                <label
                  className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
                  htmlFor="goal_id"
                >
                  Goal
                </label>
                <select
                  id="goal_id"
                  name="goal_id"
                  value={allocateData.goal_id}
                  onChange={handleAllocateInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">
                    Auto-allocate to first incomplete goal
                  </option>
                  {goals
                    .filter((goal) => goal.IS_COMPLETED !== 1)
                    .map((goal) => (
                      <option key={goal.GOAL_ID} value={goal.GOAL_ID}>
                        {goal.NAME} - Rs.{" "}
                        {parseInt(goal.CURRENT_AMOUNT).toLocaleString()} / Rs.{" "}
                        {parseInt(goal.TARGET_AMOUNT).toLocaleString()}
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseAllocateModal}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Allocate Funds
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavingsGoals;
