import { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import MessagesClient from "./MessagesClient";

export const metadata: Metadata = {
  title: "Messages | YoForex",
  description: "View and manage your private messages with other YoForex community members.",
  keywords: "messages, private messages, inbox, conversations, chat",
  openGraph: {
    title: "Messages | YoForex",
    description: "View and manage your private messages with other YoForex community members.",
    type: "website",
    siteName: "YoForex",
  },
  twitter: {
    card: "summary_large_image",
    title: "Messages | YoForex",
    description: "View and manage your private messages with other YoForex community members.",
  },
};

// Enable ISR with 10-second revalidation for better performance
export const revalidate = 10;

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
      next: { revalidate: 10 },
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

async function getConversations(cookieHeader: string) {
  const EXPRESS_URL = process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000';
  
  try {
    const res = await fetch(`${EXPRESS_URL}/api/conversations`, {
      headers: {
        Cookie: cookieHeader,
      },
      credentials: 'include',
      next: { revalidate: 10 },
    });

    if (!res.ok) {
      console.error('Failed to fetch conversations:', res.status);
      return [];
    }

    return await res.json();
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }
}

export default async function MessagesPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll()
    .map(cookie => `${cookie.name}=${cookie.value}`)
    .join('; ');

  const user = await getUser();

  if (!user) {
    redirect('/');
  }

  const initialConversations = await getConversations(cookieHeader);

  return <MessagesClient initialConversations={initialConversations} />;
}
