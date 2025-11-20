
# Community Connect Backend

This is the backend for the Community Connect application, a platform for reporting and managing community issues. It's a Node.js application using Express and MongoDB.

## Features

*   RESTful API for managing users and reports.
*   User authentication and authorization.
*   Admin panel for managing the application.
*   Image uploads to Cloudinary.
*   Email notifications for report status updates.

## Tech Stack

*   **Framework:** Express.js
*   **Database:** MongoDB with Mongoose
*   **Authentication:** JWT (JSON Web Tokens)
*   **Image Uploads:** Cloudinary, Multer
*   **Email:** Nodemailer
*   **Environment Variables:** dotenv
*   **CORS:** cors
*   **Development:** nodemon

## API Endpoints

### Auth Routes (`/api/auth`)

*   `POST /sync`: Syncs a user from Clerk to the database.
*   `GET /me`: Gets the current user's profile.
*   `GET /users`: Gets all users (Admin only).
*   `PATCH /promote/:userId`: Promotes a user to admin (Admin only).
*   `PATCH /demote/:userId`: Demotes an admin to resident (Admin only).
*   `PATCH /users/:userId/toggle-active`: Toggles a user's active status (Admin only).

### Report Routes (`/api/reports`)

*   `GET /`: Gets all reports with advanced filtering, search, and pagination.
*   `GET /search/suggestions`: Gets search suggestions.
*   `GET /stats/overview`: Gets searchable statistics.
*   `GET /stats/summary`: Gets a summary of report statistics.
*   `GET /:id`: Gets a single report.
*   `GET /:id/images`: Gets all images for a report.
*   `POST /`: Creates a new report.
*   `POST /:id/images`: Adds more images to an existing report.
*   `PUT /:id`: Updates a report.
*   `DELETE /:id`: Deletes a report.
*   `DELETE /:reportId/images/:imageIndex`: Deletes a specific image from a report.

### Admin Routes (`/api/admin`)

*   `GET /stats`: Gets dashboard overview statistics.
*   `GET /reports`: Gets all reports with admin filters.
*   `GET /users`: Gets all users for user management.
*   `PATCH /users/:id/role`: Updates a user's role.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

*   Node.js and npm (or yarn) installed on your machine.
*   MongoDB instance (local or cloud-based like MongoDB Atlas).
*   Cloudinary account for image storage.
*   Gmail account for sending emails (or other email provider).

### Installation

1.  Clone the repository:
    ```sh
    git clone https://github.com/your-username/final-project-community-connect.git
    ```
2.  Navigate to the backend directory:
    ```sh
    cd final-project-community-connect/backend
    ```
3.  Install the dependencies:
    ```sh
    npm install
    ```

### Environment Variables

Create a `.env` file in the `backend` directory and add the following environment variables:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password
```

### Running the Server

1.  Start the development server:
    ```sh
    npm run dev
    ```
2.  The server will be running on `http://localhost:5000`.

## Folder Structure

```
backend/
├── config/
│   ├── cloudinary.js
│   ├── database.js
│   └── email.js
├── middleware/
│   ├── auth.js
│   ├── image-optimizer.js
│   └── upload.js
├── models/
│   ├── Report.js
│   └── User.js
├── routes/
│   ├── admin.js
│   ├── auth.js
│   └── reports.js
├── scripts/
│   └── ... # Various utility scripts
├── utils/
│   └── cloudinary-cleanup.js
├── .env # Environment variables
├── .gitignore
├── package.json
├── README.md
└── server.js
```

## Available Scripts

In the project directory, you can run:

*   `npm start`: Runs the app in production mode.
*   `npm run dev`: Runs the app in development mode with nodemon.
*   `npm test`: (Not yet implemented)

## Dependencies

*   `@sendgrid/mail`: For sending emails via SendGrid.
*   `bcryptjs`: For hashing passwords.
*   `cloudinary`: For image uploads.
*   `cors`: For enabling CORS.
*   `dotenv`: For loading environment variables.
*   `express`: A web framework for Node.js.
*   `jsonwebtoken`: For creating JSON Web Tokens.
*   `mongoose`: For MongoDB object modeling.
*   `multer`: For handling multipart/form-data (file uploads).
*   `multer-storage-cloudinary`: Cloudinary storage engine for Multer.
*   `nodemailer`: For sending emails.

## Dev Dependencies

*   `nodemon`: For automatically restarting the server during development.

## Deployment url
https://community-connect-kwwx.onrender.com

