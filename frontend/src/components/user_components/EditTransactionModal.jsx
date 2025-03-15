import React from "react";
import CategoryIncomeSelector from "./CategoryIncomeSelector";
import CategoryExpenseSelector from "./CategoryExpenseSelector";

const EditTransactionModal = ({
  editForm,
  setEditForm,
  setEditingTransaction,
  handleSaveEdit,
  capitalizeWords,
}) => {
  if (!editForm) return null; // Prevent rendering if no transaction is being edited

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-2">
          Edit Transaction
        </h2>
        <form className="grid grid-cols-2 gap-6">
          {/* Title */}
          <div className="col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-1">
              <span className="text-red-500">*</span> Title
            </label>
            <input
              type="text"
              value={editForm.title}
              onChange={(e) =>
                setEditForm({ ...editForm, title: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg p-2"
            />
          </div>

          {/* Type (Read-Only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <input
              type="text"
              value={capitalizeWords(editForm.type)}
              readOnly
              className="w-full bg-gray-100 border border-gray-300 rounded-lg p-2"
            />
          </div>

          {/* Category Selector */}
          <div>
            {editForm.type === "income" ? (
              <CategoryIncomeSelector
                value={editForm.category}
                onChange={(e) =>
                  setEditForm({ ...editForm, category: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg p-2"
              />
            ) : (
              <CategoryExpenseSelector
                value={editForm.category}
                onChange={(e) =>
                  setEditForm({ ...editForm, category: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg p-2"
              />
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="text-red-500">*</span> Amount
            </label>
            <input
              type="number"
              value={editForm.amount}
              onChange={(e) =>
                setEditForm({ ...editForm, amount: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg p-2"
            />
          </div>

          {/* Currency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="text-red-500">*</span> Currency
            </label>
            <input
              type="text"
              value={editForm.currency}
              onChange={(e) =>
                setEditForm({ ...editForm, currency: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg p-2"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <input
              type="text"
              value={editForm.tags}
              onChange={(e) =>
                setEditForm({ ...editForm, tags: e.target.value.split(",") })
              }
              placeholder="Comma-separated tags"
              className="w-full border border-gray-300 rounded-lg p-2"
            />
          </div>

          {/* Description */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={editForm.description}
              onChange={(e) =>
                setEditForm({ ...editForm, description: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg p-2"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={editForm.date}
              onChange={(e) =>
                setEditForm({ ...editForm, date: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg p-2"
            />
          </div>

          {/* Recurring Transaction Toggle */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={editForm.isRecurring}
              onChange={(e) => {
                const isChecked = e.target.checked;
                setEditForm({
                  ...editForm,
                  isRecurring: isChecked,
                  recurrenceType: isChecked
                    ? editForm.recurrenceType || "monthly"
                    : null,
                });
              }}
            />
            <label className="text-sm text-gray-700">
              Recurring Transaction
            </label>
          </div>

          {/* Recurrence Type (Only show if isRecurring is true) */}
          {editForm.isRecurring && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recurrence Type
              </label>
              <select
                value={editForm.recurrenceType}
                onChange={(e) =>
                  setEditForm({ ...editForm, recurrenceType: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg p-2"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          )}

          {/* Action Buttons */}
          <div className="col-span-2 flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => setEditingTransaction(null)}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              className="px-4 py-2 bg-indigo-500 text-white rounded-lg"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTransactionModal;
