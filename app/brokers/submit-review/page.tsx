import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SubmitBrokerReviewClient from "./SubmitBrokerReviewClient";
import { getInternalApiUrl } from "../../lib/api-config";

export const metadata: Metadata = {
  title: "Submit Broker Review | YoForex",
  description: "Share your experience with forex brokers. Help the community make informed decisions and earn coins.",
  keywords: "broker review, submit review, broker feedback, forex broker rating",
  openGraph: {
    title: "Submit Broker Review | YoForex",
    description: "Share your experience with forex brokers. Help the community make informed decisions and earn coins.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Submit Broker Review | YoForex",
    description: "Share your experience with forex brokers. Help the community make informed decisions and earn coins.",
  },
};

async function checkAuth() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
  
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("connect.sid");
    
    if (!sessionCookie) {
      return null;
    }

    const apiUrl = getInternalApiUrl();
    console.log(`[SSR Fetch] Fetching: ${apiUrl}/api/me`);
    const response = await fetch(`${apiUrl}/api/me`, {
      signal: controller.signal,
      headers: { Cookie: `connect.sid=${sessionCookie.value}` },
      cache: "no-store",
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`[SSR Fetch] Failed /api/me: ${response.status}`);
      return null;
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeout);
    console.error("[SSR Fetch] Error checking auth:", error);
    return null;
  }
}

async function getBrokers() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
  
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("connect.sid");
    
    const apiUrl = getInternalApiUrl();
    console.log(`[SSR Fetch] Fetching: ${apiUrl}/api/brokers`);
    const response = await fetch(`${apiUrl}/api/brokers`, {
      signal: controller.signal,
      headers: sessionCookie ? { Cookie: `connect.sid=${sessionCookie.value}` } : {},
      cache: "no-store",
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`[SSR Fetch] Failed /api/brokers: ${response.status}`);
      return [];
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeout);
    console.error("[SSR Fetch] Error fetching brokers:", error);
    return [];
  }
}

export default async function SubmitBrokerReviewPage() {
  // Check authentication - this is an authenticated page
  const user = await checkAuth();
  if (!user) {
    redirect("/");
  }

  // Fetch broker list for selection dropdown
  const brokers = await getBrokers();

  return <SubmitBrokerReviewClient initialBrokers={brokers} />;
}
