import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

const DashboardSummary = ({ summary }) => {
  if (!summary) return null;
  
  const { currentBalance, monthlyIncome, monthlyExpense, budgetUsedPercentage } = summary;
  
  const cards = [
    {
      title: 'Current Balance',
      value: currentBalance,
      change: 12.8, // Replace with actual data when available
      changeType: 'increase',
      icon: (
        <div className="p-3 rounded-full bg-blue-100 text-blue-600 ">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      )
    },
    {
      title: 'Monthly Income',
      value: monthlyIncome,
      change: 8.2, // Replace with actual data when available
      changeType: 'increase',
      icon: (
        <div className="p-3 rounded-full bg-green-100 text-green-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
          </svg>
        </div>
      )
    },
    {
      title: 'Monthly Expenses',
      value: monthlyExpense,
      change: 5.1, // Replace with actual data when available
      changeType: 'increase',
      icon: (
        <div className="p-3 rounded-full bg-red-100 text-red-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
          </svg>
        </div>
      )
    },
    {
      title: 'Budget Used',
      value: `${budgetUsedPercentage}%`,
      change: budgetUsedPercentage > 80 ? 'High' : 'Normal',
      changeType: budgetUsedPercentage > 80 ? 'alert' : 'normal',
      icon: (
        <div className="p-3 rounded-full bg-purple-100 text-purple-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
        </div>
      )
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {cards.map((card, index) => (
        <div key={index} className="card transition-all duration-300 hover:shadow-lg hover:scale-[1.01]  bg-gray-100 dark:bg-gray-800">
          <div className="flex items-center">
            {card.icon}
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-300">{card.title}</p>
              <h3 className="text-xl font-semibold">
                {typeof card.value === 'number' ? new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'PKR',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(card.value) : card.value}
              </h3>
            </div>
          </div>
          <div className="mt-2">
            {card.changeType === 'increase' && (
              <span className="inline-flex items-center text-sm text-green-600">
                <ArrowUpIcon className="w-4 h-4 mr-1" />
                {card.change}% from last month
              </span>
            )}
            {card.changeType === 'decrease' && (
              <span className="inline-flex items-center text-sm text-red-600">
                <ArrowDownIcon className="w-4 h-4 mr-1" />
                {card.change}% from last month
              </span>
            )}
            {card.changeType === 'alert' && (
              <span className="inline-flex items-center text-sm text-orange-500">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {card.change} usage
              </span>
            )}
            {card.changeType === 'normal' && (
              <span className="inline-flex items-center text-sm text-gray-500">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {card.change} usage
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardSummary;