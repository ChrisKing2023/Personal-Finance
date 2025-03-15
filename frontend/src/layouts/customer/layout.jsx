import { Outlet } from "react-router-dom";
import CustomerHeader from "./components/header";
import { useState } from "react";
import UserSidebar from "./components/usersidebar";

const CustomerLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col bg-white overflow-hidden">
      <CustomerHeader />
      <div className="flex flex-1">
        {/* User Sidebar */}
        <UserSidebar open={sidebarOpen} setOpen={setSidebarOpen} />

        {/* Main content */}
        <main className="flex flex-1 flex-col w-full p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CustomerLayout;
