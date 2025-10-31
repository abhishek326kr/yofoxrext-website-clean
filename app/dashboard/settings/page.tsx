import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardSettingsClient from "./DashboardSettingsClient";

export const metadata: Metadata = {
  title: "Dashboard Settings | YoForex",
  description: "Customize your YoForex dashboard. Manage widgets, layout, and preferences.",
  keywords: "dashboard settings, customize dashboard, widget settings, dashboard layout, dashboard widgets",
  openGraph: {
    title: "Dashboard Settings | YoForex",
    description: "Customize your YoForex dashboard. Manage widgets, layout, and preferences.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Dashboard Settings | YoForex",
    description: "Customize your YoForex dashboard. Manage widgets, layout, and preferences.",
  },
};

async function getDashboardPreferences() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("connect.sid");

  if (!sessionCookie) {
    redirect("/");
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const response = await fetch(`${baseUrl}/api/dashboard/preferences`, {
      headers: {
        Cookie: `connect.sid=${sessionCookie.value}`,
      },
      cache: "no-store",
    });

    if (response.status === 401) {
      redirect("/");
    }

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching dashboard preferences:", error);
    return null;
  }
}

export default async function DashboardSettingsPage() {
  const preferences = await getDashboardPreferences();

  return <DashboardSettingsClient initialData={preferences} />;
}
