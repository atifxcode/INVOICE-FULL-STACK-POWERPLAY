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

### 3. Database Seeding

To populate the database with the provided dataset, run the following command from the `backend` directory:

```bash
npm run seed
```

This script will:

1. Clear the existing `customers` and `invoices` collections.
2. Extract unique customers from `seed-data.json`.
3. Insert customers and link invoices to them using Reference IDs (Normalized Model).
4. Perform data cleaning (rounding amounts, calculating missing tax/totals).

### 4. Frontend Setup

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

The application follows a **Normalized Data Modeling** approach in MongoDB to ensure data integrity and reduce redundancy.

### Why Normalized?

Instead of embedding customer data directly into every invoice (denormalized), we split them into two collections: `Customer` and `Invoice`.

1.  **Redundancy Reduction**: Company names and customer details are stored once in the `Customer` collection.
2.  **Data Integrity**: Updating a customer's company name happens in one place, automatically reflecting across all their invoices.
3.  **Efficiency**: MongoDB `ObjectIds` are used to link invoices to customers, making joins (`$lookup`) efficient during aggregation.

### Schema Details

- **Customer**: Stores `name` and `company`. Each customer is unique.
- **Invoice**: Stores transaction details (`amount`, `taxRate`, `status`, etc.). It holds a reference `customer` field pointing to the `Customer` collection.

Indexing is applied to `invoiceId`, `customer`, and `status` to optimize search and filter operations.

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
