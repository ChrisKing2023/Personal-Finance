import { useState, useEffect } from "react";
import axios from "axios";

const Goal = () => {
  const [goals, setGoals] = useState([]);
  const [totalSavings, setTotalSavings] = useState(0);

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/goal");
        setGoals(response.data.goals);
        setTotalSavings(response.data.totalSavings);
      } catch (error) {
        console.error("Error fetching goals:", error);
      }
    };
    fetchGoals();
  }, []);

  const deleteGoal = async (goalId) => {
    try {
      await axios.delete(`http://localhost:5000/api/goal/${goalId}`);
      setGoals(goals.filter((goal) => goal._id !== goalId));
    } catch (error) {
      console.error("Error deleting goal:", error);
    }
  };

  const completeGoal = async (goalId) => {
    try {
      await axios.patch(`http://localhost:5000/api/goal/complete/${goalId}`);
      setGoals(
        goals.map((goal) =>
          goal._id === goalId ? { ...goal, isCompleted: true } : goal
        )
      );
    } catch (error) {
      console.error("Error completing goal:", error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-900">My Goals</h1>
        <p className="text-lg text-gray-500">Total Savings: ${totalSavings}</p>
      </div>
      <div className="space-y-6">
        {goals.length === 0 ? (
          <p className="text-xl text-gray-500">No goals found.</p>
        ) : (
          goals.map((goal) => (
            <div
              key={goal._id}
              className="bg-white shadow-md rounded-lg p-6 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6"
            >
              <img
                src={goal.image || "https://via.placeholder.com/150"}
                alt={goal.title}
                className="w-32 h-32 rounded-md object-cover"
              />
              <div className="flex-1">
                <h2 className="text-xl font-medium text-gray-800">
                  {goal.title}
                </h2>
                <p className="text-gray-500 mt-2">
                  {goal.description || "No description available."}
                </p>
                <p className="mt-2 text-gray-800">
                  Target: ${goal.targetValue} | Saved: ${goal.savedValue} |
                  Remaining: ${goal.remainingAmount}
                </p>
                <div className="mt-4 flex space-x-4">
                  <button
                    onClick={() => completeGoal(goal._id)}
                    disabled={goal.isCompleted}
                    className={`px-4 py-2 rounded-md ${
                      goal.isCompleted
                        ? "bg-green-500 text-white cursor-not-allowed"
                        : "bg-blue-500 text-white"
                    }`}
                  >
                    {goal.isCompleted ? "Completed" : "Mark as Completed"}
                  </button>
                  <button
                    onClick={() => deleteGoal(goal._id)}
                    className="px-4 py-2 rounded-md bg-red-500 text-white"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Goal;
