# 🧠 Think Twice — Decision Analytics & Performance Engineering Platform

**Think Twice** is a full-stack web application designed to help users make, log, and analyze decisions — all while being an experiment in **production readiness**, **DevOps automation**, and **system scalability**.

> 🚀 Built with modern web technologies, fully automated CI/CD pipelines, containerized services, and tested under real-world load conditions — from a simple idea to a production-grade system.

---

## 🌐 Live Demo

🔗 **Live:** [think-twice-six.vercel.app/about](https://think-twice-six.vercel.app/about)
💻 **GitHub Repo:** [github.com/Himanshu25Sahu/think-twice](https://github.com/Himanshu25Sahu/think-twice)

---

## 🧩 Key Highlights

✅ **4x faster performance** after Redis caching (800 ms → 218 ms)
✅ **300+ concurrent users handled** during load testing with 0 failures
✅ **CI/CD pipeline** automated from Git push → Docker build → Render + Vercel deploy
✅ **Containerized architecture** using Docker & Docker Compose
✅ **Load-balanced backend** using Nginx with round-robin routing
✅ **Real-time performance monitoring** via Prometheus

---

## ⚙️ Tech Stack

| Layer              | Technologies                              |
| ------------------ | ----------------------------------------- |
| **Frontend**       | Next.js, TailwindCSS, Redux               |
| **Backend**        | Node.js, Express.js, MongoDB              |
| **Caching**        | Redis                                     |
| **Infrastructure** | Docker, Docker Compose, Nginx, Prometheus |
| **Deployment**     | Render (Backend), Vercel (Frontend)       |
| **CI/CD Pipeline** | GitHub Actions + Docker Hub + Webhooks    |
| **Testing**        | Jest, Local Load Testing                  |

---

## 🧠 Architecture Overview

```
                ┌──────────────────────────┐
                │        Vercel App        │
                │ (Next.js + TailwindCSS)  │
                └────────────┬─────────────┘
                             │
                             ▼
              ┌───────────────────────────┐
              │     Nginx Load Balancer    │
              │   (Round-Robin Routing)    │
              └──────┬───────────┬────────┘
                     │           │
           ┌─────────▼─┐     ┌───▼────────┐
           │ Backend 1 │ ... │ Backend 3  │
           │ Node.js + │     │ Node.js +  │
           │ Express   │     │ Express    │
           └─────┬─────┘     └─────┬─────┘
                 ▼                 ▼
              ┌───────────────────────────┐
              │   MongoDB + Redis Cache    │
              └───────────────────────────┘
```

---

## 🔄 CI/CD Pipeline

A **zero-click DevOps pipeline** built with GitHub Actions, Docker, and webhooks — fully automated from push to production.

**Pipeline Stages:**

1. 🧩 **Code Push:** Developer pushes changes to `main`
2. ⚙️ **CI:** GitHub Actions builds, lints, and tests both frontend & backend inside Docker
3. 🐳 **Build & Push:** Backend Docker image pushed to Docker Hub
4. 🚀 **CD:** Render automatically redeploys backend with new image
5. ⚡ **Frontend Deploy:** Vercel rebuilds and redeploys the Next.js app

⏱️ **Total pipeline time:** ~3 minutes from push → live deployment

---

## 📊 Load Testing Results

| Users     | Avg Response Time | Success Rate |
| --------- | ----------------- | ------------ |
| 10 users  | 3–6 ms            | ✅ 100%       |
| 100 users | 2–39 ms           | ✅ 100%       |
| 300 users | 2–13 ms           | ✅ 100%       |

**Highlights:**

* 95% of requests under 8 ms (vs. ~200 ms industry average)
* 0 failed requests at 300 concurrent users
* Stable throughput at 10 req/sec for over 30 seconds
* Automatic failover and health checks ensured 100% uptime

---

## 🧠 Key Learnings

* How containerization (Docker) simplifies deployment and scaling
* How load balancing (Nginx) improves concurrency and reliability
* Why Redis caching drastically reduces first-load latency
* How CI/CD turns manual redeploys into fast, reliable automation
* Importance of observability — monitoring with Prometheus and health checks

---

## 🧑‍💻 Local Setup

```bash
# 1. Clone repo
git clone https://github.com/Himanshu25Sahu/think-twice.git
cd think-twice

# 2. Start containers
docker-compose up --build

# 3. Visit frontend
http://localhost:3000
```

---

## 🏗️ Future Improvements

* Add advanced analytics & visualization for decisions
* Implement Kubernetes-based scaling
* Introduce authentication & role-based access
* Deploy Prometheus metrics dashboard to cloud

---

## ✨ Author

👨‍💻 **Himanshu Sahu**
📍 Bengaluru, India
🔗 [Portfolio](https://himanshu25sahu.github.io/HimanshuSahu/) · [LinkedIn](https://linkedin.com/in/himanshu-sahu-303b2b25a/) · [GitHub](https://github.com/Himanshu25Sahu)

---

### ⭐ If you found this project useful, consider giving it a star!

> “From a simple decision tracker to a production-grade, load-balanced platform — **Think Twice** taught me how real systems scale, automate, and perform under pressure.”
