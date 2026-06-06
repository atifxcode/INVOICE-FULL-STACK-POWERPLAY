import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Plus,
  Search,
} from "lucide-react";
import InvoiceModal from "../components/InvoiceModal";
import {
  type Customer,
  type Invoice,
  type InvoiceSortField,
  type InvoiceStatus,
  type SortOrder,
  INVOICE_STATUSES,
  fetchCustomers,
  fetchInvoices,
  formatCurrency,
  statusColor,
} from "../lib/api";

const PAGE_SIZE = 20;

function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

function SortIcon({
  field,
  activeField,
  order,
}: {
  field: InvoiceSortField;
  activeField: InvoiceSortField;
  order: SortOrder;
}) {
  if (field !== activeField) {
    return <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400" />;
  }
  return order === "asc" ? (
    <ChevronUp className="h-3.5 w-3.5 text-indigo-600" />
  ) : (
    <ChevronDown className="h-3.5 w-3.5 text-indigo-600" />
  );
}

export default function InvoiceList() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "">("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [sortField, setSortField] = useState<InvoiceSortField>("dueDate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    fetchCustomers().then(setCustomers).catch(() => setCustomers([]));
  }, []);

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchInvoices({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        customer: customerFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sortField,
        sortOrder,
      });

      setInvoices(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      setInvoices([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    debouncedSearch,
    statusFilter,
    customerFilter,
    startDate,
    endDate,
    sortField,
    sortOrder,
  ]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, customerFilter, startDate, endDate]);

  const toggleSort = (field: InvoiceSortField) => {
    if (sortField === field) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setModalOpen(true);
  };

  const handleNew = () => {
    setEditingInvoice(null);
    setModalOpen(true);
  };

  const startItem = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(page * PAGE_SIZE, total);

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) =>
      p === 1 ||
      p === totalPages ||
      (p >= page - 1 && p <= page + 1)
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
        <button
          type="button"
          onClick={handleNew}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          New invoice
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice / customer"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as InvoiceStatus | "")
          }
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="">All statuses</option>
          {INVOICE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={customerFilter}
          onChange={(e) => setCustomerFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="">All customers</option>
          {customers.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
        <span className="text-slate-500">Issue date:</span>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="rounded-lg border border-slate-300 px-2 py-1.5 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
        <span className="text-slate-400">to</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="rounded-lg border border-slate-300 px-2 py-1.5 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <span className="spinner" />
            <p className="text-sm text-slate-500">Loading invoices…</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
            <p className="text-base font-medium text-slate-700">
              No invoices found
            </p>
            <p className="text-sm text-slate-500">
              Try adjusting your filters or create a new invoice.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Invoice</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => toggleSort("amount")}
                      className="inline-flex items-center gap-1 hover:text-slate-700"
                    >
                      Amount
                      <SortIcon
                        field="amount"
                        activeField={sortField}
                        order={sortOrder}
                      />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right">Tax%</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr
                    key={inv._id}
                    className="cursor-pointer transition-colors hover:bg-slate-50/80"
                    onClick={() => handleEdit(inv)}
                  >
                    <td className="px-4 py-3 font-mono text-sm font-medium text-slate-900">
                      {inv.invoiceId}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/customers/${inv.customer._id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        {inv.customer.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                      {formatCurrency(inv.amount)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-500">
                      {inv.taxRate}%
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums text-slate-900">
                      {formatCurrency(inv.total)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusColor(inv.status)}`}
                      >
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3">
            <p className="text-sm text-slate-600">
              Showing{" "}
              <span className="font-medium tabular-nums">{startItem}</span>–
              <span className="font-medium tabular-nums">{endItem}</span> of{" "}
              <span className="font-medium tabular-nums">{total}</span>
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Prev
              </button>
              {pageNumbers.map((p, idx) => {
                const prev = pageNumbers[idx - 1];
                const showEllipsis = prev !== undefined && p - prev > 1;
                return (
                  <span key={p} className="flex items-center gap-1">
                    {showEllipsis && (
                      <span className="px-1 text-slate-400">…</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setPage(p)}
                      className={`min-w-[36px] rounded-lg px-3 py-1.5 text-sm font-medium tabular-nums transition-colors ${
                        p === page
                          ? "bg-indigo-600 text-white"
                          : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {p}
                    </button>
                  </span>
                );
              })}
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <InvoiceModal
        isOpen={modalOpen}
        invoice={editingInvoice}
        onClose={() => setModalOpen(false)}
        onSaved={loadInvoices}
      />
    </div>
  );
}
