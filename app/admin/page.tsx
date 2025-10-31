import { AdminDashboardClient } from "./AdminDashboardSimple";

export const metadata = {
  title: "Admin Dashboard | YoForex",
  description: "YoForex platform administration and management dashboard"
};

export default function AdminPage() {
  return <AdminDashboardClient />;
}
