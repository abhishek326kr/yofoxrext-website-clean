import { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import WithdrawalHistoryClient from "./WithdrawalHistoryClient";

export const metadata: Metadata = {
  title: "Withdrawal History | YoForex",
  description: "View your withdrawal history and track payout status.",
  keywords: "withdrawal history, payout history, earnings history",
  openGraph: {
    title: "Withdrawal History | YoForex",
    description: "View your withdrawal history and track payout status.",
    type: "website",
    siteName: "YoForex",
  },
  twitter: {
    card: "summary_large_image",
    title: "Withdrawal History | YoForex",
    description: "View your withdrawal history and track payout status.",
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

async function getWithdrawals() {
  const EXPRESS_URL = process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000';
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll()
    .map(cookie => `${cookie.name}=${cookie.value}`)
    .join('; ');

  try {
    const res = await fetch(`${EXPRESS_URL}/api/withdrawals`, {
      headers: {
        Cookie: cookieHeader,
      },
      credentials: 'include',
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('Failed to fetch withdrawals');
      return [];
    }

    return await res.json();
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    return [];
  }
}

export default async function WithdrawalHistoryPage() {
  const user = await getUser();

  if (!user) {
    redirect('/');
  }

  const withdrawals = await getWithdrawals();

  return <WithdrawalHistoryClient initialData={withdrawals} />;
}
