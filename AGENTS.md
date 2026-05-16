# AGENTS.md

Welcome, AI Agent! This file provides context and instructions for working on the WinVinaya CRM project.

## 🚀 Project Overview
WinVinaya CRM is a full-stack system for managing candidate registrations, internal administration, and organizational metrics for the WinVinaya Foundation.

## 🛠️ Tech Stack
- **Frontend**: React, TypeScript, Vite, Material UI (MUI). Located in `/frontend`.
- **Backend**: Python FastAPI, SQLAlchemy (Async), Pydantic. Located in `/backend`.
- **Database**: PostgreSQL.
- **Infrastructure**: AWS EC2, Nginx, PM2, GitHub Actions.

## 📂 Repository Structure
- `/backend`: FastAPI application, database migrations (Alembic), and tests.
- `/frontend`: React/Vite application.
- `/docs`: Detailed documentation on architecture, user manuals, and CI/CD.
- `.github/workflows`: CI/CD pipelines.

## ⌨️ Common Commands

### Backend
```bash
cd backend
# Install dependencies
pip install -r requirements.txt
# Run development server
uvicorn app.main:app --reload
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

Refer to [CI/CD Workflow Guide](docs/CI_CD_WORKFLOW_GUIDE.md) for more details.

## 📒 Coding Guidelines
- **Frontend**: Use Material UI components and follow the established theme. Prefer functional components and hooks.
- **Backend**: Use asynchronous SQLAlchemy for database operations. Follow Pydantic models for request/response validation.
- **Documentation**: Update [README.md](README.md) or `/docs` if you introduce significant changes.

## 🤖 Interaction with Jules
- Jules can be triggered via GitHub Issues by adding the `jules` label.
- Jules creates PRs for its changes, which should be reviewed by human developers.
