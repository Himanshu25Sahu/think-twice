"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FormInput from "../../components/ui/FormInput";
import Button from "../../components/ui/Button";
import { authService } from "../../services/authService";
import { useDispatch } from "react-redux";
import { login } from "../../redux/slices/authSlice";

export default function VerifyOtpPageContent() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    } else {
      router.push("/register");
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Only allow numbers
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus to next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join("");
    
    if (otpCode.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    if (loading) return; // Prevent multiple submissions

    setLoading(true);
    setError("");

    try { 
      const response = await authService.verifyOtp({ email, otp: otpCode });
      
      if (response.user) {
        dispatch(login.fulfilled({
          user: response.user,
          token: response.token,
          message: response.message
        }));
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      setError(error.response?.data?.message || "Invalid OTP. Please try again.");
      setOtp(["", "", "", "", "", ""]); // Reset OTP on failure
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    try {
      setResendCooldown(60); // 60 seconds cooldown
      setError("");
      await authService.resendOtp(email); // Assuming you add this endpoint
    } catch (error) {
      setError("Failed to resend OTP. Please try again.");
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-[#1a1a1a] rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Verify Your Email</h1>
            <p className="text-gray-400">
              Enter the 6-digit code sent to{" "}
              <span className="text-blue-400">{email}</span>
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center space-x-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 bg-[#0d0d0d] border border-gray-700 rounded-xl text-center text-white text-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus={index === 0}
                />
              ))}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Didn&#39;t receive the code?{" "}
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0}
                className={`text-blue-400 hover:text-blue-300 transition-colors ${
                  resendCooldown > 0 ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
              </button>
            </p>
          </div>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => router.push("/register")}
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              ← Back to registration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}