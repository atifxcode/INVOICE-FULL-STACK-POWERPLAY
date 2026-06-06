import { Request, Response } from "express";
import Customer from "../models/Customer";

export async function listCustomers(_req: Request, res: Response) {
  try {
    const customers = await Customer.find().sort({ name: 1 });
    res.json(customers);
  } catch (error: any) {
    res.status(500).json({
      error: error.message || "Internal Server Error",
    });
  }
}

export async function getCustomer(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const customer = await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({
        error: "Customer not found",
      });
    }

    res.json(customer);
  } catch (error: any) {
    res.status(500).json({
      error: error.message || "Internal Server Error",
    });
  }
}