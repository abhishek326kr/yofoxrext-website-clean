import { NextResponse } from 'next/server';
import { db } from '../../../../server/db';
import { seoCategories } from '../../../../shared/schema';
import { eq, and, isNull, asc } from 'drizzle-orm';

export async function GET() {
  try {
    // Fetch all active categories ordered by sortOrder
    const allCategories = await db
      .select()
      .from(seoCategories)
      .where(
        and(
          eq(seoCategories.isActive, true),
          eq(seoCategories.showInMenu, true)
        )
      )
      .orderBy(asc(seoCategories.sortOrder));
    
    // Separate main categories and subcategories
    const mainCategories = allCategories.filter(cat => !cat.parentId);
    const subCategories = allCategories.filter(cat => cat.parentId);
    
    // Build the tree structure
    const categoryTree = mainCategories.map(mainCat => ({
      ...mainCat,
      children: subCategories
        .filter(subCat => subCat.parentId === mainCat.id)
        .sort((a, b) => a.sortOrder - b.sortOrder)
    }));
    
    return NextResponse.json(categoryTree);
  } catch (error) {
    console.error('Failed to fetch category tree:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}