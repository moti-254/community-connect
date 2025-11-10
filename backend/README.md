# Community Connect - Backend

Node.js/Express backend API for the Community Connect application.

## Features
- RESTful API with Express.js
- MongoDB with Mongoose ODM
- JWT Authentication
- Image upload with Cloudinary
- Email notifications with Nodemailer
- Admin dashboard endpoints
- Advanced search and filtering

## API Endpoints
- `GET /api/health` - Health check
- `GET /api/reports` - Get reports (with filtering)
- `POST /api/reports` - Create new report
- `PUT /api/reports/:id` - Update report
- `GET /api/admin/stats` - Admin statistics
- `GET /api/admin/reports` - Admin reports view
- `GET /api/admin/users` - User management

## Environment Variables
See .env.example for required environment variables.

## Development
```bash
cd backend
npm install
npm run dev