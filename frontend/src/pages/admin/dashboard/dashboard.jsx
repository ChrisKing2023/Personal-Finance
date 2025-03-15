// src/components/AdminDashboard.js
import React from "react";
import { Bell } from "lucide-react";

const AdminDashboard = () => {
  return (
    <div className="flex h-auto bg-gray-100 border-2 border-black">
      {/* Main Content */}
      <main className="flex-1 p-6 space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-800">
            Dashboard Overview
          </h1>
        </header>
      </main>
    </div>
  );
};

export default AdminDashboard;
