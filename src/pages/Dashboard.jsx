import React, { useState, useEffect } from "react";
import { dashboardApi } from "../services/api";
import { goalsApi } from "../services/goalService"; // Add this import
import DashboardGraphs from "../components/DashboardGraphs";
import DashboardSummary from "../components/DashboardSummary";

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [incomeVsExpenseData, setIncomeVsExpenseData] = useState([]);
  const [spendingByCategory, setSpendingByCategory] = useState([]);
  const [budgetVsActual, setBudgetVsActual] = useState([]);
  const [financialTrends, setFinancialTrends] = useState([]);
  const [financialGoals, setFinancialGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch all dashboard data in parallel for better performance
        const [
          summaryRes,
          incomeVsExpenseRes,
          spendingByCategoryRes,
          trendsRes,
          goalsRes,
          budgetVsActualRes, // Add this API call
        ] = await Promise.all([
          dashboardApi.getSummary(),
          dashboardApi.getIncomeVsExpense(),
          dashboardApi.getSpendingByCategory(),
          dashboardApi.getTrends(),
          goalsApi.getGoals(),
          dashboardApi.getBudgetVsActual(), // Add this API call
        ]);

        // Transform summary data to handle case sensitivity from Oracle
        const transformedSummary = {
          currentBalance:
            summaryRes.data.data?.CURRENT_BALANCE ||
            summaryRes.data.data?.current_balance ||
            0,
          monthlyIncome:
            summaryRes.data.data?.MONTHLY_INCOME ||
            summaryRes.data.data?.monthly_income ||
            0,
          monthlyExpense:
            summaryRes.data.data?.MONTHLY_EXPENSE ||
            summaryRes.data.data?.monthly_expense ||
            0,
          budgetUsedPercentage:
            summaryRes.data.data?.BUDGET_USED_PERCENTAGE ||
            summaryRes.data.data?.budget_used_percentage ||
            0,
        };

        setSummary(transformedSummary);

        // Set chart data (handle case sensitivity and different structures)
        if (incomeVsExpenseRes.data?.data) {
          setIncomeVsExpenseData(
            (incomeVsExpenseRes.data.data || []).map((item) => ({
              month: item.MONTH || item.month,
              income: Number(item.INCOME || item.income || 0),
              // Check both singular and plural forms
              expenses: Number(
                item.EXPENSES ||
                  item.expenses ||
                  item.EXPENSE ||
                  item.expense ||
                  0
              ),
              savings: Number(
                item.SAVINGS ||
                  item.savings ||
                  Number(item.INCOME || item.income || 0) -
                    Number(
                      item.EXPENSES ||
                        item.expenses ||
                        item.EXPENSE ||
                        item.expense ||
                        0
                    )
              ),
            }))
          );
        }

        if (spendingByCategoryRes.data?.data) {
          setSpendingByCategory(
            (spendingByCategoryRes.data.data || []).map((item) => ({
              category:
                item.CATEGORY ||
                item.category ||
                item.CATEGORY_NAME ||
                item.category_name ||
                "Other",
              amount: Number(item.AMOUNT || item.amount || 0),
            }))
          );
        }

        if (budgetVsActualRes.data?.data) {
        setBudgetVsActual(
          (budgetVsActualRes.data.data || []).map((item) => ({
            category: item.CATEGORY || item.category || "Unknown",
            budget: Number(item.BUDGET || item.budget || 0),
            actual: Number(item.ACTUAL || item.actual || 0)
          }))
        );
      }

        if (trendsRes.data?.data) {
          setFinancialTrends(
            (trendsRes.data.data || []).map((item) => ({
              month: item.MONTH || item.month,
              income: Number(item.INCOME || item.income || 0),
              expenses: Number(
                item.EXPENSES ||
                  item.expenses ||
                  item.EXPENSE ||
                  item.expense ||
                  0
              ),
              savings: Number(
                item.SAVINGS ||
                  item.savings ||
                  Number(item.INCOME || item.income || 0) -
                    Number(
                      item.EXPENSES ||
                        item.expenses ||
                        item.EXPENSE ||
                        item.expense ||
                        0
                    )
              ),
            }))
          );
        }

        // Process and set goals data from API instead of hardcoded data
        if (goalsRes.data?.data) {
          const formattedGoals = goalsRes.data.data.map((goal) => ({
            goal: goal.NAME,
            target: Number(goal.TARGET_AMOUNT),
            current: Number(goal.CURRENT_AMOUNT),
            percentComplete: Math.round(
              (goal.CURRENT_AMOUNT / goal.TARGET_AMOUNT) * 100
            ),
          }));

          setFinancialGoals(formattedGoals);
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md">
        <p className="font-bold">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Dashboard
      </h1>

      {summary && <DashboardSummary summary={summary} />}

      {/* Pass actual data to DashboardGraphs */}
      <DashboardGraphs
        incomeVsExpenseData={incomeVsExpenseData}
        spendingByCategory={spendingByCategory}
        budgetVsActual={budgetVsActual}
        financialTrends={financialTrends}
        savingsGoals={financialGoals}
      />
    </div>
  );
};

export default Dashboard;
