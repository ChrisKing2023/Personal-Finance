import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import CommonForm from "@/components/common/form";
import { resigterFormControls } from "@/config";
import { useDispatch } from "react-redux";
import { registerUser } from "@/redux/authSlice";
import CurrencySelector from "@/components/user_components/CurrencySelector";

const initialState = {
  username: "",
  firstname: "",
  lastname: "",
  email: "",
  password: "",
  currency: "",
};

const AuthSignup = () => {
  const [formData, setFormData] = useState(initialState);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  function onSubmit(event) {
    event.preventDefault();
    console.log(formData);
    dispatch(registerUser(formData)).then((data) => {
      if (data?.payload?.success) navigate("/user/home");
    });
  }

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const referralToken = queryParams.get("referralToken");

    if (referralToken) {
      setFormData((prev) => ({ ...prev, referralCode: referralToken }));
    }
  }, []);

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-orange-300">
          Sign Up For FinanceMentor
        </h1>
        <p className="mt-2 text-gray-600">
          Already have an account?
          <Link
            className="font-medium ml-2 text-yellow-500 hover:underline"
            to="/auth/login"
          >
            Login
          </Link>
        </p>
      </div>
      <CommonForm
        formControls={resigterFormControls}
        buttonText={"Create Account"}
        formData={formData}
        setFormData={setFormData}
        onSubmit={onSubmit}
        customComponents={{ CurrencySelector }}
      />
    </div>
  );
};

export default AuthSignup;
