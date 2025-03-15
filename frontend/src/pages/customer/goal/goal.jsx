import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Goal = () => {
  const [totalSavings, setTotalSavings] = useState(0);
  const [currency, setCurrency] = useState(
    localStorage.getItem("currency") || "USD"
  );
  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState({
    title: "",
    image: "",
    targetValue: "",
    description: "",
  });

  useEffect(() => {
    fetchTotalSavings();
    fetchGoals();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Authentication token is missing.");
      throw new Error("Authentication token is missing.");
    }
    return { Authorization: `Bearer ${token}` };
  };

  const fetchTotalSavings = async () => {
    try {
      const { data } = await axios.get(
        "http://localhost:5000/api/goal/total-savings",
        { headers: getAuthHeaders() }
      );
      setTotalSavings(data.totalSavings);
      setCurrency(data.currency);
    } catch (error) {
      toast.error("Failed to fetch total savings");
      console.error("Error fetching total savings", error);
    }
  };

  const fetchGoals = async () => {
    try {
      const { data } = await axios.get("http://localhost:5000/api/goal/", {
        headers: getAuthHeaders(),
      });
      setGoals(data.goals);
    } catch (error) {
      toast.error("Failed to fetch goals");
      console.error("Error fetching goals", error);
    }
  };

  const handleCreateGoal = async () => {
    try {
      const { data } = await axios.post(
        "http://localhost:5000/api/goal/",
        newGoal,
        { headers: getAuthHeaders() }
      );
      setGoals([...goals, data.goal]);
      toast.success(`Goal "${data.goal.title}" created successfully!`);
      setNewGoal({ title: "", image: "", targetValue: "", description: "" });
    } catch (error) {
      toast.error("Failed to create goal");
      console.error("Error creating goal", error);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    try {
      await axios.delete(`http://localhost:5000/api/goal/${goalId}`, {
        headers: getAuthHeaders(),
      });
      setGoals(goals.filter((goal) => goal._id !== goalId));
      toast.success("Goal deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete goal");
      console.error("Error deleting goal", error);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <ToastContainer />
      <h1 className="text-2xl font-bold mb-4">Goal Management</h1>

      {/* Total Savings */}
      <div className="bg-gray-100 p-4 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold">Total Savings</h2>
        <p className="text-lg font-bold">
          {currency} {totalSavings}
        </p>
      </div>

      {/* Create Goal */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-2">Create a Goal</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="Title"
            value={newGoal.title}
            onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
          />
          <Input
            placeholder="Image URL"
            value={newGoal.image}
            onChange={(e) => setNewGoal({ ...newGoal, image: e.target.value })}
          />
          <Input
            placeholder="Target Value"
            type="number"
            value={newGoal.targetValue}
            onChange={(e) =>
              setNewGoal({ ...newGoal, targetValue: e.target.value })
            }
          />
          <Input
            placeholder="Description"
            value={newGoal.description}
            onChange={(e) =>
              setNewGoal({ ...newGoal, description: e.target.value })
            }
          />
        </div>
        <Button className="mt-4 w-full" onClick={handleCreateGoal}>
          Create Goal
        </Button>
      </div>

      {/* Goals List */}
      <h2 className="text-xl font-semibold mb-4">Your Goals</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => (
          <Card key={goal._id} className="p-4">
            <CardContent>
              {goal.image && (
                <img
                  src={goal.image}
                  alt={goal.title}
                  className="w-full h-32 object-cover rounded-lg mb-2"
                />
              )}
              <h3 className="text-lg font-bold">{goal.title}</h3>
              <p className="text-gray-600">{goal.description}</p>
              <p className="mt-2 font-semibold">
                {goal.currency} {goal.savedValue} / {goal.targetValue}
              </p>
              <Button
                className="mt-4 bg-red-500 hover:bg-red-600"
                onClick={() => handleDeleteGoal(goal._id)}
              >
                Delete
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Goal;
