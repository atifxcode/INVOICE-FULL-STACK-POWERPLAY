import { NavLink, Route, Routes } from "react-router-dom";
import { FileText, LayoutDashboard } from "lucide-react";
import Analytics from "./pages/Analytics";
import CustomerProfile from "./pages/CustomerProfile";
import InvoiceList from "./pages/InvoiceList";

function AppLayout() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-900">
              Invoice Dashboard
            </span>
          </div>

          <nav className="flex items-center gap-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`
              }
            >
              <FileText className="h-4 w-4" />
              Invoices
            </NavLink>
            <NavLink
              to="/analytics"
              className={({ isActive }) =>
                `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`
              }
            >
              <LayoutDashboard className="h-4 w-4" />
              Summary
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Routes>
          <Route path="/" element={<InvoiceList />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/customers/:id" element={<CustomerProfile />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return <AppLayout />;
}
