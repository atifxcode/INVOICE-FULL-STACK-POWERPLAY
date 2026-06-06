# Invoice Management System

A full-stack application for managing customers and invoices, featuring a dashboard with analytics and a searchable invoice table.

## Setup Instructions

### 1. MongoDB Atlas Setup

- Create a MongoDB Atlas account and a new cluster.
- Obtain your MongoDB connection string.
- Replace `<username>`, `<password>`, and `<dbname>` with your actual credentials.

### 2. Backend Setup

- Navigate to the `backend` directory:
  ```bash
  cd backend
  ```
- Install dependencies:
  ```bash
  npm install
  ```
- Create a `.env` file based on `.env.example`:
  ```bash
  cp .env.example .env
  ```
- Update the `MONGODB_URI` in `.env` with your Atlas connection string.
- Seed the database with initial data:
  ```bash
  npm run seed
  ```

### 3. Frontend Setup

- Navigate to the `frontend` directory:
  ```bash
  cd frontend
  ```
- Install dependencies:
  ```bash
  npm install
  ```

## Running the Application

### Start Backend

From the `backend` directory:

```bash
npm run dev
```

The server will run on [http://localhost:5000](http://localhost:5000).

### Start Frontend

From the `frontend` directory:

```bash
npm run dev
```

The application will be available at the URL provided by Vite (usually [http://localhost:5173](http://localhost:5173)).

## Data Modeling Rationale

The application uses two main entities: `Customer` and `Invoice`.

- **Customer**: Represents a client or company. It includes `name` and `company` fields. This separation allows for logical grouping of invoices per customer.
- **Invoice**: Contains financial details including `amount`, `taxRate`, `tax`, and `total`. Each invoice references a `Customer`. The `status` field (`Paid`, `Unpaid`, `Overdue`, etc.) tracks the invoice lifecycle.

Indexing is applied to frequently queried fields like `invoiceId`, `customer`, and `status` to ensure performance.

## Assumptions

- **Node.js**: It is assumed that Node.js (v18+) is installed on the machine.
- **MongoDB Atlas**: The application is configured to work with a cloud-based MongoDB Atlas instance for ease of setup and scalability.
- **Environment Variables**: A `.env` file in the backend is required for the application to connect to the database.
- **Seeding**: The `npm run seed` command should be run once to populate the database with the provided `seed-data.json`.

## Backend Aggregations & Optimizations

The backend is built with performance and data-driven insights in mind, utilizing advanced MongoDB features:

### 1. Robust Aggregation Pipelines

- **Global Analytics**: A single endpoint computes total billing, tax collections, and unique customer counts using a multi-stage aggregation pipeline.
- **Financial Trends**: Uses `$group` and date-string manipulation to generate monthly revenue trends.
- **Top Performers**: Dynamically identifies top customers by total invoice value using `$lookup` (joins) and `$sort` stages.
- **Conditional Metrics**: Calculates outstanding balances by conditionally summing amounts based on invoice status (`Sent`, `Unpaid`, `Overdue`) within the pipeline.
