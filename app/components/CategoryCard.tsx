"use client";

import { Card } from "@/components/ui/card";
import { Users, MessageSquare, LucideIcon } from "lucide-react";
import Link from "next/link";

interface CategoryCardProps {
  name: string;
  description: string;
  icon: LucideIcon;
  threadCount: number;
  postCount: number;
  color?: string;
  slug?: string;
}

export default function CategoryCard({
  name,
  description,
  icon: Icon,
  threadCount,
  postCount,
  color = "bg-primary",
  slug
}: CategoryCardProps) {
  const categorySlug = slug || name.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <Link href={`/category/${categorySlug}`}>
      <Card 
        className="group relative flex flex-col bg-card rounded-lg border border-border p-4 
                   w-full min-h-[160px] shadow-sm
                   hover-elevate active-elevate-2 hover:shadow-xl hover:scale-105 hover:z-10
                   transition-all duration-200 hover:border-primary/30 cursor-pointer"
        data-testid={`card-category-${categorySlug}`}
      >
        {/* Icon + Title Row */}
        <div className="flex items-start gap-2 mb-2">
          {/* Icon with grey background */}
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
            <Icon className="w-4 h-4 text-muted-foreground" />
          </div>
          
          {/* Title */}
          <div className="flex-1 min-w-0">
            <h3 
              className="text-sm font-semibold text-foreground leading-tight 
                         group-hover:text-primary transition-colors line-clamp-2 group-hover:line-clamp-none"
              data-testid="text-category-name"
            >
              {name}
            </h3>
          </div>
        </div>
        
        {/* Description - 2 line clamp */}
        <p 
          className="text-xs text-muted-foreground leading-relaxed line-clamp-2 group-hover:line-clamp-none mb-3 flex-1"
          data-testid="text-category-description"
        >
          {description}
        </p>
        
        {/* Stats Row - Bottom aligned, horizontal layout */}
        <div className="flex flex-col gap-1 text-xs text-muted-foreground mt-auto">
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="font-semibold" data-testid="text-thread-count">{threadCount.toLocaleString()}</span>
            <span className="whitespace-nowrap">threads</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="font-semibold" data-testid="text-post-count">{postCount.toLocaleString()}</span>
            <span className="whitespace-nowrap">posts</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
