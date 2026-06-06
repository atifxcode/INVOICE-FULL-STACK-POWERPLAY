import { Schema, model, Document, Types } from "mongoose";

export type InvoiceStatus =
    | "Sent"
    | "Unpaid"
    | "Overdue"
    | "Paid"
    | "Void"
    | "Draft";

export interface IInvoice extends Document {
    invoiceId: string;
    customer: Types.ObjectId;
    amount: number;
    taxRate: number;
    tax: number;
    total: number;
    status: InvoiceStatus;
    issueDate: string;
    dueDate: string;
}

const InvoiceSchema = new Schema<IInvoice>(
    {
        invoiceId: {
            type: String,
            required: true,
            unique: true, index: true
        },

        customer: {
            type: Schema.Types.ObjectId,
            ref: "Customer",
            required: true,
            index: true
        },


        amount: {
            type: Number,
            required: true
        },
        taxRate: {
            type: Number,
            enum: [0, 3, 5, 18, 28],
            required: true
        },
        tax: {
            type: Number,
            required: true
        },
        total: {
            type: Number,
            required: true
        },
        status: {
            type: String,
            enum: ["Sent", "Unpaid", "Overdue", "Paid", "Void", "Draft"],
            required: true,
            index: true,
        },
        issueDate: { type: String, required: true },
        dueDate: { type: String, required: true },
    },
    { timestamps: true }
);

export default model<IInvoice>("Invoice", InvoiceSchema);