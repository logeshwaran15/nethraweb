import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminProvider } from "@/lib/admin-store";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel — Nethra's Mehndi Store" },
      {
        name: "description",
        content: "Manage products, categories and sales reports for Nethra's store.",
      },
      { property: "og:title", content: "Admin Panel — Nethra's Mehndi Store" },
      {
        property: "og:description",
        content: "Dashboard, product list, category manager and reports.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AdminProvider>
      <Outlet />
    </AdminProvider>
  ),
});
