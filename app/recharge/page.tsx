import { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import RechargeClient from "./RechargeClient";
import { RECHARGE_PACKAGES } from "../../shared/coinUtils";

export const metadata: Metadata = {
  title: "Recharge Coins | YoForex",
  description: "Purchase gold coins to unlock premium content, support creators, and access exclusive features on YoForex.",
  keywords: "recharge, buy coins, gold coins, premium content, stripe payment, cryptocurrency, USDT, trading platform",
  openGraph: {
    title: "Recharge Coins | YoForex",
    description: "Purchase gold coins to unlock premium content, support creators, and access exclusive features on YoForex.",
    type: "website",
    siteName: "YoForex",
  },
  twitter: {
    card: "summary_large_image",
    title: "Recharge Coins | YoForex",
    description: "Purchase gold coins to unlock premium content, support creators, and access exclusive features on YoForex.",
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

export default async function RechargePage() {
  const user = await getUser();

  if (!user) {
    redirect('/');
  }

  return <RechargeClient initialPackages={RECHARGE_PACKAGES} />;
}
