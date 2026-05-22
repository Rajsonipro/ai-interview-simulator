# TrackIt - MERN Expense Tracker

A modern, responsive, and fully-featured expense tracker built with the MERN stack (MongoDB, Express, React, Node.js). Designed to be clean, fast, and secure.

## Features
- **User Authentication**: Secure JWT-based login and registration (hashed with bcrypt).
- **Dashboard**: High-level overview of income, expenses, and balance with recent transactions and charts.
- **Transaction Management**: Add, view, delete, and filter transactions by type and date.
- **Analytics**: Category-wise pie chart breakdown to easily understand spending habits.
- **Budget Tracking**: Set a monthly budget and visually track progression with dynamic alerts.
- **Export**: Download transaction data in CSV and PDF formats cleanly.
- **Responsive & Dark Mode**: Professional, glassmorphic UI built using Tailwind CSS that works beautifully on all devices.

## Tech Stack
- Frontend: React (Vite), Tailwind CSS, Recharts, React Router
- Backend: Node.js, Express, MongoDB (Mongoose), JWT
- Export Utilities: json2csv, pdfkit

## Project Structure
```text
expense_tracker/
├── backend/
│   ├── config/       # MongoDB Connect
│   ├── controllers/  # API logic
│   ├── middleware/   # Auth and Error Handling
│   ├── models/       # Mongoose Schemas (User, Transaction, Budget)
│   ├── routes/       # Express Router
│   ├── .env.example
│   ├── server.js     # Entry point
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── context/
    │   ├── pages/
    │   ├── utils/
    │   ├── App.jsx
    │   └── main.jsx
    ├── tailwind.config.js
    └── package.json
```

## Setup Instructions

### 1. Backend Setup
1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file from the example:
   ```bash
   copy .env.example .env
   ```
4. Update the `.env` file with your MongoDB URI.
5. Start the backend DEV server:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup
1. Open another terminal and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React app:
   ```bash
   npm run dev
   ```

### 3. Usage
- Go to `http://localhost:3000` (or the URL Vite provides).
- Register a new account.
- Add some transactions to see charts and summaries!

## Sample JSON Responses

### GET /api/transactions
```json
[
  {
    "_id": "64f1c...",
    "userId": "...",
    "title": "Grocery",
    "amount": 150.50,
    "type": "expense",
    "category": "Food",
    "date": "2026-05-13T00:00:00.000Z"
  }
]
```

## Basic Validation Rules
- **Authentication**: Email must be unique. Passwords must be valid (could be enforced to 6+ chars easily).
- **Transactions**: Amount must be numerical. Title, Type, Category, and Date are required.
- **Budgets**: Month and Year must be provided; one budget per month per user.

Enjoy tracking your expenses!
