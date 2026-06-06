import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db";


// Routes
import customerRoutes from "./routes/customerRoute";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});


app.use('/api/customers', customerRoutes);

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
