import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  type GlobalAnalytics,
  type InvoiceStatus,
  fetchGlobalAnalytics,
  formatCurrency,
} from "../lib/api";

const STATUS_CHART_COLORS: Record<InvoiceStatus, string> = {
  Sent: "#3b82f6",
  Unpaid: "#f59e0b",
  Overdue: "#ef4444",
  Paid: "#10b981",
  Void: "#94a3b8",
  Draft: "#a855f7",
};


export default function Analytics() {
  const [analytics, setAnalytics] = useState<GlobalAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        
        const globalData = await fetchGlobalAnalytics();
        setAnalytics(globalData);
      } catch {
        setError("Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  
  const topCustomerChart = useMemo(() => {
    return (analytics?.topCustomers ?? []).map((c) => ({
      name: c.name.split(" ")[0],
      fullName: c.name,
      value: c.totalValue,
      invoices: c.invoiceCount,
    }));
  }, [analytics]);

  
  const statusData = useMemo(() => {
    return (analytics?.statusBreakdown ?? [])
      .map((item) => ({
        name: item.status,
        value: item.count,
        fill: STATUS_CHART_COLORS[item.status] || "#cbd5e1",
      }))
      .filter((item) => item.value > 0);
  }, [analytics]);

  const monthlyTrendData = useMemo(() => {
    return (analytics?.monthlyTrend ?? []).map((item) => ({
      month: item.month,
      billed: Math.round(item.amount * 100) / 100,
    }));
  }, [analytics]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <span className="spinner" />
        <p className="text-sm text-slate-500">Loading analytics…</p>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
        <p className="text-base font-medium text-slate-700">
          {error ?? "Unable to load analytics"}
        </p>
        <p className="text-sm text-slate-500">
          Ensure the backend is running on port 5000.
        </p>
      </div>
    );
  }

  const { totals } = analytics;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Summary</h1>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total billed", value: formatCurrency(totals.totalBilled) },
          { label: "Total tax", value: formatCurrency(totals.totalTax) },
          {
            label: "# Invoices",
            value: totals.totalInvoices.toLocaleString("en-IN"),
          },
          {
            label: "# Customers",
            value: totals.uniqueCustomers.toLocaleString("en-IN"),
          },
        ].map((card) => (
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

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-900">
            Top customers by value
          </h2>
          {topCustomerChart.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-500">
              No customer data available.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topCustomerChart} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={70}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), "Total Billed"]}
                  labelFormatter={(_label, payload) => {
                    const item = payload[0]?.payload as { fullName: string } | undefined;
                    return item?.fullName ?? "";
                  }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-900">
            Invoice status breakdown
          </h2>
          {statusData.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-500">
              No invoice data available.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [
                    value.toLocaleString("en-IN"),
                    name,
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-4 text-base font-semibold text-slate-900">
            Monthly billing trend
          </h2>
          {monthlyTrendData.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-500">
              No billing trend data available.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis
                  tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), "Billed"]}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="billed"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#6366f1" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}