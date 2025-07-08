import React, { useState, useEffect } from "react";
import { usersApi, dashboardApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import {
  PieChart,
  Pie,
  LineChart,
  Line,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
];

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("users");
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionInProgress, setActionInProgress] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [usersResponse, statsResponse] = await Promise.all([
          usersApi.getAllUsers(),
          dashboardApi.getStats(),
        ]);

        if (usersResponse && usersResponse.data && usersResponse.data.success) {
          setUsers(usersResponse.data.data || []);
        } else {
          console.error("Failed to fetch users:", usersResponse);
          setUsers([]);
          setError((prev) =>
            prev
              ? `${prev}, Failed to load user data`
              : "Failed to load user data"
          );
        }

        // Log the stats response to help debug
        console.log("Stats Response:", statsResponse);

        if (statsResponse && statsResponse.data && statsResponse.data.success) {
          // Normalize the stats object to ensure consistent property naming
          const rawStats = statsResponse.data.data || {};
          const normalizedStats = {
            totalUsers:
              rawStats.total_users ||
              rawStats.TOTAL_USERS ||
              rawStats.totalUsers ||
              0,
            totalTransactions:
              rawStats.total_transactions ||
              rawStats.TOTAL_TRANSACTIONS ||
              rawStats.totalTransactions ||
              0,
            activeBudgets:
              rawStats.active_budgets ||
              rawStats.ACTIVE_BUDGETS ||
              rawStats.activeBudgets ||
              0,
            systemHealth:
              rawStats.system_health ||
              rawStats.SYSTEM_HEALTH ||
              rawStats.systemHealth ||
              "warning",
            userGrowth: Array.isArray(rawStats.userGrowth)
              ? rawStats.userGrowth
              : Array.isArray(rawStats.user_growth)
              ? rawStats.user_growth
              : [],
            transactionDistribution: Array.isArray(
              rawStats.transactionDistribution
            )
              ? rawStats.transactionDistribution
              : Array.isArray(rawStats.transaction_distribution)
              ? rawStats.transaction_distribution
              : [],
            systemPerformance: rawStats.systemPerformance ||
              rawStats.system_performance || {
                cpuUsage: 0,
                memoryUsage: 0,
                diskUsage: 0,
                databaseSize: 0,
                avgResponseTime: 0,
              },
          };

          setStats(normalizedStats);
          console.log("Normalized Stats:", normalizedStats);
        } else {
          console.error("Failed to fetch stats:", statsResponse);
          setStats(null);
          setError((prev) =>
            prev
              ? `${prev}, Failed to load statistics`
              : "Failed to load statistics"
          );
        }
      } catch (err) {
        console.error("Error fetching admin data:", err);
        setError(`Failed to load admin data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleUserSelect = (user) => {
    setSelectedUser(user);
  };

  const handleUserAction = async (action, userId) => {
    try {
      // Set action-specific loading state
      setActionInProgress((prev) => ({ ...prev, [userId]: action }));
      setError(null);

      if (action === "delete") {
        if (
          !window.confirm(
            "Are you sure you want to delete this user? This action cannot be undone."
          )
        ) {
          setActionInProgress((prev) => ({ ...prev, [userId]: null }));
          return;
        }

        console.log(`Deleting user ${userId}`);

        // Optimistic UI update - remove user from list immediately
        setUsers((prevUsers) =>
          prevUsers.filter((user) => user.USER_ID !== userId)
        );

        // If this user was selected, deselect them
        if (selectedUser && selectedUser.USER_ID === userId) {
          setSelectedUser(null);
        }

        // Call API to delete user
        const deleteResponse = await usersApi.deleteUser(userId);
        console.log("Delete response:", deleteResponse);

        // Show success message
        setSuccessMessage("User deleted successfully");
      } else if (action === "toggleAdmin") {
        const userToUpdate = users.find((u) => u.USER_ID === userId);
        if (!userToUpdate) {
          throw new Error("User not found for role toggle");
        }

        // Check if attempting to demote the primary admin
        if (
          userToUpdate.EMAIL === "admin@pfa.com" &&
          userToUpdate.ROLE === "ADMIN"
        ) {
          setError(
            "Cannot remove admin privileges from the primary admin account"
          );
          return;
        }

        // Check if current user is not the primary admin and trying to make someone admin
        if (
          currentUser.email !== "admin@pfa.com" &&
          userToUpdate.ROLE !== "ADMIN" // trying to make someone admin
        ) {
          setError("Only the primary admin can promote users to admin role");
          return;
        }

        const newRole = userToUpdate.ROLE === "ADMIN" ? "user" : "admin";
        console.log(`Toggling user ${userId} role to ${newRole}`);

        // Optimistic UI update - update role immediately
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.USER_ID === userId
              ? { ...user, ROLE: newRole.toUpperCase() }
              : user
          )
        );

        // If this user was selected, update their role in the selected state too
        if (selectedUser && selectedUser.USER_ID === userId) {
          setSelectedUser((prev) => ({ ...prev, ROLE: newRole.toUpperCase() }));
        }

        // Call API to update user role
        const updateResponse = await usersApi.updateUserRole(userId, {
          role: newRole,
        });
        console.log("Update role response:", updateResponse);

        // Show success message
        setSuccessMessage(`User role updated to ${newRole}`);
      }

      // Refresh user list to ensure consistency
      const response = await usersApi.getAllUsers();
      if (response && response.data && response.data.success) {
        setUsers(response.data.data || []);
      } else {
        console.error("Failed to refresh user list after action:", response);
      }
    } catch (err) {
      console.error(`Error performing ${action} action:`, err);

      // Reset the optimistic UI updates by re-fetching data
      try {
        const refreshResponse = await usersApi.getAllUsers();
        if (
          refreshResponse &&
          refreshResponse.data &&
          refreshResponse.data.success
        ) {
          setUsers(refreshResponse.data.data || []);
        }
      } catch (refreshErr) {
        console.error("Failed to refresh data after error:", refreshErr);
      }

      // Custom message for primary admin deletion attempt
      if (action === "delete" && err.response && err.response.status === 403) {
        setError("Can't delete primary admin");
      } else {
        setError(`Failed to ${action} user: ${err.message || "Unknown error"}`);
      }
    } finally {
      // Clear action-specific loading state
      setActionInProgress((prev) => ({ ...prev, [userId]: null }));

      // Auto-clear success message after 3 seconds
      if (successMessage) {
        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);
      }
    }
  };

  // Rest of your component...
  // ...existing code...

  // ... (loading state and initial return) ...

  if (loading && !stats && users.length === 0) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Admin Dashboard
      </h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4">
          <p>{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md mb-4">
          <p>{successMessage}</p>
        </div>
      )}

      {/* Stats Overview */}
      {/* Stats Overview with Enhanced Circle Icons */}
      {stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Users Card */}
          <div className="card bg-white dark:bg-gray-800 p-5 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-14 w-14 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <svg
                  className="h-8 w-8 text-blue-500 dark:text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Users
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.totalUsers || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Total Transactions Card */}
          <div className="card bg-white dark:bg-gray-800 p-5 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-14 w-14 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <svg
                  className="h-8 w-8 text-green-500 dark:text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Transactions
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.totalTransactions || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Active Budgets Card */}
          <div className="card bg-white dark:bg-gray-800 p-5 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-14 w-14 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                <svg
                  className="h-8 w-8 text-yellow-500 dark:text-yellow-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Active Budgets
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.activeBudgets || 0}
                </p>
              </div>
            </div>
          </div>

          {/* System Health Card */}
          <div className="card bg-white dark:bg-gray-800 p-5 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-14 w-14 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <svg
                  className="h-8 w-8 text-purple-500 dark:text-purple-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  System Health
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.systemHealth
                    ? stats.systemHealth.charAt(0).toUpperCase() +
                      stats.systemHealth.slice(1)
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow">
          <p className="text-gray-500 dark:text-gray-400">
            Statistics are not available
          </p>
        </div>
      )}
      {/* Tab Navigation (remains the same) */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px">
            <button
              className={`py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === "users"
                  ? "border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
              onClick={() => setActiveTab("users")}
            >
              Users Management
            </button>

            <button
              className={`py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === "stats"
                  ? "border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
              onClick={() => setActiveTab("stats")}
            >
              System Statistics
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "users" && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                User Management
              </h2>
              <div className="overflow-x-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Name
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Email
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Role
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
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {users && users.length > 0
                      ? users.map((user) => {
                          let initials = "?";
                          if (
                            user.USERNAME &&
                            typeof user.USERNAME === "string" &&
                            user.USERNAME.length > 0
                          ) {
                            initials = user.USERNAME.charAt(0).toUpperCase();
                          } else if (
                            user.EMAIL &&
                            typeof user.EMAIL === "string" &&
                            user.EMAIL.length > 0
                          ) {
                            initials = user.EMAIL.charAt(0).toUpperCase();
                          }
                          const joinedDate = user.CREATED_AT
                            ? new Date(user.CREATED_AT).toLocaleDateString()
                            : "N/A";
                          const userRole = user.ROLE
                            ? user.ROLE.toLowerCase()
                            : "user"; // Normalize for display and logic

                          return (
                            <tr
                              key={user.USER_ID} // Use USER_ID
                              className={`${
                                selectedUser &&
                                selectedUser.USER_ID === user.USER_ID // Use USER_ID
                                  ? "bg-blue-50 dark:bg-blue-900 bg-opacity-40"
                                  : "hover:bg-gray-100 dark:hover:bg-gray-500"
                              }`}
                              onClick={() => handleUserSelect(user)}
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="h-10 w-10 flex-shrink-0">
                                    <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-300">
                                      {initials}
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                      {user.USERNAME || "N/A"}{" "}
                                      {/* Use USERNAME */}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                      Joined {joinedDate} {/* Use CREATED_AT */}
                                      {user.LAST_LOGIN && (
                                        <span>
                                          {" "}
                                          • Last active{" "}
                                          {new Date(
                                            user.LAST_LOGIN
                                          ).toLocaleDateString()}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {user.EMAIL || "N/A"} {/* Use EMAIL */}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    userRole === "admin" // Use normalized userRole
                                      ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                                      : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                  }`}
                                >
                                  {userRole} {/* Display normalized role */}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {/* Assuming 'is_active' is not available, display a default or remove */}
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                  N/A
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUserAction(
                                      "toggleAdmin",
                                      user.USER_ID
                                    );
                                  }}
                                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                                  disabled={
                                    (currentUser &&
                                      currentUser.id === user.USER_ID) ||
                                    actionInProgress[user.USER_ID] ||
                                    (user.EMAIL === "admin@pfa.com" &&
                                      user.ROLE === "ADMIN") ||
                                    // Add this condition: Non-primary admins can't promote users
                                    (currentUser.email !== "admin@pfa.com" &&
                                      user.ROLE !== "ADMIN")
                                  }
                                  title={
                                    user.EMAIL === "admin@pfa.com" &&
                                    user.ROLE === "ADMIN"
                                      ? "Cannot modify primary admin"
                                      : currentUser.email !== "admin@pfa.com" &&
                                        user.ROLE !== "ADMIN"
                                      ? "Only primary admin can promote users"
                                      : ""
                                  }
                                >
                                  {actionInProgress[user.USER_ID] ===
                                  "toggleAdmin"
                                    ? "Updating..."
                                    : user.ROLE === "ADMIN"
                                    ? user.EMAIL === "admin@pfa.com"
                                      ? "Primary Admin"
                                      : "Remove Admin"
                                    : "Make Admin"}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUserAction("delete", user.USER_ID);
                                  }}
                                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                  disabled={
                                    (currentUser &&
                                      currentUser.id === user.USER_ID) ||
                                    actionInProgress[user.USER_ID]
                                  }
                                >
                                  {actionInProgress[user.USER_ID] === "delete"
                                    ? "Deleting..."
                                    : "Delete"}
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      : null}
                  </tbody>
                </table>
              </div>

              {selectedUser && (
                <div className="mt-6 bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      User Details
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                      Detailed information about{" "}
                      {selectedUser.USERNAME || "N/A"}
                    </p>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:p-0">
                    <dl className="sm:divide-y sm:divide-gray-200 dark:sm:divide-gray-700">
                      <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Full name
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                          {selectedUser.USERNAME || "N/A"}
                        </dd>
                      </div>
                      <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Email address
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                          {selectedUser.EMAIL || "N/A"}
                        </dd>
                      </div>
                      <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Role
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                          {(selectedUser.ROLE || "N/A")
                            .toLowerCase()
                            .replace("admin", "Administrator")}
                        </dd>
                      </div>
                      <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Status
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                          N/A {/* is_active not available */}
                        </dd>
                      </div>
                      <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Member since
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                          {selectedUser.CREATED_AT
                            ? new Date(
                                selectedUser.CREATED_AT
                              ).toLocaleDateString()
                            : "N/A"}
                        </dd>
                      </div>
                      <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Last login
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                          {selectedUser.LAST_LOGIN
                            ? new Date(selectedUser.LAST_LOGIN).toLocaleString()
                            : "Never"}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* System Statistics Tab (remains the same) */}
          {activeTab === "stats" && stats && (
            <div className="space-y-6 ">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                System Statistics
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* User Growth Chart */}
                <div className="card h-80 bg-gray-100 dark:bg-gray-800">
                  <h3 className="text-lg font-semibold mb-4">User Growth</h3>
                  <ResponsiveContainer width="100%" height="85%">
                    <LineChart
                      data={stats.userGrowth}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="users"
                        name="Users"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Transaction Distribution Chart */}
                <div className="card h-80 bg-gray-100 dark:bg-gray-800">
                  <h3 className="text-lg font-semibold mb-4">
                    Transaction Distribution
                  </h3>
                  <ResponsiveContainer width="100%" height="85%">
                    <PieChart>
                      <Pie
                        data={stats.transactionDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        dataKey="value"
                        nameKey="type"
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {stats.transactionDistribution.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* System Performance */}
                <div className="card md:col-span-2 bg-gray-100 dark:bg-gray-800">
                  <h3 className="text-lg font-semibold mb-4">
                    System Performance
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          CPU Usage
                        </span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {stats.systemPerformance.cpuUsage}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{
                            width: `${stats.systemPerformance.cpuUsage}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Memory Usage
                        </span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {stats.systemPerformance.memoryUsage}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div
                          className="bg-green-600 h-2.5 rounded-full"
                          style={{
                            width: `${stats.systemPerformance.memoryUsage}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Disk Usage
                        </span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {stats.systemPerformance.diskUsage}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div
                          className={`h-2.5 rounded-full ${
                            stats.systemPerformance.diskUsage > 90
                              ? "bg-red-600"
                              : stats.systemPerformance.diskUsage > 75
                              ? "bg-yellow-600"
                              : "bg-green-600"
                          }`}
                          style={{
                            width: `${stats.systemPerformance.diskUsage}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div className="bg-gray-500 dark:bg-gray-750 p-4 rounded-lg">
                        <p className="text-sm font-medium text-white dark:text-white">
                          Database Size
                        </p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {stats.systemPerformance.databaseSize} MB
                        </p>
                      </div>
                      <div className="bg-gray-500 dark:bg-gray-750 p-4 rounded-lg">
                        <p className="text-sm font-medium text-white dark:text-white">
                          Average Response Time
                        </p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {stats.systemPerformance.avgResponseTime} ms
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
