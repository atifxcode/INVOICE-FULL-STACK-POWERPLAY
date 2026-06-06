import { useEffect, useState, type FormEvent } from "react";
import axios from "axios";
import { X } from "lucide-react";
import {
  type Customer,
  type Invoice,
  type InvoiceStatus,
  type TaxRate,
  INVOICE_STATUSES,
  TAX_RATES,
  computeTax,
  computeTotal,
  createInvoice,
  fetchCustomers,
  updateInvoice,
  formatCurrency,
} from "../lib/api";

interface InvoiceModalProps {
  isOpen: boolean;
  invoice: Invoice | null;
  onClose: () => void;
  onSaved: () => void;
}

interface FormState {
  customerId: string;
  amount: string;
  taxRate: TaxRate;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
}

const emptyForm = (): FormState => ({
  customerId: "",
  amount: "",
  taxRate: 0,
  issueDate: new Date().toISOString().slice(0, 10),
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10),
  status: "Draft",
});

export default function InvoiceModal({
  isOpen,
  invoice,
  onClose,
  onSaved,
}: InvoiceModalProps) {
  const isEdit = invoice !== null;
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setError(null);
    setLoadingCustomers(true);
    fetchCustomers()
      .then(setCustomers)
      .catch(() => setError("Failed to load customers"))
      .finally(() => setLoadingCustomers(false));

    if (invoice) {
      setForm({
        customerId: invoice.customer._id,
        amount: String(invoice.amount),
        taxRate: invoice.taxRate,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        status: invoice.status,
      });
    } else {
      setForm(emptyForm());
    }
  }, [isOpen, invoice]);

  if (!isOpen) return null;

  const selectedCustomer = customers.find((c) => c._id === form.customerId);
  const parsedAmount = parseFloat(form.amount) || 0;
  const tax = computeTax(parsedAmount, form.taxRate);
  const total = computeTotal(parsedAmount, form.taxRate);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.customerId) {
      setError("Please select a customer");
      return;
    }
    if (!form.amount || parsedAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit && invoice) {
        await updateInvoice(invoice._id, {
          customer: form.customerId,
          amount: parsedAmount,
          taxRate: form.taxRate,
          status: form.status,
          issueDate: form.issueDate,
          dueDate: form.dueDate,
        });
      } else {
        await createInvoice({
          customer: form.customerId,
          amount: parsedAmount,
          taxRate: form.taxRate,
          status: form.status,
          issueDate: form.issueDate,
          dueDate: form.dueDate,
        });
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      let message = "Failed to save invoice. Please try again.";
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as { error?: string } | undefined;
        message = data?.error ?? message;
      }
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {isEdit ? "Edit invoice" : "New invoice"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex-1 space-y-5 px-6 py-5">
            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Customer
              </label>
              {loadingCustomers ? (
                <div className="flex items-center gap-2 py-2 text-sm text-slate-500">
                  <span className="spinner h-4 w-4 border-2" />
                  Loading customers…
                </div>
              ) : (
                <select
                  value={form.customerId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, customerId: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                >
                  <option value="">Select customer</option>
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Company
              </label>
              <input
                type="text"
                readOnly
                value={selectedCustomer?.company ?? ""}
                placeholder="Auto-filled from customer"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Amount
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: e.target.value }))
                }
                placeholder="0.00"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm tabular-nums shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Tax rate
              </label>
              <select
                value={form.taxRate}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    taxRate: Number(e.target.value) as TaxRate,
                  }))
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {TAX_RATES.map((rate) => (
                  <option key={rate} value={rate}>
                    {rate}%
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Issue date
                </label>
                <input
                  type="date"
                  value={form.issueDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, issueDate: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Due date
                </label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dueDate: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    status: e.target.value as InvoiceStatus,
                  }))
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {INVOICE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Tax{" "}
              <span className="font-medium tabular-nums text-slate-900">
                {formatCurrency(tax)}
              </span>
              {" · "}
              Total{" "}
              <span className="font-semibold tabular-nums text-slate-900">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          <div className="flex gap-3 border-t border-slate-200 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && <span className="spinner h-4 w-4 border-2 border-white/30 border-t-white" />}
              Save invoice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
