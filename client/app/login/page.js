// app/login/page.js - FIXED
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { login, clearError } from "../../redux/slices/authSlice";
import FormInput from "../../components/ui/FormInput";
import Button from "../../components/ui/Button";
import { useRouter } from "next/navigation";
import api from "../../services/api"; // ADD THIS IMPORT

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isClient, setIsClient] = useState(false);

  const dispatch = useDispatch();
  const { loading, error, isAuthorized } = useSelector((state) => state.user);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    dispatch(clearError());
    
    // Check if already logged in - FIXED
    const checkAuthStatus = async () => {
      try {
        const authData = localStorage.getItem('auth');
        if (authData) {
          const response = await api.get('/auth/verify');
          if (response.data.isValid) {
            router.push("/dashboard");
          } else {
            localStorage.removeItem('auth');
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('auth');
      }
    };

    checkAuthStatus();
  }, [dispatch, router]);

  const handleInputChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(login(formData));
    if (login.fulfilled.match(result)) {
      router.push("/dashboard");
    }
  };

  const handleTestLogin = async () => {
    const result = await dispatch(
      login({ email: "himpreetak@gmail.com", password: "1234" })
    );
    if (login.fulfilled.match(result)) {
      router.push("/dashboard");
    }
  };

  if (!isClient) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-[#1a1a1a] rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-gray-400">Sign in to your Judgment Call account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <FormInput
              label="Email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleInputChange("email")}
              required
            />

            <FormInput
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleInputChange("password")}
              required
            />

            {error && <p className="text-red-500 text-center">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-4">
            <Button
              type="button"
              className="w-full bg-gray-700 hover:bg-gray-600"
              onClick={handleTestLogin}
              disabled={loading}
            >
              {loading ? "Signing In..." : "Login as Test User"}
            </Button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Dont have an account?{" "}
              <Link href="/register" className="text-blue-400 hover:text-blue-300">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}