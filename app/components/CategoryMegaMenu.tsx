'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  TrendingUp, 
  Binary, 
  Bitcoin, 
  GraduationCap, 
  Trophy, 
  Spade, 
  Users, 
  Download,
  Bot,
  Activity,
  Code,
  Terminal,
  Video,
  Signal,
  ChartLine,
  BookOpen,
  Book,
  Briefcase,
  Package,
  Share2,
  Calculator,
  BarChart,
  Folder
} from 'lucide-react';

type Category = {
  id: string;
  slug: string;
  name: string;
  urlPath: string;
  icon: string;
  color: string;
  children?: Category[];
  metaDescription?: string;
};

const iconMap: Record<string, any> = {
  TrendingUp,
  Binary,
  Bitcoin,
  GraduationCap,
  Trophy,
  Spade,
  Users,
  Download,
  Bot,
  Activity,
  Code,
  Terminal,
  Video,
  Signal,
  ChartLine,
  BookOpen,
  Book,
  Briefcase,
  Package,
  Share2,
  Calculator,
  BarChart,
  Folder
};

export function CategoryMegaMenu() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/seo-categories/tree');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName] || Folder;
    return <IconComponent className="w-4 h-4" />;
  };

  const getCategoryColor = (color: string) => {
    const colorMap: Record<string, string> = {
      'bg-blue-500': 'text-blue-600 hover:bg-blue-50',
      'bg-purple-500': 'text-purple-600 hover:bg-purple-50',
      'bg-orange-500': 'text-orange-600 hover:bg-orange-50',
      'bg-green-500': 'text-green-600 hover:bg-green-50',
      'bg-red-500': 'text-red-600 hover:bg-red-50',
      'bg-pink-500': 'text-pink-600 hover:bg-pink-50',
      'bg-indigo-500': 'text-indigo-600 hover:bg-indigo-50',
      'bg-gray-500': 'text-gray-600 hover:bg-gray-50',
    };
    return colorMap[color] || 'text-gray-600 hover:bg-gray-50';
  };

  if (loading) {
    return (
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="animate-pulse h-10 bg-gray-200 rounded"></div>
        </div>
      </nav>
    );
  }

  return (
    <>
      {/* Desktop Mega Menu */}
      <nav className="hidden lg:block bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <ul className="flex space-x-1">
              {categories.map((category) => (
                <li
                  key={category.id}
                  className="relative"
                  onMouseEnter={() => setActiveCategory(category.id)}
                  onMouseLeave={() => setActiveCategory(null)}
                >
                  <Link
                    href={category.urlPath}
                    className={`flex items-center gap-2 px-4 py-4 font-medium transition-colors ${getCategoryColor(category.color)}`}
                  >
                    {getIcon(category.icon)}
                    <span>{category.name}</span>
                    {category.children && category.children.length > 0 && (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </Link>
                  
                  {/* Dropdown Menu */}
                  {category.children && category.children.length > 0 && activeCategory === category.id && (
                    <div className="absolute left-0 top-full bg-white border border-gray-200 shadow-xl rounded-lg min-w-[280px] max-w-[400px] p-4 z-50">
                      <div className="mb-3">
                        <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">
                          {category.name} Categories
                        </h3>
                        {category.metaDescription && (
                          <p className="text-xs text-gray-500 mt-1">
                            {category.metaDescription}
                          </p>
                        )}
                      </div>
                      <ul className="space-y-1">
                        {category.children.map((child) => (
                          <li key={child.id}>
                            <Link
                              href={child.urlPath}
                              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                            >
                              {getIcon(child.icon)}
                              <span>{child.name}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                      {/* View All Link */}
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <Link
                          href={category.urlPath}
                          className="text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                          View all {category.name} →
                        </Link>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <nav className="lg:hidden bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-full py-4 flex items-center justify-between text-left"
            aria-label="Toggle menu"
          >
            <span className="font-medium text-gray-900">Browse Categories</span>
            <ChevronDown className={`w-5 h-5 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isMenuOpen && (
            <div className="pb-4 space-y-2">
              {categories.map((category) => (
                <div key={category.id} className="border-t border-gray-100 pt-2">
                  <Link
                    href={category.urlPath}
                    className={`flex items-center gap-2 px-3 py-2 font-medium rounded-md ${getCategoryColor(category.color)}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {getIcon(category.icon)}
                    <span>{category.name}</span>
                  </Link>
                  
                  {category.children && category.children.length > 0 && (
                    <ul className="ml-8 mt-1 space-y-1">
                      {category.children.map((child) => (
                        <li key={child.id}>
                          <Link
                            href={child.urlPath}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            {getIcon(child.icon)}
                            <span>{child.name}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* SEO Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SiteNavigationElement",
            "name": "Main Categories",
            "hasPart": categories.map(cat => ({
              "@type": "SiteNavigationElement",
              "name": cat.name,
              "url": `https://yourdomain.com${cat.urlPath}`,
              "hasPart": cat.children?.map(child => ({
                "@type": "SiteNavigationElement",
                "name": child.name,
                "url": `https://yourdomain.com${child.urlPath}`
              }))
            }))
          })
        }}
      />
    </>
  );
}