import React, { useState } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  Sector,
  RadialBarChart,
  RadialBar,
} from "recharts";

// Professional color palette
const COLORS = {
  primary: ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"],
  income: ["#059669", "#10b981", "#34d399", "#6ee7b7", "#a7f3d0"],
  expense: ["#dc2626", "#ef4444", "#f87171", "#fca5a5", "#fee2e2"],
  neutral: ["#475569", "#64748b", "#94a3b8", "#cbd5e1", "#e2e8f0"],
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const CustomTooltip = ({ active, payload, label, valuePrefix }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded shadow-lg">
        <p className="font-medium text-sm text-gray-600 dark:text-gray-300">{`${label}`}</p>
        {payload.map((entry, index) => (
          <p
            key={`item-${index}`}
            style={{ color: entry.color }}
            className="text-sm"
          >
            {`${entry.name}: ${
              valuePrefix || ""
            }${entry.value.toLocaleString()}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Enhanced Income vs Expense Chart
export const IncomeVsExpenseChart = ({ data }) => {
  const [activeIndex, setActiveIndex] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="card h-96 flex flex-col justify-center items-center">
        <svg
          className="w-12 h-12 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <p className="text-gray-500 mt-3">No income/expense data available</p>
      </div>
    );
  }

  const handleMouseEnter = (_, index) => {
    setActiveIndex(index);
  };

  const handleMouseLeave = () => {
    setActiveIndex(null);
  };

  return (
    <div className="card h-96 overflow-hidden transition-shadow hover:shadow-lg  bg-gray-100 dark:bg-gray-800">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Income vs. Expenses</h3>
        <div className="flex space-x-2">
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
            <span className="w-2 h-2 mr-1 bg-green-500 rounded-full"></span>
            Income
          </span>
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800">
            <span className="w-2 h-2 mr-1 bg-red-500 rounded-full"></span>
            Expenses
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="85%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
          barGap={0}
          barSize={20}
          onMouseLeave={handleMouseLeave}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 12 }}
            tickFormatter={(value) => `Rs. ${value / 1000}k`}
          />
          <Tooltip
            content={<CustomTooltip valuePrefix="Rs. " />}
            cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            verticalAlign="top"
            align="right"
            wrapperStyle={{ top: -35 }}
          />
          <Bar
            dataKey="income"
            name="Income"
            fill={COLORS.income[0]}
            radius={[4, 4, 0, 0]}
            onMouseEnter={handleMouseEnter}
            animationDuration={1500}
          >
            {data.map((_, index) => (
              <Cell
                key={`income-${index}`}
                fill={
                  index === activeIndex ? COLORS.income[0] : COLORS.income[1]
                }
                opacity={
                  activeIndex === null || index === activeIndex ? 1 : 0.6
                }
              />
            ))}
          </Bar>
          <Bar
            dataKey="expenses"
            name="Expenses"
            fill={COLORS.expense[0]}
            radius={[4, 4, 0, 0]}
            onMouseEnter={handleMouseEnter}
            animationDuration={1500}
            animationBegin={300}
          >
            {data.map((_, index) => (
              <Cell
                key={`expense-${index}`}
                fill={
                  index === activeIndex ? COLORS.expense[0] : COLORS.expense[1]
                }
                opacity={
                  activeIndex === null || index === activeIndex ? 1 : 0.6
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Active shape for pie chart
const renderActiveShape = (props) => {
  const {
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    percent,
    value,
  } = props;
  const sin = Math.sin((-midAngle * Math.PI) / 180);
  const cos = Math.cos((-midAngle * Math.PI) / 180);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? "start" : "end";

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path
        d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
        stroke={fill}
        fill="none"
      />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        textAnchor={textAnchor}
        fill="#333"
        fontSize={12}
      >
        {payload.category}
      </text>
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        dy={18}
        textAnchor={textAnchor}
        fill="#999"
        fontSize={12}
      >
        {`${formatCurrency(value)} (${(percent * 100).toFixed(1)}%)`}
      </text>
    </g>
  );
};

// Enhanced Spending By Category Chart
export const SpendingByCategoryChart = ({ data }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!data || data.length === 0) {
    return (
      <div className="card h-96 flex flex-col justify-center items-center">
        <svg
          className="w-12 h-12 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
          />
        </svg>
        <p className="text-gray-500 mt-3">
          No category spending data available
        </p>
      </div>
    );
  }

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  return (
    <div className="card h-96 overflow-hidden transition-shadow hover:shadow-lg  bg-gray-100 dark:bg-gray-800">
      <h3 className="text-lg font-semibold mb-4">Spending by Category</h3>
      <ResponsiveContainer width="100%" height="85%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            innerRadius={60}
            outerRadius={80}
            dataKey="amount"
            nameKey="category"
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            onMouseEnter={onPieEnter}
            animationBegin={0}
            animationDuration={1200}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS.neutral[index % COLORS.neutral.length]}
              />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatCurrency(value)} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// Enhanced Budget vs Actual Chart
export const BudgetVsActualChart = ({ data }) => {
  const [hoveredBar, setHoveredBar] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="card h-96 flex flex-col justify-center items-center">
        <svg
          className="w-12 h-12 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-gray-500 mt-3">No budget vs actual data available</p>
      </div>
    );
  }

  const handleMouseEnter = (data, index) => {
    setHoveredBar(index);
  };

  const handleMouseLeave = () => {
    setHoveredBar(null);
  };

  return (
    <div className="card h-96 overflow-hidden transition-shadow hover:shadow-lg  bg-gray-100 dark:bg-gray-800">
      <h3 className="text-lg font-semibold mb-4">Budget vs. Actual</h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
          barGap={4}
          onMouseLeave={handleMouseLeave}
          layout="vertical"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            opacity={0.1}
            horizontal={true}
            vertical={false}
          />
          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 12 }}
            tickFormatter={(value) => `Rs. ${value / 1000}k`}
          />
          <YAxis
            type="category"
            dataKey="category"
            axisLine={false}
            tickLine={false}
            width={100}
            tick={{ fill: "#64748b", fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip valuePrefix="Rs. " />} />
          <Legend iconType="circle" iconSize={8} />
          <Bar
            dataKey="budget"
            name="Budget"
            fill={COLORS.primary[0]}
            radius={[0, 4, 4, 0]}
            onMouseEnter={handleMouseEnter}
            animationDuration={1500}
          >
            {data.map((entry, index) => (
              <Cell
                key={`budget-${index}`}
                fill={COLORS.primary[index === hoveredBar ? 0 : 1]}
                opacity={hoveredBar === null || index === hoveredBar ? 1 : 0.7}
              />
            ))}
          </Bar>
          <Bar
            dataKey="actual"
            name="Actual"
            fill={COLORS.expense[1]}
            radius={[0, 4, 4, 0]}
            onMouseEnter={handleMouseEnter}
            animationBegin={300}
            animationDuration={1500}
          >
            {data.map((entry, index) => (
              <Cell
                key={`actual-${index}`}
                fill={COLORS.expense[index === hoveredBar ? 0 : 1]}
                opacity={hoveredBar === null || index === hoveredBar ? 1 : 0.7}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Enhanced Financial Trend Chart (Area Chart)
export const FinancialTrendChart = ({ data }) => {
  const [period, setPeriod] = useState("all");

  if (!data || data.length === 0) {
    return (
      <div className="card h-96 flex flex-col justify-center items-center">
        <svg
          className="w-12 h-12 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
          />
        </svg>
        <p className="text-gray-500 mt-3">No financial trend data available</p>
      </div>
    );
  }

  const filterData = () => {
    if (period === "all") return data;
    if (period === "6m") return data.slice(-6);
    return data.slice(-3);
  };

  const filteredData = filterData();

  return (
    <div className="card h-96 overflow-hidden transition-shadow hover:shadow-lg bg-gray-100 dark:bg-gray-800">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Financial Trend</h3>
        <div className="flex space-x-1  rounded p-1">
          <button
            className={`px-3 py-1 text-xs rounded ${
              period === "3m"
                ? "bg-white dark:bg-gray-700 shadow"
                : "text-gray-500"
            }`}
            onClick={() => setPeriod("3m")}
          >
            3M
          </button>
          <button
            className={`px-3 py-1 text-xs rounded ${
              period === "6m"
                ? "bg-white dark:bg-gray-700 shadow"
                : "text-gray-500"
            }`}
            onClick={() => setPeriod("6m")}
          >
            6M
          </button>
          <button
            className={`px-3 py-1 text-xs rounded ${
              period === "all"
                ? "bg-white dark:bg-gray-700 shadow"
                : "text-gray-500"
            }`}
            onClick={() => setPeriod("all")}
          >
            All
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="85%">
        <AreaChart
          data={filteredData}
          margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
        >
          <defs>
            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={COLORS.income[1]}
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor={COLORS.income[1]}
                stopOpacity={0.1}
              />
            </linearGradient>
            <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={COLORS.expense[1]}
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor={COLORS.expense[1]}
                stopOpacity={0.1}
              />
            </linearGradient>
            <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={COLORS.primary[1]}
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor={COLORS.primary[1]}
                stopOpacity={0.1}
              />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 12 }}
            tickFormatter={(value) => `Rs. ${value / 1000}k`}
          />
          <Tooltip content={<CustomTooltip valuePrefix="Rs. " />} />
          <Legend iconType="circle" iconSize={8} />
          <Area
            type="monotone"
            dataKey="income"
            name="Income"
            stroke={COLORS.income[0]}
            fillOpacity={1}
            fill="url(#colorIncome)"
            activeDot={{ r: 6 }}
            animationDuration={1500}
          />
          <Area
            type="monotone"
            dataKey="expenses"
            name="Expenses"
            stroke={COLORS.expense[0]}
            fillOpacity={1}
            fill="url(#colorExpenses)"
            animationBegin={300}
            animationDuration={1500}
          />
          <Area
            type="monotone"
            dataKey="savings"
            name="Savings"
            stroke={COLORS.primary[0]}
            fillOpacity={1}
            fill="url(#colorSavings)"
            animationBegin={600}
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// New component: Savings Goal Progress
// In the SavingsGoalChart component

// Update the SavingsGoalChart component:

export const SavingsGoalChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="card h-96 flex flex-col justify-center items-center">
        <svg
          className="w-12 h-12 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-gray-500 mt-3">No savings goal data available</p>
      </div>
    );
  }

  return (
    <div className="card h-96 overflow-hidden transition-shadow hover:shadow-lg bg-gray-100 dark:bg-gray-800">
      <h3 className="text-lg font-semibold mb-4">Savings Goals Progress</h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <XAxis type="number" domain={[0, 100]} />
          <YAxis type="category" dataKey="goal" width={150} />
          <CartesianGrid strokeDasharray="3 3" />
          <Tooltip formatter={(value) => [`${value}%`, "Completed"]} />
          <Legend />
          <Bar
            dataKey="percentComplete"
            name="Progress"
            radius={[0, 10, 10, 0]}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS.primary[index % COLORS.primary.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const DashboardGraphs = ({
  incomeVsExpenseData = [],
  spendingByCategory = [],
  budgetVsActual = [],
  financialTrends = [],
  savingsGoals = [],
}) => {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IncomeVsExpenseChart data={incomeVsExpenseData} />
        <SpendingByCategoryChart data={spendingByCategory} />
        <BudgetVsActualChart data={budgetVsActual} />
        <FinancialTrendChart data={financialTrends} />
      </div>

      {savingsGoals?.length > 0 && (
        <div className="mt-6">
          <SavingsGoalChart data={savingsGoals} />
        </div>
      )}
    </>
  );
};

export default DashboardGraphs;
