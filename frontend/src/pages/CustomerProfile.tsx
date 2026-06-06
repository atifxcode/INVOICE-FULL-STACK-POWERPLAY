import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Building2, User } from "lucide-react";
import {
  type Customer,
  type CustomerAnalytics,
  type Invoice,
  type InvoiceStatus,
  fetchCustomerAnalytics,
  fetchInvoices,
  formatCurrency,
  statusColor,
} from "../lib/api";

const HISTORY_PAGE_SIZE = 10;

type ProfileStatusFilter = Extract<
  InvoiceStatus,
  "Paid" | "Unpaid" | "Overdue" | "Draft"
>;

const PROFILE_STATUS_FILTERS: ProfileStatusFilter[] = [
  "Paid",
  "Unpaid",
  "Overdue",
  "Draft",
];

export default function CustomerProfile() {
  const { id } = useParams<{ id: string }>();

  const [analytics, setAnalytics] = useState<CustomerAnalytics | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [statusCounts, setStatusCounts] = useState<
    Record<ProfileStatusFilter, number>
  >({
    Paid: 0,
    Unpaid: 0,
    Overdue: 0,
    Draft: 0,
  });

  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    if (!id) return;

    setLoadingAnalytics(true);
    setError(null);

    try {
      const data = await fetchCustomerAnalytics(id);
      setAnalytics(data);
    } catch {
      setError("Failed to load customer profile");
      setAnalytics(null);
    } finally {
      setLoadingAnalytics(false);
    }
  }, [id]);

  const loadHistory = useCallback(async () => {
    if (!id) return;

    setLoadingHistory(true);

    try {
      const data = await fetchInvoices({
        customer: id,
        page,
        limit: HISTORY_PAGE_SIZE,
        sortField: "dueDate",
        sortOrder: "desc",
        status: (statusFilter as InvoiceStatus | null) || undefined,
      });

      setInvoices(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      setInvoices([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoadingHistory(false);
    }
  }, [id, page, statusFilter]);

  const loadStatusCounts = useCallback(async () => {
    if (!id) return;

    try {
      const results = await Promise.all(
        PROFILE_STATUS_FILTERS.map(async (status) => {
          const data = await fetchInvoices({
            customer: id,
            status,
            limit: 1,
            page: 1,
          });
          return { status, count: data.total };
        })
      );

      setStatusCounts({
        Paid: results.find((r) => r.status === "Paid")?.count ?? 0,
        Unpaid: results.find((r) => r.status === "Unpaid")?.count ?? 0,
        Overdue: results.find((r) => r.status === "Overdue")?.count ?? 0,
        Draft: results.find((r) => r.status === "Draft")?.count ?? 0,
      });
    } catch {
      setStatusCounts({ Paid: 0, Unpaid: 0, Overdue: 0, Draft: 0 });
    }
  }, [id]);

  useEffect(() => {
    loadAnalytics();
    loadStatusCounts();
  }, [loadAnalytics, loadStatusCounts]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleStatusFilterClick = (status: ProfileStatusFilter) => {
    setStatusFilter((current) => (current === status ? null : status));
    setPage(1);
  };

  const customer: Customer | null = analytics?.customer ?? null;
  const metrics = analytics?.metrics;

  const startItem = total === 0 ? 0 : (page - 1) * HISTORY_PAGE_SIZE + 1;
  const endItem = Math.min(page * HISTORY_PAGE_SIZE, total);

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) =>
      p === 1 ||
      p === totalPages ||
      (p >= page - 1 && p <= page + 1)
  );

  if (loadingAnalytics) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <span className="spinner" />
        <p className="text-sm text-slate-500">Loading customer profile…</p>
      </div>
    );
  }

  if (error || !customer || !metrics) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <p className="text-base font-medium text-slate-700">
          {error ?? "Customer not found"}
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to invoices
        </Link>
      </div>
    );
  }

  const initials = customer.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const kpiCards = [
    { label: "Total billed", value: formatCurrency(metrics.totalBilled) },
    { label: "Total tax", value: formatCurrency(metrics.totalTax) },
    {
      label: "Outstanding",
      value: formatCurrency(metrics.outstandingBalance),
    },
    {
      label: "Invoices",
      value: metrics.invoiceCount.toLocaleString("en-IN"),
    },
  ];

  return (
    <div>
      <nav className="mb-6 text-sm text-slate-500">
        <Link to="/" className="hover:text-indigo-600">
          Invoices
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">Customer</span>
      </nav>

      <div className="mb-8 flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-700">
          {initials}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{customer.name}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
            <Building2 className="h-4 w-4" />
            {customer.company}
          </p>
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">{card.label}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {PROFILE_STATUS_FILTERS.map((status) => {
          const isActive = statusFilter === status;
          return (
            <button
              key={status}
              type="button"
              onClick={() => handleStatusFilterClick(status)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ring-1 ring-inset transition-colors ${
                isActive
                  ? `${statusColor(status)} ring-current`
                  : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {status}
              <span
                className={`min-w-[1.25rem] rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums ${
                  isActive
                    ? "bg-white/60"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {statusCounts[status].toLocaleString("en-IN")}
              </span>
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <User className="h-4 w-4 text-slate-400" />
            Invoice history
            {statusFilter && (
              <span className="text-sm font-normal text-slate-500">
                · {statusFilter}
              </span>
            )}
          </h2>
        </div>

        {loadingHistory ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <span className="spinner" />
            <p className="text-sm text-slate-500">Loading invoice history…</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-500">
            {statusFilter
              ? `No ${statusFilter.toLowerCase()} invoices for this customer.`
              : "No invoices for this customer yet."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3">Invoice</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Issued</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr
                    key={inv._id}
                    className="transition-colors hover:bg-slate-50/80"
                  >
                    <td className="px-5 py-3 font-mono text-sm font-medium text-slate-900">
                      {inv.invoiceId}
                    </td>
                    <td className="px-5 py-3 text-right font-medium tabular-nums text-slate-900">
                      {formatCurrency(inv.total)}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusColor(inv.status)}`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 tabular-nums text-slate-600">
                      {inv.issueDate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loadingHistory && total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-3">
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
    </div>
  );
}
