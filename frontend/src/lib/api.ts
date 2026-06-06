import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

export type InvoiceStatus =
  | "Sent"
  | "Unpaid"
  | "Overdue"
  | "Paid"
  | "Void"
  | "Draft";

export const INVOICE_STATUSES: InvoiceStatus[] = [
  "Sent",
  "Unpaid",
  "Overdue",
  "Paid",
  "Void",
  "Draft",
];

export type TaxRate = 0 | 3 | 5 | 18 | 28;

export const TAX_RATES: TaxRate[] = [0, 3, 5, 18, 28];

export type InvoiceSortField = "amount" | "dueDate";

export type SortOrder = "asc" | "desc";

export interface Customer {
  _id: string;
  name: string;
  company: string;
}

export interface Invoice {
  _id: string;
  invoiceId: string;
  customer: Customer;
  amount: number;
  taxRate: TaxRate;
  tax: number;
  total: number;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedInvoices {
  items: Invoice[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface InvoiceListParams {
  page?: number;
  limit?: number;
  status?: InvoiceStatus;
  customer?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  sortField?: InvoiceSortField;
  sortOrder?: SortOrder;
}

export interface CreateInvoicePayload {
  customer: string;
  amount: number;
  taxRate: TaxRate;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
}

export interface UpdateInvoicePayload {
  customer?: string;
  amount?: number;
  taxRate?: TaxRate;
  status?: InvoiceStatus;
  issueDate?: string;
  dueDate?: string;
}

export interface GlobalTotals {
  totalBilled: number;
  totalTax: number;
  totalInvoices: number;
  uniqueCustomers: number;
}

export interface TopCustomer {
  _id: string;
  totalValue: number;
  invoiceCount: number;
  name: string;
  company: string;
}

export interface StatusBreakdownItem {
  status: InvoiceStatus;
  count: number;
  amount: number;
}

export interface MonthlyTrendItem {
  month: string;
  amount: number;
}

export interface GlobalAnalytics {
  totals: GlobalTotals;
  topCustomers: TopCustomer[];
  statusBreakdown: StatusBreakdownItem[];
  monthlyTrend: MonthlyTrendItem[];
}

export interface CustomerMetrics {
  totalBilled: number;
  totalTax: number;
  invoiceCount: number;
  outstandingBalance: number;
}

export interface CustomerAnalytics {
  customer: Customer;
  metrics: CustomerMetrics;
}

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(value: number): string {
  return inrFormatter.format(value);
}

export function statusColor(status: InvoiceStatus): string {
  const colors: Record<InvoiceStatus, string> = {
    Sent: "bg-blue-100 text-blue-800 ring-blue-200",
    Unpaid: "bg-amber-100 text-amber-800 ring-amber-200",
    Overdue: "bg-red-100 text-red-800 ring-red-200",
    Paid: "bg-emerald-100 text-emerald-800 ring-emerald-200",
    Void: "bg-slate-100 text-slate-600 ring-slate-200",
    Draft: "bg-purple-100 text-purple-800 ring-purple-200",
  };
  return colors[status];
}

export function computeTax(amount: number, taxRate: TaxRate): number {
  return Math.round(amount * (taxRate / 100) * 100) / 100;
}

export function computeTotal(amount: number, taxRate: TaxRate): number {
  const tax = computeTax(amount, taxRate);
  return Math.round((amount + tax) * 100) / 100;
}

export async function fetchInvoices(
  params: InvoiceListParams
): Promise<PaginatedInvoices> {
  const { data } = await api.get<PaginatedInvoices>("/invoices", { params });
  return data;
}

export async function fetchInvoice(id: string): Promise<Invoice> {
  const { data } = await api.get<Invoice>(`/invoices/${id}`);
  return data;
}

export async function createInvoice(
  payload: CreateInvoicePayload
): Promise<Invoice> {
  const { data } = await api.post<Invoice>("/invoices", payload);
  return data;
}

export async function updateInvoice(
  id: string,
  payload: UpdateInvoicePayload
): Promise<Invoice> {
  const { data } = await api.put<Invoice>(`/invoices/${id}`, payload);
  return data;
}

export async function deleteInvoice(id: string): Promise<void> {
  await api.delete(`/invoices/${id}`);
}

export async function fetchCustomers(): Promise<Customer[]> {
  const { data } = await api.get<Customer[]>("/customers");
  return data;
}

export async function fetchCustomer(id: string): Promise<Customer> {
  const { data } = await api.get<Customer>(`/customers/${id}`);
  return data;
}

export async function fetchGlobalAnalytics(): Promise<GlobalAnalytics> {
  const { data } = await api.get<GlobalAnalytics>("/analytics/global");
  return data;
}

export async function fetchCustomerAnalytics(
  id: string
): Promise<CustomerAnalytics> {
  const { data } = await api.get<CustomerAnalytics>(
    `/analytics/customer/${id}`
  );
  return data;
}
