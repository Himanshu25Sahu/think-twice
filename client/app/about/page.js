// app/about/page.jsx
"use client";

import { useRouter } from "next/navigation";

export default function About() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white flex flex-col items-center justify-center px-6 py-12">
      
      {/* Title */}
      <h1 className="text-5xl md:text-6xl font-extrabold text-center mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
        Think Twice
      </h1>

      {/* Subtitle */}
      <p className="text-lg md:text-xl text-gray-300 text-center max-w-3xl mb-8">
        A full-stack decision-making app showcasing{" "}
        <span className="text-blue-400 font-semibold">real-world DevOps</span>.
        From containerized backend to cloud deployments, CI/CD pipelines, and
        automated testing — this project is a playground to demonstrate{" "}
        <span className="text-purple-400 font-semibold">
          developer → ops workflow mastery.
        </span>
      </p>

      {/* Pipeline Animation */}
<div className="max-w-3xl w-full bg-gray-900 rounded-2xl shadow-2xl p-8 border border-gray-700 mb-10">
  <h2 className="text-3xl font-extrabold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
    🚀 My DevOps Playground
  </h2>

  <p className="text-gray-300 text-center text-sm mb-6">
    This project isn’t just an app — it’s a full-stack experiment to showcase my skills
    in <span className="text-blue-400 font-semibold">Docker</span>, 
    <span className="text-purple-400 font-semibold"> CI/CD pipelines</span>, and 
    <span className="text-green-400 font-semibold"> scalable deployments</span>.  
    Here’s what I’ve built and what’s coming next:
  </p>

  <div className="flex flex-col space-y-5">
    {[
      { text: "Dockerized backend setup", status: "done" },
      { text: "Render deployment working", status: "done" },
      { text: "Vercel frontend connected", status: "done" },
      { text: "GitHub Actions CI", status: "coming" },
      { text: "Jest tests before merge", status: "coming" },
      { text: "Auto deploy on commit", status: "coming" },
    ].map((item, i) => (
      <div
        key={i}
        className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-2 hover:scale-[1.02] transition-transform"
      >
        <div className="flex items-center space-x-3">
          <div
            className={`h-3 w-3 rounded-full ${
              item.status === "done"
                ? "bg-green-400 animate-pulse"
                : "bg-yellow-400 animate-bounce"
            }`}
          ></div>
          <p
            className={`text-sm ${
              item.status === "done" ? "text-green-300" : "text-yellow-300"
            }`}
          >
            {item.text}
          </p>
        </div>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full border ${
            item.status === "done"
              ? "border-green-500 text-green-400 bg-green-900/30"
              : "border-yellow-500 text-yellow-400 bg-yellow-900/30"
          }`}
        >
          {item.status === "done" ? "LIVE" : "COMING SOON"}
        </span>
      </div>
    ))}
  </div>

  {/* Animated DevOps Bar */}
  <div className="mt-8">
    <div className="h-3 bg-gray-700 rounded-full overflow-hidden relative">
      <div className="h-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-[progress_4s_linear_infinite]" />
    </div>
    <p className="mt-3 text-center text-xs text-gray-400 italic">
      ⚙️ The pipeline is still cooking... watch this space!
    </p>
  </div>

  <style jsx>{`
    @keyframes progress {
      0% {
        width: 0%;
      }
      50% {
        width: 85%;
      }
      100% {
        width: 0%;
      }
    }
  `}</style>
</div>


      {/* Login Redirect Button */}
      <button
        onClick={() => router.push("/login")}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-lg font-semibold shadow-lg transition mb-8"
      >
        Go to Login →
      </button>

      {/* Tech Stack Section */}
      <div className="max-w-3xl text-center mb-12">
        <h3 className="text-xl font-bold mb-3 text-gray-200">
          🔧 Tech Stack Behind the Scenes
        </h3>
        <p className="text-gray-400 text-sm leading-relaxed">
          <span className="text-blue-400 font-medium">Frontend:</span> Next.js,
          TailwindCSS, Redux <br />
          <span className="text-blue-400 font-medium">Backend:</span> Express.js,
          Node.js, MongoDB Atlas <br />
          <span className="text-blue-400 font-medium">Infrastructure:</span>{" "}
          Docker, Docker Compose, Render (Backend), Vercel (Frontend) <br />
          <span className="text-blue-400 font-medium">Planned:</span> GitHub
          Actions CI/CD, Jest Unit Tests, Auto Deploy
        </p>
      </div>

      {/* GitHub CTA */}
      <a
        href="https://github.com/Himanshu25Sahu/think-twice"
        target="_blank"
        rel="noopener noreferrer"
        className="mb-6 inline-block text-blue-400 underline hover:text-blue-300 transition"
      >
        View Project on GitHub →
      </a>

      {/* Footer */}
      <footer className="text-xs text-gray-600">
        Made with ❤️ for learning DevOps workflows
      </footer>
    </div>
  );
}
