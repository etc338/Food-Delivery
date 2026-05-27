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

export default function SignIn() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handelSignIn = async () => {
    setLoading(true);
    try {
      const payload = { email, password };
      const result = await axios.post(`${serverUrl}/api/auth/signin`, payload, {
        withCredentials: true,
      });
      dispatch(setUserData(result.data.user));
      setErr("");
      setLoading(false);
      navigate("/");
    } catch (error) {
      setErr(error?.response?.data?.message || "Sign in failed");
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const { data } = await axios.post(
        `${serverUrl}/api/auth/google-auth`,
        { email: result.user.email },
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

      <div className="bg-white/90 backdrop-blur-xl rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-md p-10 border border-white relative z-10 animate-slideUp">
        <h1 className="text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-[#ff4d2d] to-[#ff7a55] tracking-tight">
          Vingo
        </h1>
        <p className="text-gray-500 mb-8 font-medium">
          Sign In to your account to get started with delicious food deliveries.
        </p>

        <div className="space-y-5">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-gray-700 font-bold mb-1.5 text-sm ml-1">
              Email
            </label>
            <input
              type="email"
              className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-4 focus:ring-[#ff4d2d]/10 focus:border-[#ff4d2d] transition-all duration-300 font-medium text-gray-800"
              placeholder="Enter your email"
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              required
            />
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
        </div>

        <div
          className="text-right mt-3 mb-6 text-[#ff4d2d] cursor-pointer font-bold text-sm hover:text-orange-600 transition-colors inline-block w-full"
          onClick={() => navigate("/forgot-password")}
        >
          Forgot Password?
        </div>

        <button
          disabled={loading}
          onClick={handelSignIn}
          className="w-full flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 transition-all duration-300 bg-gradient-to-r from-[#ff4d2d] to-[#ff7a55] text-white font-bold hover:shadow-lg hover:shadow-[#ff4d2d]/30 hover:-translate-y-0.5 active:scale-95 disabled:opacity-70 disabled:hover:translate-y-0"
        >
          {loading ? <ClipLoader size={20} color="white" /> : "Sign In"}
        </button>

        {err && <p className="text-red-500 text-center mt-3 font-semibold text-sm animate-fadeIn">*{err}</p>}

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-400 font-medium">Or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleAuth}
          className="w-full flex items-center cursor-pointer justify-center gap-3 bg-white border border-gray-200 rounded-2xl px-4 py-3.5 transition-all duration-300 hover:bg-gray-50 hover:border-gray-300 font-bold text-gray-700 active:scale-95"
        >
          <FcGoogle size={22} /> <span>Google</span>
        </button>
        
        <p className="text-center mt-8 font-medium text-gray-500">
          Don't have an account?{" "}
          <span 
            className="text-[#ff4d2d] font-bold cursor-pointer hover:underline"
            onClick={() => navigate("/signup")}
          >
            Sign Up
          </span>
        </p>
      </div>
    </div>
  );
}
