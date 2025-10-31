import { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import TransactionHistoryClient from "./TransactionHistoryClient";

export const metadata: Metadata = {
  title: "Transaction History | YoForex",
  description: "View your complete coin transaction history including earnings, purchases, and spending on YoForex.",
  keywords: "transactions, coin history, earnings, purchases, transaction log",
  openGraph: {
    title: "Transaction History | YoForex",
    description: "View your complete coin transaction history including earnings, purchases, and spending on YoForex.",
    type: "website",
    siteName: "YoForex",
  },
  twitter: {
    card: "summary_large_image",
    title: "Transaction History | YoForex",
    description: "View your complete coin transaction history including earnings, purchases, and spending on YoForex.",
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

async function getTransactionHistory(userId: string) {
  const EXPRESS_URL = process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000';
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll()
    .map(cookie => `${cookie.name}=${cookie.value}`)
    .join('; ');

  try {
    const res = await fetch(`${EXPRESS_URL}/api/ledger/history?limit=100`, {
      headers: {
        Cookie: cookieHeader,
      },
      credentials: 'include',
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('Failed to fetch transaction history');
      return [];
    }

    return await res.json();
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    return [];
  }
}

export default async function TransactionHistoryPage() {
  const user = await getUser();

  if (!user) {
    redirect('/');
  }

  const transactions = await getTransactionHistory(user.id);

  return <TransactionHistoryClient initialData={transactions} />;
}
