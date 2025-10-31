"use client";

import Link from "next/link";
import { MessageSquare, FileText, Folder } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Category {
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  parentSlug?: string | null;
  threadCount: number;
  postCount: number;
  children?: Category[];
}

interface CategoryTreeProps {
  categories: Category[];
  limit?: number;
}

const getCategoryIcon = (color: string) => {
  const iconClasses = `w-10 h-10 flex items-center justify-center rounded-md ${color}`;
  return (
    <div className={iconClasses}>
      <Folder className="w-5 h-5 text-white" />
    </div>
  );
};

export function CategoryTree({ categories, limit }: CategoryTreeProps) {
  // Filter for main (parent) categories first, then apply limit
  const mainCategories = categories.filter(c => !c.parentSlug);
  const displayCategories = limit ? mainCategories.slice(0, limit) : mainCategories;
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5" data-testid="category-grid">
      {displayCategories.map((category) => {
        return (
          <Link 
            key={category.slug} 
            href={`/category/${category.slug}`}
            data-testid={`link-category-${category.slug}`}
          >
            <Card className="border-0 shadow-sm hover-elevate active-elevate-2 h-full" data-testid={`card-category-${category.slug}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {getCategoryIcon(category.color)}
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm mb-1 line-clamp-2 leading-snug" data-testid={`text-category-name-${category.slug}`}>
                      {category.name}
                    </h3>
                    
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2.5 leading-relaxed">
                      {category.description}
                    </p>
                    
                    <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1" data-testid={`stat-threads-${category.slug}`}>
                        <MessageSquare className="w-3 h-3" />
                        <span>{category.threadCount}</span>
                      </div>
                      <div className="flex items-center gap-1" data-testid={`stat-posts-${category.slug}`}>
                        <FileText className="w-3 h-3" />
                        <span>{category.postCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
