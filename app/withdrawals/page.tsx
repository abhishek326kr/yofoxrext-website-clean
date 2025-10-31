import { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import WithdrawalsClient from "./WithdrawalsClient";

export const metadata: Metadata = {
  title: "Withdraw Coins | YoForex",
  description: "Convert your gold coins to cash and withdraw your earnings from YoForex.",
  keywords: "withdraw, cash out, earnings, payout, withdrawal",
  openGraph: {
    title: "Withdraw Coins | YoForex",
    description: "Convert your gold coins to cash and withdraw your earnings from YoForex.",
    type: "website",
    siteName: "YoForex",
  },
  twitter: {
    card: "summary_large_image",
    title: "Withdraw Coins | YoForex",
    description: "Convert your gold coins to cash and withdraw your earnings from YoForex.",
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

async function getUserCoins(userId: string) {
  const EXPRESS_URL = process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000';
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll()
    .map(cookie => `${cookie.name}=${cookie.value}`)
    .join('; ');

  try {
    const res = await fetch(`${EXPRESS_URL}/api/user/${userId}/coins`, {
      headers: {
        Cookie: cookieHeader,
      },
      credentials: 'include',
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('Failed to fetch user coins');
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error('Error fetching user coins:', error);
    return null;
  }
}

export default async function WithdrawalsPage() {
  const user = await getUser();

  if (!user) {
    redirect('/');
  }

  const userCoins = await getUserCoins(user.id);

  return <WithdrawalsClient initialUserCoins={userCoins} />;
}
