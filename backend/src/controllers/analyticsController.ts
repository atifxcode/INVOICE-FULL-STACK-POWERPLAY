import { Request, Response } from "express";
import Invoice from "../models/Invoice";
import Customer from "../models/Customer";
import mongoose from "mongoose";

export async function customerAnalytics(req: Request, res: Response) {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ error: "Invalid id" });
        }

        const customer = await Customer.findById(id);

        if (!customer) return res.status(404).json({ error: "Customer not found" });

        const agg = await Invoice.aggregate([
            { $match: { customer: new mongoose.Types.ObjectId(id as string) } },
            {
                $group: {
                    _id: null,
                    totalBilled: { $sum: "$total" },
                    totalTax: { $sum: "$tax" },
                    invoiceCount: { $sum: 1 },
                    outstandingBalance: {
                        $sum: {
                            $cond: [{ $in: ["$status", ["Sent", "Unpaid", "Overdue"]] }, "$total", 0],
                        },
                    },
                },
            },
            { $project: { _id: 0 } },
        ]);

        res.json({
            customer,
            metrics: agg[0] || { totalBilled: 0, totalTax: 0, invoiceCount: 0, outstandingBalance: 0 },
        });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
}

export async function globalAnalytics(_req: Request, res: Response) {
    try {
        const [totals, topCustomers, statusBreakdown, monthlyTrend] = await Promise.all([
            Invoice.aggregate([
                {
                    $group: {
                        _id: null,
                        totalBilled: { $sum: "$total" },
                        totalTax: { $sum: "$tax" },
                        totalInvoices: { $sum: 1 },
                        uniqueCustomers: { $addToSet: "$customer" },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        totalBilled: 1,
                        totalTax: 1,
                        totalInvoices: 1,
                        uniqueCustomers: { $size: "$uniqueCustomers" },
                    },
                },
            ]),

            Invoice.aggregate([
                { $group: { _id: "$customer", totalValue: { $sum: "$total" }, invoiceCount: { $sum: 1 } } },
                { $sort: { totalValue: -1 } },
                { $limit: 5 },
                {
                    $lookup: {
                        from: "customers",
                        localField: "_id",
                        foreignField: "_id",
                        as: "customer",
                    },
                },
                { $unwind: "$customer" },
                {
                    $project: {
                        _id: 1,
                        totalValue: 1,
                        invoiceCount: 1,
                        name: "$customer.name",
                        company: "$customer.company",
                    },
                },
            ]),

            Invoice.aggregate([
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 },
                        totalAmount: { $sum: "$total" }
                    }
                }
            ]),

            Invoice.aggregate([
                {
                    $group: {
                        _id: { $substr: ["$issueDate", 0, 7] },
                        totalInvoiced: { $sum: "$total" }
                    }
                },
                { $sort: { _id: 1 } }
            ])
        ]);

        res.json({
            totals: totals[0] || { totalBilled: 0, totalTax: 0, totalInvoices: 0, uniqueCustomers: 0 },
            topCustomers,
            statusBreakdown: statusBreakdown.map(s => ({ status: s._id, count: s.count, amount: s.totalAmount })),
            monthlyTrend: monthlyTrend.map(m => ({ month: m._id, amount: m.totalInvoiced }))
        });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
}
