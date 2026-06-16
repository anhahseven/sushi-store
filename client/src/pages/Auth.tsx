import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import InkReveal from "../components/ui/ink-reveal";
import { Mail, Lock, ArrowLeft } from "lucide-react";
import axios from "axios";

export const Auth: React.FC = () => {
  const { login, checkAuth } = useAuth();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  const API_BASE = import.meta.env.VITE_API_URL || "";



  const handleAuth = async (e: React.FormEvent, endpoint: string) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (endpoint === "/login") {
        const res = await login(email, password);
        if (res.success) {
          setSuccessMsg("Login Successful!");
          setTimeout(() => {
            const role = res.role?.trim().toLowerCase();
            if (role === "staff") navigate("/staff/menu");
            else if (["admin", "manager", "store_manager"].includes(role || "")) navigate("/admin/dashboard");
            else navigate("/");
          }, 1000);
        } else {
          setErrorMsg(res.error || "Login failed");
        }
      } else {
        // Register
        const res = await axios.post(`${API_BASE}/register`, {
          username: email,
          password,
        });
        setSuccessMsg(res.data.message || "Registration Successful!");
        await checkAuth();
        setTimeout(() => {
          navigate("/");
        }, 1000);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || "Connection error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex justify-center items-center flex-col font-sans h-screen w-screen px-4 overflow-hidden bg-gray-50">
      {/* Underlying Japanese Scenic Background Image */}
      <img
        src="https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=1600&q=80"
        alt="Japanese scenic view background"
        className="absolute inset-0 w-full h-full object-cover z-0 select-none pointer-events-none"
      />

      {/* InkReveal scratch-off canvas overlay (White overlay) */}
      <InkReveal maskColor={[255, 255, 255]} className="absolute inset-0 w-full h-full z-10" />

      {/* Back to Home Button */}
      <Link
        to="/"
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-5 py-2.5 bg-white/80 backdrop-blur-md border border-gray-200/50 text-gray-800 rounded-full hover:bg-white transition duration-300 shadow-md font-semibold text-sm"
      >
        <ArrowLeft className="w-4 h-4 text-orange-500" /> Back to Home
      </Link>

      {/* Notification Toast */}
      {(errorMsg || successMsg) && (
        <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none">
          <div
            className={`${
              errorMsg ? "bg-red-500" : "bg-green-500"
            } text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 border-2 border-white/20`}
            style={{ animation: "slideIn 0.5s forwards" }}
          >
            <div className="text-2xl">
              <i
                className={`fa-solid ${
                  errorMsg ? "fa-circle-exclamation" : "fa-circle-check"
                }`}
              ></i>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm uppercase tracking-wide opacity-80">
                {errorMsg ? "Error" : "Success"}
              </span>
              <span className="font-bold text-base">{errorMsg || successMsg}</span>
            </div>
          </div>
        </div>
      )}

      {/* Auth Container */}
      <div
        className={`bg-white/95 backdrop-blur-sm rounded-[32px] shadow-2xl border border-gray-100 relative z-20 w-[780px] max-w-full min-h-[500px] overflow-hidden transition-all duration-700 ease-in-out ${
          isSignUp ? "right-panel-active" : ""
        }`}
        id="container"
      >
        {/* Sign Up Panel */}
        <div
          className={`absolute top-0 h-full transition-all duration-700 ease-in-out left-0 w-full md:w-1/2 ${
            isSignUp
              ? "opacity-100 z-5 translate-x-0 md:translate-x-full"
              : "opacity-0 z-1 pointer-events-none md:translate-x-0"
          }`}
        >
          <form
            onSubmit={(e) => handleAuth(e, "/register")}
            className="bg-transparent flex flex-col items-center justify-center h-full px-8 md:px-12 text-center"
          >
            <h1 className="font-bold text-3xl mb-1 text-gray-800 tracking-tight">Create Account</h1>
            <p className="text-sm text-gray-500 mb-6">Join us to start ordering delicious sushi!</p>

            <a
              href={`${API_BASE}/auth/google`}
              className="flex items-center justify-center gap-3 border border-gray-200 rounded-xl px-4 py-2.5 w-full text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 transition duration-300 mb-4 shadow-sm bg-white"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.64l3.15-3.15C17.45 1.84 14.97 1 12 1 7.35 1 3.39 3.67 1.44 7.56l3.8 2.94C6.14 7.5 8.87 5.04 12 5.04z"/>
                <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.28 1.48-1.12 2.73-2.38 3.58l3.7 2.87c2.16-1.99 3.41-4.92 3.41-8.6z"/>
                <path fill="#FBBC05" d="M5.24 14.5a7.12 7.12 0 010-4.5L1.44 7.06a11.96 11.96 0 000 9.88l3.8-2.94z"/>
                <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.7-2.87c-1.03.69-2.35 1.1-4.26 1.1-3.13 0-5.86-2.46-6.76-5.46L1.44 15.8C3.39 19.69 7.35 22 12 23z"/>
              </svg>
              <span>Continue with Google</span>
            </a>

            <div className="flex items-center w-full my-2">
              <hr className="flex-grow border-gray-200" />
              <span className="px-3 text-xs text-gray-400 uppercase">or</span>
              <hr className="flex-grow border-gray-200" />
            </div>

            <div className="relative w-full mb-3">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                autoComplete="email"
                required
                className="bg-gray-50/50 border border-gray-200 hover:border-orange-300 focus:border-orange-500 pl-12 pr-4 py-3 w-full rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-4 focus:ring-orange-100 transition duration-300"
              />
            </div>
            <div className="relative w-full mb-4">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose Password"
                autoComplete="new-password"
                required
                className="bg-gray-50/50 border border-gray-200 hover:border-orange-300 focus:border-orange-500 pl-12 pr-4 py-3 w-full rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-4 focus:ring-orange-100 transition duration-300"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl border border-orange-500 bg-orange-500 text-white text-sm font-bold py-3 uppercase tracking-wider transition transform hover:bg-orange-600 hover:scale-[1.02] active:scale-95 focus:outline-none shadow-md shadow-orange-500/20"
            >
              {loading ? "Creating..." : "Sign Up"}
            </button>

            <p className="md:hidden mt-6 text-sm text-gray-500">
              Already have an account?{" "}
              <a
                onClick={() => setIsSignUp(false)}
                className="text-orange-500 font-bold cursor-pointer hover:underline"
              >
                Sign In
              </a>
            </p>
          </form>
        </div>

        {/* Sign In Panel */}
        <div
          className={`absolute top-0 h-full transition-all duration-700 ease-in-out left-0 w-full md:w-1/2 ${
            isSignUp
              ? "opacity-0 z-1 pointer-events-none md:translate-x-full"
              : "opacity-100 z-5 translate-x-0"
          }`}
        >
          <form
            onSubmit={(e) => handleAuth(e, "/login")}
            className="bg-transparent flex flex-col items-center justify-center h-full px-8 md:px-12 text-center"
          >
            <h1 className="font-bold text-3xl mb-1 text-gray-800 tracking-tight">Welcome Back</h1>
            <p className="text-sm text-gray-500 mb-6">We're so excited to see you again!</p>

            <a
              href={`${API_BASE}/auth/google`}
              className="flex items-center justify-center gap-3 border border-gray-200 rounded-xl px-4 py-2.5 w-full text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 transition duration-300 mb-4 shadow-sm bg-white"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.64l3.15-3.15C17.45 1.84 14.97 1 12 1 7.35 1 3.39 3.67 1.44 7.56l3.8 2.94C6.14 7.5 8.87 5.04 12 5.04z"/>
                <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.28 1.48-1.12 2.73-2.38 3.58l3.7 2.87c2.16-1.99 3.41-4.92 3.41-8.6z"/>
                <path fill="#FBBC05" d="M5.24 14.5a7.12 7.12 0 010-4.5L1.44 7.06a11.96 11.96 0 000 9.88l3.8-2.94z"/>
                <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.7-2.87c-1.03.69-2.35 1.1-4.26 1.1-3.13 0-5.86-2.46-6.76-5.46L1.44 15.8C3.39 19.69 7.35 22 12 23z"/>
              </svg>
              <span>Continue with Google</span>
            </a>

            <div className="flex items-center w-full my-2">
              <hr className="flex-grow border-gray-200" />
              <span className="px-3 text-xs text-gray-400 uppercase">or</span>
              <hr className="flex-grow border-gray-200" />
            </div>

            <div className="relative w-full mb-3">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                autoComplete="username"
                required
                className="bg-gray-50/50 border border-gray-200 hover:border-orange-300 focus:border-orange-500 pl-12 pr-4 py-3 w-full rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-4 focus:ring-orange-100 transition duration-300"
              />
            </div>
            <div className="relative w-full mb-3">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="current-password"
                required
                className="bg-gray-50/50 border border-gray-200 hover:border-orange-300 focus:border-orange-500 pl-12 pr-4 py-3 w-full rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-4 focus:ring-orange-100 transition duration-300"
              />
            </div>

            <a href="#" className="text-xs text-gray-400 mb-4 hover:text-orange-500 transition hover:underline self-end">
              Forgot your password?
            </a>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl border border-orange-500 bg-orange-500 text-white text-sm font-bold py-3 uppercase tracking-wider transition transform hover:bg-orange-600 hover:scale-[1.02] active:scale-95 focus:outline-none shadow-md shadow-orange-500/20"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <p className="md:hidden mt-6 text-sm text-gray-500">
              Don't have an account?{" "}
              <a
                onClick={() => setIsSignUp(true)}
                className="text-orange-500 font-bold cursor-pointer hover:underline"
              >
                Sign Up
              </a>
            </p>
          </form>
        </div>

        {/* Sliding overlay panel for desktop screens */}
        <div className="hidden md:block absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-transform duration-700 ease-in-out z-[100] overlay-container">
          <div
            className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 text-white relative h-full w-[200%] -left-full transform transition-transform duration-700 ease-in-out"
            style={{
              transform: isSignUp ? "translateX(50%)" : "translateX(0)",
            }}
          >
            {/* Left Overlay (Welcome Back) */}
            <div
              className="absolute flex items-center justify-center flex-col p-10 text-center top-0 h-full w-1/2 transition-transform duration-700 ease-in-out"
              style={{
                transform: isSignUp ? "translateX(0)" : "translateX(-20%)",
              }}
            >
              <h1 className="font-bold text-3xl mb-4 text-white">Welcome Back!</h1>
              <p className="text-sm leading-6 mb-8 text-white/95 font-medium">
                To keep connected with us please login with your personal info
              </p>
              <button
                onClick={() => setIsSignUp(false)}
                className="bg-transparent border-2 border-white text-white rounded-xl text-xs font-bold py-3 px-10 uppercase tracking-wider transition transform hover:bg-white hover:text-orange-600 hover:scale-105 active:scale-95 focus:outline-none shadow-md"
              >
                Sign In
              </button>
            </div>

            {/* Right Overlay (Hello Friend) */}
            <div
              className="absolute flex items-center justify-center flex-col p-10 text-center top-0 h-full w-1/2 right-0 transition-transform duration-700 ease-in-out"
              style={{
                transform: isSignUp ? "translateX(20%)" : "translateX(0)",
              }}
            >
              <h1 className="font-bold text-3xl mb-4 text-white">Hello, Friend!</h1>
              <p className="text-sm leading-6 mb-8 text-white/95 font-medium">
                Enter your personal details and start your journey with Us
              </p>
              <button
                onClick={() => setIsSignUp(true)}
                className="bg-transparent border-2 border-white text-white rounded-xl text-xs font-bold py-3 px-10 uppercase tracking-wider transition transform hover:bg-white hover:text-orange-600 hover:scale-105 active:scale-95 focus:outline-none shadow-md"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Responsive adjustments styles */}
      <style>{`
        .right-panel-active .overlay-container {
          transform: translateX(-100%);
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
