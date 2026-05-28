import React, { useState } from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { serverUrl } from "../App";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../../firebase";
import { ClipLoader } from "react-spinners";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice";

export default function SignUp() {
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("user");
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handelSignUp = async () => {
    setLoading(true);
    try {
      const payload = { fullName, email, password, mobile, role };
      const result = await axios.post(`${serverUrl}/api/auth/signup`, payload, {
        withCredentials: true,
      });
      dispatch(setUserData(result.data.user));
      setErr("");
      setLoading(false);
      navigate("/");
    } catch (error) {
      setErr(error?.response?.data?.message || "Sign up failed");
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (!mobile) {
      return setErr("Please enter your mobile number first for Google Signup");
    }
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const { data } = await axios.post(
        `${serverUrl}/api/auth/google-auth`,
        {
          fullName: result.user.displayName,
          email: result.user.email,
          mobile,
          role,
        },
        { withCredentials: true }
      );
      dispatch(setUserData(data.user));
      navigate("/");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#fcfaf8] relative overflow-hidden">
      {/* Decorative Blobs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#ff4d2d]/5 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-orange-400/5 rounded-full blur-[100px] translate-x-1/3 translate-y-1/3 pointer-events-none"></div>

      <div className="bg-white/90 backdrop-blur-xl rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-lg p-8 sm:p-10 border border-white relative z-10 animate-slideUp my-8">
        <h1 className="text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-[#ff4d2d] to-[#ff7a55] tracking-tight">
          Vingo
        </h1>
        <p className="text-gray-500 mb-8 font-medium">
          Create your account to get started with delicious food deliveries.
        </p>

        <div className="space-y-4">
          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-gray-700 font-bold mb-1.5 text-sm ml-1">
              Full Name
            </label>
            <input
              type="text"
              className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-4 focus:ring-[#ff4d2d]/10 focus:border-[#ff4d2d] transition-all duration-300 font-medium text-gray-800"
              placeholder="Enter your Full Name"
              onChange={(e) => setFullName(e.target.value)}
              value={fullName}
              required
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-gray-700 font-bold mb-1.5 text-sm ml-1">
                Email
              </label>
              <input
                type="email"
                className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-4 focus:ring-[#ff4d2d]/10 focus:border-[#ff4d2d] transition-all duration-300 font-medium text-gray-800"
                placeholder="Enter email"
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                required
              />
            </div>
            
            {/* Mobile */}
            <div>
              <label htmlFor="mobile" className="block text-gray-700 font-bold mb-1.5 text-sm ml-1">
                Mobile Number
              </label>
              <input
                type="number"
                className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-4 focus:ring-[#ff4d2d]/10 focus:border-[#ff4d2d] transition-all duration-300 font-medium text-gray-800"
                placeholder="Enter mobile"
                onChange={(e) => setMobile(e.target.value)}
                value={mobile}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-gray-700 font-bold mb-1.5 text-sm ml-1">
              Password
            </label>
            <div className="relative">
              <input
                type={`${!showPassword ? "password" : "text"}`}
                className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-4 focus:ring-[#ff4d2d]/10 focus:border-[#ff4d2d] transition-all duration-300 font-medium text-gray-800 pr-12"
                placeholder="Enter your password"
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                required
              />
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#ff4d2d] cursor-pointer transition-colors"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {!showPassword ? <FaRegEye size={18} /> : <FaRegEyeSlash size={18} />}
              </button>
            </div>
          </div>

          {/* Role */}
          <div className="pt-2">
            <label className="block text-gray-700 font-bold mb-2 text-sm ml-1">
              I want to use this app as:
            </label>
            <div className="flex gap-2 sm:gap-3">
              {[
                { id: "user", label: "Customer" },
                { id: "owner", label: "Restaurant" },
                { id: "deliveryBoy", label: "Delivery" }
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  className={`flex-1 rounded-2xl py-3 px-1 text-center font-bold text-sm sm:text-base transition-all duration-300 ${
                    role === r.id
                      ? "bg-gradient-to-r from-[#ff4d2d] to-[#ff7a55] text-white shadow-md shadow-[#ff4d2d]/20 border border-transparent"
                      : "bg-white text-gray-500 border border-gray-200 hover:border-[#ff4d2d]/50 hover:bg-orange-50/30"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          disabled={loading}
          onClick={handelSignUp}
          className="w-full mt-8 flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 transition-all duration-300 bg-gradient-to-r from-[#ff4d2d] to-[#ff7a55] text-white font-bold hover:shadow-lg hover:shadow-[#ff4d2d]/30 hover:-translate-y-0.5 active:scale-95 disabled:opacity-70 disabled:hover:translate-y-0"
        >
          {loading ? <ClipLoader size={20} color="white" /> : "Sign Up"}
        </button>

        {err && <p className="text-red-500 text-center mt-3 font-semibold text-sm animate-fadeIn">*{err}</p>}

        <div className="relative my-7">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-400 font-medium">Or register with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleAuth}
          className="w-full flex items-center cursor-pointer justify-center gap-3 bg-white border border-gray-200 rounded-2xl px-4 py-3.5 transition-all duration-300 hover:bg-gray-50 hover:border-gray-300 font-bold text-gray-700 active:scale-95"
        >
          <FcGoogle size={22} /> <span>Google</span>
        </button>
        
        <p className="text-center mt-8 font-medium text-gray-500">
          Already have an account?{" "}
          <span 
            className="text-[#ff4d2d] font-bold cursor-pointer hover:underline"
            onClick={() => navigate("/signin")}
          >
            Sign In
          </span>
        </p>
      </div>
    </div>
  );
}
