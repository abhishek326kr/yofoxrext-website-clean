import { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import NotificationsClient from "./NotificationsClient";

export const metadata: Metadata = {
  title: "Notifications | YoForex",
  description: "View all your notifications including replies, likes, follows, and system alerts.",
  keywords: "notifications, alerts, activity, updates",
  openGraph: {
    title: "Notifications | YoForex",
    description: "View all your notifications including replies, likes, follows, and system alerts.",
    type: "website",
    siteName: "YoForex",
  },
  twitter: {
    card: "summary_large_image",
    title: "Notifications | YoForex",
    description: "View all your notifications including replies, likes, follows, and system alerts.",
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
      // Return null for any error status - redirect will handle it
      return null;
    }

    return await res.json();
  } catch (error) {
    // Silently return null - redirect logic handles unauthenticated users
    return null;
  }
}

async function getNotifications(cookieHeader: string) {
  const EXPRESS_URL = process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000';
  
  try {
    const res = await fetch(`${EXPRESS_URL}/api/notifications?limit=100`, {
      headers: {
        Cookie: cookieHeader,
      },
      credentials: 'include',
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('Failed to fetch notifications:', res.status);
      return [];
    }

    return await res.json();
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

export default async function NotificationsPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll()
    .map(cookie => `${cookie.name}=${cookie.value}`)
    .join('; ');

  const user = await getUser();

  if (!user) {
    redirect('/');
  }

  const initialNotifications = await getNotifications(cookieHeader);

  return <NotificationsClient initialNotifications={initialNotifications} />;
}
