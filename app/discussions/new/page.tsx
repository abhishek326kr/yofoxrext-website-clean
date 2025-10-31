import { Suspense } from "react";
import ThreadComposeClient from "./ThreadComposeClient";
import type { ForumCategory } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

async function getCategories(): Promise<ForumCategory[]> {
  try {
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const res = await fetch(`${baseUrl}/api/categories`, {
      cache: 'no-store',
    });
    
    if (!res.ok) {
      console.error('Failed to fetch categories:', res.status);
      return [];
    }
    
    return res.json();
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export default async function CreateThreadPage() {
  const categories = await getCategories();
  
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    }>
      <ThreadComposeClient categories={categories} />
    </Suspense>
  );
}

export const metadata = {
  title: "Create New Thread | YoForex Community",
  description: "Start a discussion with the YoForex trading community. Ask questions, share insights, and connect with fellow traders.",
};
