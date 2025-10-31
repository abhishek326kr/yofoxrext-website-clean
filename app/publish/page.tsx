import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import PublishClient from "./PublishClient";
import { getInternalApiUrl } from "../lib/api-config";

export const metadata: Metadata = {
  title: "Publish Content | YoForex",
  description: "Share your expert advisors, indicators, and trading articles with the YoForex community. Earn coins for quality content.",
  keywords: "publish, upload EA, share indicators, trading articles, content creator, MT4, MT5, forex, trading",
  openGraph: {
    title: "Publish Content | YoForex",
    description: "Share your expert advisors, indicators, and trading articles with the YoForex community. Earn coins for quality content.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Publish Content | YoForex",
    description: "Share your expert advisors, indicators, and trading articles with the YoForex community. Earn coins for quality content.",
  },
};

async function getCategories() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
  
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("connect.sid");
    const apiUrl = getInternalApiUrl();
    
    console.log(`[SSR Fetch] Fetching: ${apiUrl}/api/publish/categories`);
    const response = await fetch(`${apiUrl}/api/publish/categories`, {
      signal: controller.signal,
      headers: sessionCookie ? { Cookie: `connect.sid=${sessionCookie.value}` } : {},
      cache: "no-store",
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`[SSR Fetch] Failed /api/publish/categories: ${response.status}`);
      return [];
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeout);
    console.error("[SSR Fetch] Error fetching categories:", error);
    return [];
  }
}

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

export default async function PublishPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  // Check authentication
  const user = await checkAuth();
  if (!user) {
    redirect("/");
  }

  // Fetch categories
  const categories = await getCategories();
  
  // Get category param
  const params = await searchParams;
  const categoryParam = params.category;

  return <PublishClient initialCategories={categories} categoryParam={categoryParam} />;
}
