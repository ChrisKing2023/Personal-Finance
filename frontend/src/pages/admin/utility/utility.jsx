import { Link } from "react-router-dom";

const UtilityPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-orange-100 p-6">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-lg text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Utility Management
        </h1>
        <div className="flex flex-col space-y-4">
          <Link
            to="/admin/currency"
            className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-all"
          >
            Manage Currencies
          </Link>
          <Link
            to="/admin/category"
            className="block w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition-all"
          >
            Manage Categories
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UtilityPage;
