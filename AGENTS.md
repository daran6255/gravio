# AGENTS.md

Welcome, AI Agent! This file provides context and instructions for working on the Gravit project.

## 🚀 Project Overview
Gravit is an AI-driven, highly scalable multi-tenant ecosystem built for managing complex enterprise workflows, multi-tenant infrastructures, and automated processes. It integrates a Model Context Protocol (MCP) agentic AI engine with a modern full-stack architecture to enable automated planning, execution, and monitoring of organizational tasks.

## 🛠️ Tech Stack
- **Frontend**: React 19, TypeScript, Vite, Material UI (MUI) v6, Redux Toolkit, React Router v7. Located in [frontend](file:///c:/External-projects/Taydens/gravit/frontend).
- **Backend**: Python FastAPI, async SQLAlchemy ORM, Pydantic v2 validation, Loguru. Located in [backend](file:///c:/External-projects/Taydens/gravit/backend).
- **AI Engine**: MCP Agentic Framework, LLM Providers (Gemini, OpenAI, Ollama), task journaling.
- **Database & Cache**: PostgreSQL, Redis (production-only, optional for dev).
- **Infrastructure**: Docker & Docker Compose, Nginx, PM2, AWS EC2, GitHub Actions.

## 📂 Repository Structure
- [backend](file:///c:/External-projects/Taydens/gravit/backend): FastAPI application, Alembic database migrations, test suite, and AI Engine modules.
- [frontend](file:///c:/External-projects/Taydens/gravit/frontend): React + Vite application with MUI layouts and page components.
- [docs](file:///c:/External-projects/Taydens/gravit/docs): Core architecture guidelines, user manuals, deployment protocols, and AI Engine plans.
- [nginx](file:///c:/External-projects/Taydens/gravit/nginx): Configuration files for the reverse proxy and load balancer.

## ⌨️ Common Commands

### Backend
```bash
cd backend
# Create virtual environment and activate it
python -m venv venv
venv\Scripts\activate # On Unix: source venv/bin/activate
# Install dependencies
pip install -r requirements.txt
# Run migrations
alembic upgrade head
# Run development server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
# Run tests
pytest
```

### Frontend
```bash
cd frontend
# Install dependencies
npm install
# Run development server
npm run dev
# Build for production
npm run build
# Linting
npm run lint
```

## 🔄 Development Workflow
We follow a branch-based workflow with automated CI/CD.
1. Create a feature branch from `develop`.
2. Open a Pull Request to `develop` to trigger the **Pull Request CI** (Linting, Building, Backend Tests).
3. Merging to `develop` triggers deployment to the [Development Environment](https://dev.winvinaya.com).
4. Merging to `qa` triggers deployment to the [QA Environment](https://qa.winvinaya.com).
5. Merging to `main` triggers deployment to [Production](https://winvinaya.com).

Refer to [CI/CD Workflow Guide](file:///c:/External-projects/Taydens/gravit/docs/CI_CD_WORKFLOW_GUIDE.md) for more details.

## 📒 Coding Guidelines
- **Frontend**: Use Material UI components (MUI v6) and follow the established theme. Prefer functional components and hooks.
- **Backend**: Use asynchronous SQLAlchemy for database operations. Follow Pydantic v2 models for request/response validation.
- **Documentation**: Update [README.md](file:///c:/External-projects/Taydens/gravit/README.md) or [docs](file:///c:/External-projects/Taydens/gravit/docs) if you introduce significant changes.

## 🤖 Interaction with Jules
- Jules can be triggered via GitHub Issues by adding the `jules` label.
- Jules creates PRs for its changes, which should be reviewed by human developers.
