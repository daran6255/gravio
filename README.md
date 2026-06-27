# Gravit

Welcome to the **Gravit** repository. Gravit is an AI-driven, highly scalable multi-tenant ecosystem built for managing complex enterprise workflows, multi-tenant infrastructures, and automated processes. 

By integrating a state-of-the-art Model Context Protocol (MCP) agentic AI engine with a modern full-stack architecture, Gravit enables automated planning, execution, and monitoring of organizational tasks.

---

## 🚀 Key Features

*   **AI-Driven Orchestration**: An integrated Model Context Protocol (MCP) agentic AI engine capable of task planning, automatic tool execution, and human-in-the-loop approvals.
*   **Highly Scalable Architecture**: Built with production-ready, async-first patterns supporting multi-tenant orchestration, Nginx load balancing, and Redis rate limiting.
*   **Modern Frontend**: A fully responsive interface constructed using React 19, TypeScript, Vite, Material UI (MUI) v6, and Redux Toolkit.
*   **Robust Backend**: Python FastAPI, async SQLAlchemy ORM, Pydantic v2 validation, Alembic migrations, and structured JSON logging.
*   **Enterprise Security**: JWT-based authentication (access/refresh tokens), strict CORS rules, rate-limiting, and security headers.

---

## 📂 Repository Structure

*   [backend](file:///c:/External-projects/Taydens/gravit/backend): Python FastAPI service, Alembic database migrations, test suite, and the AI Engine modules.
*   [frontend](file:///c:/External-projects/Taydens/gravit/frontend): React + Vite client application with MUI layout and page components.
*   [docs](file:///c:/External-projects/Taydens/gravit/docs): Core architecture guidelines, user manuals, deployment protocols, and AI Engine plans.
*   [nginx](file:///c:/External-projects/Taydens/gravit/nginx): Configuration files for the reverse proxy and load balancer.

---

## 🛠️ Tech Stack & Ecosystem

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Material UI (MUI) v6, Redux Toolkit, React Router v7 |
| **Backend** | Python FastAPI, SQLAlchemy (Async), Pydantic v2, Loguru |
| **AI Engine** | MCP Agentic Framework, LLM Providers (Gemini, OpenAI, Ollama), task journaling |
| **Database & Cache** | PostgreSQL, Redis (production-only, optional for dev) |
| **Infrastructure** | Docker & Docker Compose, Nginx, PM2, AWS EC2, GitHub Actions |

---

## 📘 Documentation

We maintain comprehensive documentation for developers and operators:

### 🤖 AI Engine & Architecture
*   [AI Engine Architecture Guide](file:///c:/External-projects/Taydens/gravit/docs/AI-Engine_plan.md): Detailed module layout, API endpoints, tool registry, and implementation phases of Gravit's AI agent.
*   [Architecture & Design Guide](file:///c:/External-projects/Taydens/gravit/docs/ARCHITECTURE_AND_DESIGN.md): System design and database topology visual models.

### 🌐 Operations & Deployment
*   [Initial Deployment Guide](file:///c:/External-projects/Taydens/gravit/docs/INITIAL_DEPLOYMENT.md): Setting up EC2, Nginx, PostgreSQL, PM2, and services from scratch.
*   [CI/CD Workflow Guide](file:///c:/External-projects/Taydens/gravit/docs/CI_CD_WORKFLOW_GUIDE.md): Pull requests, testing pipelines, and environment deployment triggers.
*   [Jules Integration & Usage Guide](file:///c:/External-projects/Taydens/gravit/docs/JULES_GUIDE.md): AI agent onboarding and repository workflow context.

---

## 🚀 Live Environments

| Environment | Purpose | App URL | API Documentation |
| :--- | :--- | :--- | :--- |
| **Development** | Active integration and sandbox experimentation. | [https://dev.winvinaya.com](https://dev.winvinaya.com) | [API Docs](https://dev-api.winvinaya.com/docs) |
| **QA** | Testing of release candidates and stable features. | [https://qa.winvinaya.com](https://qa.winvinaya.com) | [API Docs](https://qa-api.winvinaya.com/docs) |
| **Production** | Live, stable ecosystem for users and tenants. | [https://winvinaya.com](https://winvinaya.com) | [API Docs](https://api.winvinaya.com/docs) |

---

## 💻 Local Development Setup

Follow these steps to run Gravit locally:

### 1. Backend Setup
For detailed setup instructions, database migrations, and testing, please refer to [backend/README.md](file:///c:/External-projects/Taydens/gravit/backend/README.md).

```bash
# Navigate to the backend directory
cd backend

# Create virtual environment and activate it
python -m venv venv
source venv/bin/activate # On Windows: venv\Scripts\activate

# Install requirements
pip install -r requirements.txt

# Run migrations and start uvicorn
alembic upgrade head
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 2. Frontend Setup
For instructions on environment configuration and MUI theme customization, please refer to [frontend/README.md](file:///c:/External-projects/Taydens/gravit/frontend/README.md).

```bash
# Navigate to the frontend directory
cd frontend

# Install npm dependencies
npm install

# Start the local Vite server
npm run dev
```

### 3. Running with Docker (Optional)
To test the entire containerized stack locally (App + DB + Nginx proxy):
```bash
docker-compose up --build
```