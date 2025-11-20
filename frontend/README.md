# Community Connect Frontend

This is the frontend for the Community Connect application, a platform for reporting and managing community issues.

## Features

*   User authentication using Clerk.
*   Dashboard to view and manage reports.
*   Form to submit new reports.
*   Admin dashboard for administrative tasks.
*   Real-time updates using Socket.io.

## Tech Stack

*   **Framework:** React
*   **Build Tool:** Vite
*   **Routing:** React Router
*   **Authentication:** Clerk
*   **HTTP Client:** Axios
*   **Real-time Communication:** Socket.io
*   **Linting:** ESLint

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

*   Node.js and npm (or yarn) installed on your machine.
*   A running instance of the backend server.

### Installation

1.  Clone the repository:
    ```sh
    git clone https://github.com/your-username/final-project-community-connect.git
    ```
2.  Navigate to the frontend directory:
    ```sh
    cd final-project-community-connect/frontend
    ```
3.  Install the dependencies:
    ```sh
    npm install
    ```

### Running the Development Server

1.  Create a `.env` file in the `frontend` directory and add your Clerk publishable key:
    ```
    VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
    ```
2.  Start the development server:
    ```sh
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

## Folder Structure

```
frontend/
├── public/
│   └── ... # Public assets
├── src/
│   ├── assets/
│   │   └── ... # Images, icons, etc.
│   ├── components/
│   │   ├── AdminPanel.jsx
│   │   ├── Header.jsx
│   │   ├── ReportCard.jsx
│   │   ├── ReportForm.jsx
│   │   └── ... # Other UI components
│   ├── hooks/
│   │   └── useReportUpdate.js # Custom hooks
│   ├── lib/
│   │   └── clerk.js # Clerk configuration
│   ├── pages/
│   │   ├── AdminDashboard.jsx
│   │   ├── Dashboard.jsx
│   │   └── SubmitReport.jsx
│   ├── services/
│   │   └── api.js # API service layer
│   ├── App.jsx # Main application component
│   ├── index.css # Global styles
│   └── main.jsx # Entry point
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── README.md
└── vite.config.js
```

## Available Scripts

In the project directory, you can run:

*   `npm run dev`: Runs the app in development mode.
*   `npm run build`: Builds the app for production.
*   `npm run lint`: Lints the code using ESLint.
*   `npm run preview`: Serves the production build locally.

## Dependencies

*   `@clerk/clerk-react`: For authentication.
*   `axios`: For making HTTP requests to the backend.
*   `react`: A JavaScript library for building user interfaces.
*   `react-dom`: For rendering React components in the DOM.
*   `react-router-dom`: For routing and navigation.
*   `socket.io-client`: For real-time communication with the server.

## Dev Dependencies

*   `@vitejs/plugin-react`: Vite plugin for React.
*   `eslint`: For code linting.
*   `vite`: For the development server and build process.
*   And other ESLint plugins.