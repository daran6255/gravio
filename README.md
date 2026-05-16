# WinVinaya CRM System

Welcome to the WinVinaya CRM project repository. This is a robust, full-stack Client Relationship Management system designed to streamline operations for the WinVinaya Foundation. It manages candidate registrations, internal user administration, and key organizational metrics.

## 📂 Documentation

We have comprehensive documentation to help you understand, deploy, and use the system.

### 📘 For Users & Stakeholders
*   **[Application User Manual](docs/APPLICATION_USER_MANUAL.md)**: A complete guide for End Users (Candidates) and Administrators.
*   **[Application Workflow](docs/APPLICATION_WORKFLOW.md)**: Visual and descriptive overview of key business processes (Registration, Login, etc.).


### �️ Architecture & Deployment
*   **[Architecture & Design](docs/ARCHITECTURE_AND_DESIGN.md)**: Technical diagrams (Mermaid) of the Application, Deployment, and CI/CD pipelines.
*   **[Initial Deployment Guide](docs/INITIAL_DEPLOYMENT.md)**: Step-by-step technical guide to setting up the server from scratch (EC2, Nginx, Postgres, PM2).
*   **[CI/CD Workflow Guide](docs/CI_CD_WORKFLOW_GUIDE.md)**: Instructions on how to trigger automated tests and deployments using Git.
*   **[Jules Integration & Usage Guide](docs/JULES_GUIDE.md)**: Steps to setup and use Jules (Google Labs AI Agent) for automated coding tasks.
*   **[Optimization and Architecture](docs/OPTIMIZATION_AND_ARCHITECTURE.md)**: Non-technical breakdown of cost savings and performance strategies (Cost Analysis included).

---

## 🚀 Live Environments

The application is deployed across three environments to ensure stability and quality assurance.

| Environment | Purpose | App URL | API Documentation |
| :--- | :--- | :--- | :--- |
| **Development** | *"The Kitchen"* - For active development and experimentation. | [https://dev.winvinaya.com](https://dev.winvinaya.com) | [API Docs](https://dev-api.winvinaya.com/docs) |
| **QA** | *"The Tasting Room"* - For testing stable features before release. | [https://qa.winvinaya.com](https://qa.winvinaya.com) | [API Docs](https://qa-api.winvinaya.com/docs) |
| **Production** | *"The Dining Hall"* - The live, stable environment for end-users. | [https://winvinaya.com](https://winvinaya.com) | [API Docs](https://api.winvinaya.com/docs) |

---

## �️ Tech Stack
*   **Frontend**: React, TypeScript, Vite, Material UI (MUI).
*   **Backend**: Python FastAPI, SQLAlchemy, Pydantic.
*   **Database**: PostgreSQL.
*   **Infrastructure**: AWS EC2, Nginx, PM2, GitHub Actions.

## � Local Development Setup
To run the project locally on your machine:

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/winvinayainfosystemsindia/winvinaya-crm.git
    cd winvinaya-crm
    ```

2.  **Backend Setup**:
    Refer to **[backend/README.md](backend/README.md)** for instructions on setting up the Python environment and database.

3.  **Frontend Setup**:
    Refer to **[frontend/README.md](frontend/README.md)** for instructions on installing Node.js dependencies and starting the dev server.