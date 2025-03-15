import { Outlet, useLocation } from "react-router-dom";

const AuthLayout = () => {
  const location = useLocation();

  const isLoginPage = location.pathname === "/auth/login";

  return (
    <>
      <div className="flex min-h-screen w-full ">
        <div className="hidden lg:flex items-center justify-center bg-gradient-to-r from-red-400 to-orange-300 w-1/2 px-12 py-16">
          <div className="text-center text-white">
            <h1 className="text-5xl font-bold mb-4">FinanceMentor</h1>
            <p className="text-lg mb-6">
              Stay on top of your personal finance goals with ease. Manage your
              income, expenses, and savings effortlessly.
            </p>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center bg-grey-100 px-4 py-12 md:px-6 lg:px-8">
          <Outlet />
        </div>
      </div>
    </>
  );
};

export default AuthLayout;
