"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import FormInput from "../../components/ui/FormInput"
import Button from "../../components/ui/Button"
import AvatarUpload from "../../components/ui/AvatarUpload"
import { authService } from "../../services/authService"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    bio: "",
    location: ""
  })
  const [avatar, setAvatar] = useState(null)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleInputChange = (field) => (e) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid"
    }



    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    try {
      const formDataToSend = new FormData()
      formDataToSend.append("name", formData.name)
      formDataToSend.append("email", formData.email)
      formDataToSend.append("password", formData.password)
      formDataToSend.append("bio", formData.bio)
      formDataToSend.append("location", formData.location)
      
      if (avatar) {
        formDataToSend.append("avatar", avatar)
      }

      const response = await authService.register(formDataToSend)
      
      if (response.message) {
        // Redirect to OTP verification page with email
        router.push(`/verify-otp?email=${encodeURIComponent(formData.email)}`)
      }
    } catch (error) {
      console.error("Registration error:", error)
      if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message })
      } else {
        setErrors({ general: "Registration failed. Please try again." })
      }
    } finally {
      setLoading(false)
    }
  } 

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-[#1a1a1a] rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Join Think Twice</h1>
            <p className="text-gray-400">Create your account to start making better decisions</p>
          </div>

          {errors.general && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
              <p className="text-red-400 text-sm">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <AvatarUpload onImageSelect={setAvatar} />

            <FormInput
              label="Full Name"
              type="text"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleInputChange("name")}
              required
              error={errors.name}
            />

            <FormInput
              label="Email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleInputChange("email")}
              required
              error={errors.email}
            />

            <FormInput
              label="Password"
              type="password"
              placeholder="Create a password (min. 6 characters)"
              value={formData.password}
              onChange={handleInputChange("password")}
              required
              error={errors.password}
            />

            <FormInput
              label="Confirm Password"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleInputChange("confirmPassword")}
              required
              error={errors.confirmPassword}
            />

            <FormInput
              label="Bio (Optional)"
              type="text"
              placeholder="Tell us about yourself"
              value={formData.bio}
              onChange={handleInputChange("bio")}
            />

            <FormInput
              label="Location (Optional)"
              type="text"
              placeholder="Where are you from?"
              value={formData.location}
              onChange={handleInputChange("location")}
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}