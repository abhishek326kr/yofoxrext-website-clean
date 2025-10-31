import { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import DashboardClient from "./DashboardClient";

export const metadata: Metadata = {
  title: "My Dashboard | YoForex",
  description: "Manage your YoForex account, track your earnings, and view your recent activity.",
  keywords: "dashboard, account, trading activity, forex earnings",
  openGraph: {
    title: "My Dashboard | YoForex",
    description: "Manage your YoForex account, track your earnings, and view your recent activity.",
    type: "website",
    siteName: "YoForex",
  },
  twitter: {
    card: "summary_large_image",
    title: "My Dashboard | YoForex",
    description: "Manage your YoForex account, track your earnings, and view your recent activity.",
  },
};

async function getUser() {
  const EXPRESS_URL = process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000';
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll()
    .map(cookie => `${cookie.name}=${cookie.value}`)
    .join('; ');

  try {
    const res = await fetch(`${EXPRESS_URL}/api/me`, {
      headers: {
        Cookie: cookieHeader,
      },
      credentials: 'include',
      cache: 'no-store',
    });

    if (res.status === 401) {
      return null;
    }

    if (!res.ok) {
      throw new Error('Failed to fetch user');
    }

    return await res.json();
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export default async function DashboardPage() {
  const user = await getUser();

  if (!user) {
    // Redirect to home page when not authenticated
    // User can login from there using the AuthModal
    redirect('/');
  }

  return <DashboardClient />;
}
