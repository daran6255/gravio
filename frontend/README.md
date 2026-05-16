# Frontend Boilerplate (React + TypeScript + Vite)

A modern, production-ready frontend boilerplate built with React, TypeScript, Vite, and Material UI.

## 🚀 Features

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite for lightning-fast development and building
- **Styling**: Material UI (MUI) v6 with Emotion
- **State Management**: Redux Toolkit for global state
- **Routing**: React Router v7
- **HTTP Client**: Axios for API requests
- **Notifications**: Notistack for toast notifications
- **Linting**: ESLint with TypeScript support

## 📁 Project Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── assets/             # Images, fonts, etc.
│   ├── components/         # Reusable UI components
│   │   ├── layout/         # Layout components (Header, Footer, Sidebar)
│   │   └── dashboard/      # Dashboard specific components
│   ├── context/            # React Contexts
│   ├── hooks/              # Custom React Hooks
│   ├── models/             # TypeScript interfaces and types
│   ├── pages/              # Page components (views)
│   ├── router/             # Route definitions and navigation logic
│   ├── services/           # API service modules
│   ├── store/              # Redux setup (slices, store config)
│   ├── theme/              # MUI theme customization
│   ├── App.tsx             # Root component
│   └── main.tsx            # Entry point
├── .env                    # Environment variables
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite configuration
```

## 🛠️ Quick Start

### Prerequisites

- Node.js 18+
- npm (comes with Node.js)

### Installation

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment:**
    Copy `.env.example` to `.env` and update the values.
    ```bash
    cp .env.example .env
    ```

4.  **Start Development Server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

## 📜 Scripts

| Script | Description |
| :--- | :--- |
| `npm run dev` | Starts the development server with HMR. |
| `npm run build` | Builds the application for production (tsc + vite build). |
| `npm run lint` | Runs ESLint to check for code quality issues. |
| `npm run preview` | Locally preview the production build. |

## 🔧 Configuration

### Environment Variables

| Variable | Description |
| :--- | :--- |
| `VITE_API_URL` | Base URL for the backend API (e.g., `http://localhost:8000/api/v1`). |

### Theme

The application uses Material UI. Theme customization is located in `src/theme/`. You can modify colors, typography, and component defaults there.

## 🤝 Best Practices

- **Components**: Keep components small and focused. Use the `components` folder for reusable UI elements.
- **State**: Use local state (`useState`) for component-specific logic and Redux (`store`) for global data.
- **API**: All API calls should be defined in `src/services/` to separate data fetching from UI logic.
- **Types**: Always define interfaces/types for props and API responses in `src/models/`.

## 📦 Deployment

Build the application:
```bash
npm run build
```
This generates a `dist` folder containing static files that can be served by Nginx, Vercel, Netlify, or AWS S3.
