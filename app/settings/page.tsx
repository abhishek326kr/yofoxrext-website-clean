import { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import SettingsClient from "./SettingsClient";

export const metadata: Metadata = {
  title: "Settings | YoForex",
  description: "Manage your YoForex account settings, profile, notifications, security, and preferences.",
  keywords: "settings, account settings, profile settings, preferences, security, notifications",
  openGraph: {
    title: "Settings | YoForex",
    description: "Manage your YoForex account settings, profile, notifications, security, and preferences.",
    type: "website",
    siteName: "YoForex",
  },
  twitter: {
    card: "summary_large_image",
    title: "Settings | YoForex",
    description: "Manage your YoForex account settings, profile, notifications, security, and preferences.",
  },
};

async function getUserSettings() {
  const EXPRESS_URL = process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000';
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll()
    .map((cookie: { name: string; value: string }) => `${cookie.name}=${cookie.value}`)
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

async function getUserCoins() {
  const EXPRESS_URL = process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000';
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll()
    .map((cookie: { name: string; value: string }) => `${cookie.name}=${cookie.value}`)
    .join('; ');

  try {
    const user = await getUserSettings();
    if (!user?.id) return null;

    const res = await fetch(`${EXPRESS_URL}/api/user/${user.id}/coins`, {
      headers: {
        Cookie: cookieHeader,
      },
      credentials: 'include',
      cache: 'no-store',
    });

    if (!res.ok) {
      return { totalCoins: 0, weeklyEarned: 0, rank: null };
    }

    return await res.json();
  } catch (error) {
    console.error('Error fetching coins:', error);
    return { totalCoins: 0, weeklyEarned: 0, rank: null };
  }
}

export default async function SettingsPage() {
  const user = await getUserSettings();

  if (!user) {
    redirect('/');
  }

  const coinsData = await getUserCoins();

  return <SettingsClient initialUser={user} initialCoins={coinsData} />;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
