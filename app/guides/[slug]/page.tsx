import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { promises as fs } from 'fs';
import path from 'path';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Home, ArrowLeft, BookOpen } from 'lucide-react';
import Header from '@/components/Header';
import EnhancedFooter from '@/components/EnhancedFooter';

interface GuidePageProps {
  params: Promise<{
    slug: string;
  }>;
}

// List of available guides
const AVAILABLE_GUIDES = [
  'forum-rules',
  'safe-download-guide',
  'verified-brokers',
  'ea-coding-rules',
  'how-to-earn-coins',
  'how-to-get-your-thread-seen',
  'how-to-rank-articles-blogs',
  'how-to-rank-ea-publications',
  'new-member-quickstart',
  'report-a-scam',
  'badges-levels',
  'marketplace-seller-guide',
  'template-beginner-thread',
  'template-ea-review',
  'template-trading-journal'
];

// Generate static params for all guide pages
export async function generateStaticParams() {
  return AVAILABLE_GUIDES.map((slug) => ({
    slug: slug,
  }));
}

// Generate metadata for each guide page
export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  
  // Title map for better SEO
  const titleMap: Record<string, string> = {
    'forum-rules': 'Forum Rules - YoForex Community Guidelines',
    'safe-download-guide': 'Safe Download Guide - Protect Yourself When Downloading EAs',
    'verified-brokers': 'Verified Brokers - Trusted Forex Broker List',
    'ea-coding-rules': 'EA Coding Rules - Fair Code Sharing Guidelines',
    'how-to-earn-coins': 'How to Earn Coins - Complete Gold Coin Guide',
    'how-to-get-your-thread-seen': 'How to Get Your Thread Seen - Forum Visibility Tips',
    'how-to-rank-articles-blogs': 'How to Rank Articles & Blogs - SEO Writing Guide',
    'how-to-rank-ea-publications': 'How to Rank EA Publications - Marketplace Success Guide',
    'new-member-quickstart': 'New Member Quickstart - Post Your First Thread',
    'report-a-scam': 'Report a Scam - Protect the Community',
    'badges-levels': 'Badges & Levels - How to Level Up on YoForex',
    'marketplace-seller-guide': 'Marketplace Seller Guide - Selling EAs & Indicators',
    'template-beginner-thread': 'Template: Beginner Thread - Easy Post Template',
    'template-ea-review': 'Template: EA Review - How to Write Fair Reviews',
    'template-trading-journal': 'Template: Trading Journal - Weekly Trading Log'
  };

  const title = titleMap[slug] || 'Guide - YoForex';

  return {
    title: title,
    description: `Learn about ${slug.replace(/-/g, ' ')} with our comprehensive guide on YoForex.`,
  };
}

async function getGuideContent(slug: string): Promise<string | null> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'guides', `${slug}.md`);
    const content = await fs.readFile(filePath, 'utf8');
    return content;
  } catch (error) {
    return null;
  }
}

function extractTitle(markdown: string): string {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1] : 'Guide';
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;

  // Check if guide exists
  if (!AVAILABLE_GUIDES.includes(slug)) {
    notFound();
  }

  const content = await getGuideContent(slug);

  if (!content) {
    notFound();
  }

  const title = extractTitle(content);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link 
            href="/" 
            className="hover:text-foreground transition-colors flex items-center gap-1"
            data-testid="link-home"
          >
            <Home className="w-4 h-4" />
            Home
          </Link>
          <span>/</span>
          <Link 
            href="/#important-links" 
            className="hover:text-foreground transition-colors"
            data-testid="link-guides"
          >
            Guides
          </Link>
          <span>/</span>
          <span className="text-foreground">{title}</span>
        </nav>

        {/* Back button */}
        <Link 
          href="/#important-links"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          data-testid="link-back-to-guides"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all guides
        </Link>

        {/* Guide content */}
        <article className="prose prose-slate dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </article>

        {/* Help section */}
        <div className="mt-12 p-6 bg-card rounded-lg border">
          <div className="flex items-start gap-4">
            <BookOpen className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold mb-2">Still Have Questions?</h3>
              <p className="text-muted-foreground mb-4">
                If this guide didn't answer your question, the community is here to help.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/discussions"
                  className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
                  data-testid="link-ask-community"
                >
                  Ask the Community
                </Link>
                <Link
                  href="/#important-links"
                  className="inline-flex items-center px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors text-sm font-medium"
                  data-testid="link-more-guides"
                >
                  View More Guides
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <EnhancedFooter />
    </div>
  );
}
