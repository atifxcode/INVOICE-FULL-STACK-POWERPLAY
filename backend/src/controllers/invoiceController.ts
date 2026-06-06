import { Request, Response } from "express";
import Invoice from "../models/Invoice";
import Customer from "../models/Customer";
import mongoose from "mongoose";

const round2 = (n: number) => Math.round(n * 100) / 100;

export async function listInvoices(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || "1"));
    const limit = Math.max(1, parseInt((req.query.limit as string) || "20"));
    const skip = (page - 1) * limit;

    const { status, customer, startDate, endDate, search } = req.query as Record<string, string>;
    const sortField = (req.query.sortField as string) || "dueDate";
    const sortOrder = (req.query.sortOrder as string) === "asc" ? 1 : -1;

    const filter: any = {};
    if (status) filter.status = status;
    if (customer && mongoose.isValidObjectId(customer)) filter.customer = customer;
    if (startDate || endDate) {
      filter.issueDate = {};
      if (startDate) filter.issueDate.$gte = startDate;
      if (endDate) filter.issueDate.$lte = endDate;
    }

    let customerIdsFromSearch: mongoose.Types.ObjectId[] = [];
    if (search) {
      const regex = new RegExp(search, "i");
      const matchedCustomers = await Customer.find({ name: regex }).select("_id");
      customerIdsFromSearch = matchedCustomers.map((c) => c._id as mongoose.Types.ObjectId);
      filter.$or = [
        { invoiceId: regex },
        ...(customerIdsFromSearch.length ? [{ customer: { $in: customerIdsFromSearch } }] : []),
      ];
    }

    const sort: any = {};
    if (sortField === "amount") sort.amount = sortOrder;
    else sort.dueDate = sortOrder;

    const [items, total] = await Promise.all([
      Invoice.find(filter).populate("customer").sort(sort).skip(skip).limit(limit),
      Invoice.countDocuments(filter),
    ]);

    res.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

export async function getInvoice(req: Request, res: Response) {
  try {
    const inv = await Invoice.findById(req.params.id).populate("customer");
    if (!inv) return res.status(404).json({ error: "Not found" });
    res.json(inv);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

export async function createInvoice(req: Request, res: Response) {
  try {
    const { invoiceId, customer, amount, taxRate, status, issueDate, dueDate } = req.body;
    const amt = Number(amount);
    const rate = Number(taxRate);
    const tax = round2(amt * (rate / 100));
    const total = round2(amt + tax);
    const inv = await Invoice.create({
      invoiceId,
      customer,
      amount: round2(amt),
      taxRate: rate,
      tax,
      total,
      status,
      issueDate,
      dueDate,
    });
    const populated = await inv.populate("customer");
    res.status(201).json(populated);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
}

export async function updateInvoice(req: Request, res: Response) {
  try {
    const { amount, taxRate } = req.body;
    const update: any = { ...req.body };
    if (amount != null && taxRate != null) {
      const amt = Number(amount);
      const rate = Number(taxRate);
      update.amount = round2(amt);
      update.taxRate = rate;
      update.tax = round2(amt * (rate / 100));
      update.total = round2(amt + amt * (rate / 100));
    }
    const inv = await Invoice.findByIdAndUpdate(req.params.id, update, { new: true }).populate("customer");
    if (!inv) return res.status(404).json({ error: "Not found" });
    res.json(inv);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
}

export async function deleteInvoice(req: Request, res: Response) {
  try {
    const inv = await Invoice.findByIdAndDelete(req.params.id);
    if (!inv) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}