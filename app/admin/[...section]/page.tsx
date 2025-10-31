import { AdminDashboardClient } from "../AdminDashboardClient";

export const metadata = {
  title: "Admin Dashboard | YoForex",
  description: "YoForex platform administration and management dashboard"
};

export default function AdminSectionPage() {
  return <AdminDashboardClient />;
}
