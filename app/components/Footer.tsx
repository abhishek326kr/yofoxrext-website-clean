import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="font-semibold mb-3">YoForex</h3>
            <p className="text-sm text-muted-foreground">
              The #1 Expert Advisor community. Download free EAs, share strategies, and earn coins.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/marketplace" className="text-muted-foreground hover:text-foreground" data-testid="link-footer-marketplace">
                  Marketplace
                </Link>
              </li>
              <li>
                <Link href="/discussions" className="text-muted-foreground hover:text-foreground" data-testid="link-footer-discussions">
                  Discussions
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-muted-foreground hover:text-foreground" data-testid="link-footer-categories">
                  Categories
                </Link>
              </li>
              <li>
                <Link href="/brokers" className="text-muted-foreground hover:text-foreground" data-testid="link-footer-brokers">
                  Brokers
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="font-semibold mb-3">Community</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/leaderboard" className="text-muted-foreground hover:text-foreground" data-testid="link-footer-leaderboard">
                  Leaderboard
                </Link>
              </li>
              <li>
                <Link href="/members" className="text-muted-foreground hover:text-foreground" data-testid="link-footer-members">
                  Members
                </Link>
              </li>
              <li>
                <Link href="/earn" className="text-muted-foreground hover:text-foreground" data-testid="link-footer-earn-coins">
                  Earn Coins
                </Link>
              </li>
              <li>
                <Link href="/feedback" className="text-muted-foreground hover:text-foreground" data-testid="link-footer-feedback">
                  Feedback
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-3">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/support" className="text-muted-foreground hover:text-foreground" data-testid="link-footer-support">
                  Contact Support
                </Link>
              </li>
              <li>
                <Link href="/api-docs" className="text-muted-foreground hover:text-foreground" data-testid="link-footer-api-docs">
                  API Docs
                </Link>
              </li>
              <li>
                <Link href="/sitemap.xml" className="text-muted-foreground hover:text-foreground" data-testid="link-footer-sitemap">
                  Sitemap
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>© 2025 YoForex. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
