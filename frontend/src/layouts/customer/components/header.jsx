import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "../../../redux/authSlice";
import { LogOut } from "lucide-react";

const CustomerHeader = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const userEmail = useSelector((state) => state.auth.user?.email);

  const handleLogout = () => {
    dispatch(logoutUser())
      .unwrap()
      .then(() => {
        navigate("/login");
      })
      .catch((error) => {
        console.error("Error logging out:", error);
      });
  };

  return (
    <header className="bg-yellow-500 text-white py-4 px-6 flex items-center">
      <Link to="/user/home" className="text-2xl font-bold flex-shrink-0">
        Finance Tracker
      </Link>
      <div className="flex-grow"></div>
      <nav className="flex items-center space-x-8">
        <button
          onClick={handleLogout}
          className="inline-flex gap-2 items-center rounded-md px-4 py-2 text-sm font-medium shadow bg-red-600"
        >
          <LogOut />
          Logout
        </button>
      </nav>
    </header>
  );
};

export default CustomerHeader;
