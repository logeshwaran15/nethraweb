import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdmin } from "@/lib/admin-store";
import { inr } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/customers")({
  head: () => ({
    meta: [
      { title: "Customers — Nethra's Admin" },
      { name: "description", content: "View and manage registered customers for Nethra's store." },
      { property: "og:title", content: "Customers — Nethra's Admin" },
      { property: "og:description", content: "View and manage registered customers." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminCustomers,
});

const PAGE_SIZE = 8;

function AdminCustomers() {
  const { customers, setCustomerStatus } = useAdmin();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const list = useMemo(
    () =>
      customers.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.email.toLowerCase().includes(query.toLowerCase()),
      ),
    [customers, query],
  );

  const pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [query]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const paged = useMemo(() => list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [list, page]);

  return (
    <AdminLayout title="Customers" subtitle={`${customers.length} registered customers`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email"
          className="w-full max-w-sm rounded-full border border-border bg-card py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-muted/60 text-[11px] uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Total Spent</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((c) => (
                <tr key={c.id} className="border-t border-border align-middle">
                  <td className="px-4 py-3">
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-[11px] text-muted-foreground">{c.email}</p>
                    <p className="text-[11px] text-muted-foreground">{c.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.joined}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.orders}</td>
                  <td className="px-4 py-3 font-bold text-primary">{inr(c.totalSpent)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        c.status === "Active"
                          ? "bg-success/15 text-success"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() =>
                        setCustomerStatus(c.id, c.status === "Active" ? "Blocked" : "Active")
                      }
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-primary hover:bg-accent"
                    >
                      {c.status === "Active" ? "Block" : "Unblock"}
                    </button>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No customers match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            Showing {list.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, list.length)} of {list.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              aria-label="Previous page"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="grid h-8 w-8 place-items-center rounded-lg border border-border text-primary disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-semibold">
              Page {page} of {pageCount}
            </span>
            <button
              aria-label="Next page"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={page === pageCount}
              className="grid h-8 w-8 place-items-center rounded-lg border border-border text-primary disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
