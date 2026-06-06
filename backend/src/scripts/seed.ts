import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import mongoose from "mongoose";
import { connectDB } from "../config/db";
import Customer from "../models/Customer";
import Invoice from "../models/Invoice";

dotenv.config();

// Utility helper to handle floating-point decimal rounding safety
const round2 = (n: number) => Math.round(n * 100) / 100;

async function run() {
//   const MONGO_URI = process.env.MONGO_URI as string;
//   if (!MONGO_URI) throw new Error("MONGO_URI missing from environment variables.");
  await connectDB();

  const seedPath = path.join(__dirname, "../../seed-data.json");

  // Strict check: Halt execution completely if file is missing
  if (!fs.existsSync(seedPath)) {
    console.error("\n❌ CRITICAL ERROR: seed-data.json was not found!");
    console.error(`Please place your dataset file exactly at: ${seedPath}\n`);
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log("📂 Detected local dataset file. Reading seed-data.json...");
  const rawInvoices = JSON.parse(fs.readFileSync(seedPath, "utf-8"));

  console.log("🧹 Wiping previous database collections...");
  await Invoice.deleteMany({});
  await Customer.deleteMany({});

  // 1. Extract unique customer-company pairings dynamically from flat list
  const customerMap = new Map<string, { name: string; company: string }>();
  for (const inv of rawInvoices) {
    if (inv.customer && !customerMap.has(inv.customer)) {
      customerMap.set(inv.customer, { 
        name: inv.customer, 
        company: inv.company || "Independent Operations" 
      });
    }
  }

  const uniqueCustomers = Array.from(customerMap.values());
  console.log(`👥 Found ${uniqueCustomers.length} unique clients. Inserting into Customer collection...`);
  const insertedCustomers = await Customer.insertMany(uniqueCustomers);

  // Map customer names to their new native MongoDB ObjectIds
  const nameToId = new Map<string, mongoose.Types.ObjectId>();
  insertedCustomers.forEach((c) => nameToId.set(c.name, c._id as mongoose.Types.ObjectId));

  // 2. Relink flat invoice data to true database relational pointers
  console.log(`🧾 Remapping ${rawInvoices.length} invoices to corresponding Mongoose ObjectIds...`);
  const formattedInvoices = rawInvoices.map((inv: any) => {
    const customerId = nameToId.get(inv.customer);
    if (!customerId) {
      throw new Error(`Inconsistent Relational Data: Customer key '${inv.customer}' missing validation mapping.`);
    }

    const amount = round2(Number(inv.amount));
    const taxRate = Number(inv.taxRate);
    const tax = round2(Number(inv.tax ?? (amount * (taxRate / 100))));
    const total = round2(Number(inv.total ?? (amount + tax)));

    return {
      invoiceId: inv.invoiceId,
      customer: customerId,
      amount,
      taxRate,
      tax,
      total,
      status: inv.status,
      issueDate: inv.issueDate,
      dueDate: inv.dueDate,
    };
  });

  console.log("💾 Executing bulk invoice storage database write...");
  await Invoice.insertMany(formattedInvoices);
  
  console.log(`✅ Database population successful: Loaded ${uniqueCustomers.length} clients and ${formattedInvoices.length} transaction records!`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Seeding processing script catastrophic error:", err);
  process.exit(1);
});