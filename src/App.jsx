import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Budgets from "./pages/Budgets";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import AdminPanel from "./pages/AdminPanel";
import SavingsGoals from "./pages/SavingsGoals"; // Add this import

// Layout
import Layout from "./components/Layout";

function App() {
  const { currentUser, loading } = useAuth();

  // Protected route component
  const ProtectedRoute = ({ children, requireAdmin }) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (!currentUser) {
      return <Navigate to="/login" />;
    }

    // ---- START DEBUG LOG ----
    console.log(
      "[ProtectedRoute] Current User State:",
      JSON.stringify(currentUser)
    );
    console.log(
      "[ProtectedRoute] requireAdmin:",
      requireAdmin,
      "| currentUser.role:",
      currentUser?.role
    ); // Added optional chaining for role
    // ---- END DEBUG LOG ----

    if (requireAdmin && currentUser.role !== "admin") {
      // Ensure currentUser.role is 'admin' (lowercase)
      console.log(
        "[ProtectedRoute] Access DENIED for admin route. Redirecting to /dashboard."
      );
      return <Navigate to="/dashboard" />;
    }

    return children;
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={!currentUser ? <Login /> : <Navigate to="/dashboard" />}
      />
      <Route
        path="/register"
        element={!currentUser ? <Register /> : <Navigate to="/dashboard" />}
      />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="budgets" element={<Budgets />} />
        <Route path="savings-goals" element={<SavingsGoals />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
        <Route
          path="admin"
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminPanel />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
