import React, { useState, useEffect } from "react";
import { transactionsApi } from "../services/api";
import TransactionList from "../components/TransactionList";
import TransactionForm from "../components/TransactionForm";

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const response = await transactionsApi.getAll();

      // Transform the data to match what TransactionList expects
      const transformedTransactions = (response.data.data || []).map((t) => ({
        id: t.TRANSACTION_ID || t.transaction_id,
        date: t.TRANSACTION_DATE || t.transaction_date,
        description: t.DESCRIPTION || t.description,
        amount: t.AMOUNT || t.amount,
        type: (t.TYPE || t.type || "").toLowerCase(),
        category: {
          id: t.CATEGORY_ID || t.category_id,
          name: t.CATEGORY_NAME || t.category_name,
        },
      }));

      setTransactions(transformedTransactions);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError("Failed to load transactions");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleOpenModal = (transaction = null) => {
    setCurrentTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentTransaction(null);
  };

  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true);

      console.log("Submitting transaction:", formData); // Added debugging

      if (currentTransaction) {
        const response = await transactionsApi.update(
          currentTransaction.id,
          formData
        );
        console.log("Update response:", response);
        setSuccessMessage("Transaction updated successfully");
        handleCloseModal();
      } else {
        const response = await transactionsApi.create(formData);
        console.log("Create response:", response);
        setSuccessMessage("Transaction added successfully");
        handleCloseModal();
      }

      fetchTransactions();
    } catch (err) {
      console.error("Error submitting transaction:", err);
      console.error("Error details:", err.response?.data);

      // Check if it's a budget limit error
      if (err.response?.data?.message?.includes("exceed your budget")) {
        setError(err.response.data.message);
      } else {
        setError(err.message || "Failed to save transaction");
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) {
      return;
    }

    try {
      setIsLoading(true);
      await transactionsApi.delete(id);
      setSuccessMessage("Transaction deleted successfully");
      fetchTransactions();
    } catch (err) {
      console.error("Error deleting transaction:", err);
      setError("Failed to delete transaction");
    }
  };

  // Clear messages after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Transactions
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
          Add Transaction
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
      <TransactionList
        transactions={transactions}
        onEdit={handleOpenModal}
        onDelete={handleDelete}
        isLoading={isLoading}
      />
      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              {currentTransaction ? "Edit Transaction" : "Add Transaction"}
            </h2>

            <TransactionForm
              transaction={currentTransaction}
              onSubmit={handleSubmit}
              onCancel={handleCloseModal}
              isLoading={isSubmitting}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
