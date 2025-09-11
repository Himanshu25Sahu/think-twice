
import Link from "next/link"
import Button from "../components/ui/Button"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold text-white mb-6">Think T</h1>
        <p className="text-xl text-gray-400 mb-8">Your Social Decision Journal</p>
        <p className="text-gray-500 mb-12 max-w-lg mx-auto">
          Make better decisions with community insights. Track your choices, learn from outcomes, and build confidence
          in your judgment.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register">
            <Button className="w-full sm:w-auto">Get Started</Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary" className="w-full sm:w-auto">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
