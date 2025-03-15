import { Route, Routes, Navigate } from "react-router-dom";
import AuthLayout from "./layouts/auth/layout";
import AuthLogin from "./pages/auth/login";
import AuthSignup from "./pages/auth/signup";
import AdminLayout from "./layouts/admin/layout";
import AdminDashboard from "./pages/admin/dashboard/dashboard";
import NotFound from "./pages/not-found/notfound";
import CustomerLayout from "./layouts/customer/layout";
import UserHome from "./pages/customer/home/home";
import UnAuthPage from "./pages/unauth-page";
import CheckAuth from "./components/common/check-auth";
import { useSelector } from "react-redux";

import Incomes from "./pages/customer/transactions/incomes";
import Expenses from "./pages/customer/transactions/expenses";
import Budgets from "./pages/customer/transactions/budgets";
import Transactions from "./pages/customer/transactions/transactions";
import UserProfile from "./pages/customer/profile/profile";
import UserReport from "./pages/customer/report/report";
import Goals from "./pages/customer/goal/goal";

import AdminProfile from "./pages/admin/profile/adminprofile";
import UserProfiles from "./pages/admin/profile/userprofile";
import UtilityPage from "./pages/admin/utility/utility";
import CurrencyPage from "./pages/admin/utility/CurrencyPage";
import CategoryPage from "./pages/admin/utility/CategoryPage";
import TransactionPage from "./pages/admin/transaction/alltransactions";
import ReportsPage from "./pages/admin/report/report";
import UserSummaryReport from "./pages/admin/report/customer-summery-report";

// Import ToastContainer from react-toastify
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  console.log(user);

  return (
    <>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Navigate to="/auth/login" />} />
        <Route
          path="/auth"
          element={
            <CheckAuth user={user} isAuthenticated={isAuthenticated}>
              <AuthLayout />
            </CheckAuth>
          }
        >
          <Route path="signup" element={<AuthSignup />} />
          <Route path="login" element={<AuthLogin />} />
        </Route>

        <Route
          path="/admin"
          element={
            <CheckAuth user={user} isAuthenticated={isAuthenticated}>
              <AdminLayout />
            </CheckAuth>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="profile" element={<AdminProfile />} />
          <Route path="customerInformation" element={<UserProfiles />} />
          <Route path="utilities" element={<UtilityPage />} />
          <Route path="currency" element={<CurrencyPage />} />
          <Route path="category" element={<CategoryPage />} />
          <Route path="transaction" element={<TransactionPage />} />
          <Route path="report" element={<ReportsPage />} />
          <Route
            path="customer-summary-report"
            element={<UserSummaryReport />}
          />
        </Route>

        <Route
          path="/user"
          element={
            <CheckAuth user={user} isAuthenticated={isAuthenticated}>
              <CustomerLayout />
            </CheckAuth>
          }
        >
          <Route path="home" element={<UserHome />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="incomes" element={<Incomes />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="budgets" element={<Budgets />} />
          <Route path="goals" element={<Goals />} />
          <Route path="view-transaction" element={<Transactions />} />
          <Route path="report" element={<UserReport />} />
        </Route>
        <Route path="*" element={<NotFound />} />
        <Route path="/unauth-page" element={<UnAuthPage />} />
      </Routes>
    </>
  );
}

export default App;
