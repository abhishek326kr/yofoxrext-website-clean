"use client";

import Link from "next/link";

export default function EnhancedFooter() {
  return (
    <footer className="border-t mt-auto">
      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Main Footer Content - 5 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
          {/* Column 1: About YoForex */}
          <div>
            <h3 className="font-semibold mb-4">About YoForex</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Professional EA forum for algorithmic trading. Share strategies, EAs, and earn gold coins for quality contributions.
            </p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium">Address:</p>
              <p>44 Tunnel Avenue</p>
              <p>London, United Kingdom</p>
            </div>
          </div>

          {/* Column 2: Legal */}
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground" data-testid="footer-link-terms">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground" data-testid="footer-link-privacy">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="text-muted-foreground hover:text-foreground" data-testid="footer-link-refund">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/guides/forum-rules" className="text-muted-foreground hover:text-foreground" data-testid="footer-link-rules">
                  Forum Rules
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Support */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a 
                  href="mailto:support@yoforex.net" 
                  className="text-muted-foreground hover:text-foreground"
                  data-testid="footer-link-email"
                >
                  support@yoforex.net
                </a>
              </li>
              <li>
                <Link 
                  href="/support" 
                  className="text-muted-foreground hover:text-foreground"
                  data-testid="footer-link-abuse"
                >
                  Report Abuse
                </Link>
              </li>
              <li>
                <a 
                  href="https://t.me/+AIByvTkkIwM3MjFl" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                  data-testid="footer-link-telegram"
                >
                  Telegram Support
                </a>
              </li>
              <li>
                <Link href="/support" className="text-muted-foreground hover:text-foreground" data-testid="footer-link-contact">
                  Contact Support
                </Link>
              </li>
              <li>
                <Link href="/feedback" className="text-muted-foreground hover:text-foreground" data-testid="footer-link-feedback">
                  Submit Feedback
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Community */}
          <div>
            <h3 className="font-semibold mb-4">Community</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/discussions" className="text-muted-foreground hover:text-foreground" data-testid="footer-link-discussions">
                  Join Discussions
                </Link>
              </li>
              <li>
                <Link href="/guides/new-member-quickstart" className="text-muted-foreground hover:text-foreground" data-testid="footer-link-quickstart">
                  New Member Guide
                </Link>
              </li>
              <li>
                <Link href="/api-docs" className="text-muted-foreground hover:text-foreground" data-testid="footer-link-api">
                  API Documentation
                </Link>
              </li>
              <li>
                <Link href="/brokers" className="text-muted-foreground hover:text-foreground" data-testid="footer-link-brokers">
                  Broker Directory
                </Link>
              </li>
              <li>
                <Link href="/marketplace" className="text-muted-foreground hover:text-foreground" data-testid="footer-link-marketplace">
                  Marketplace
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: Opportunities */}
          <div>
            <h3 className="font-semibold mb-4">Opportunities</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/partnerships" className="text-muted-foreground hover:text-foreground" data-testid="footer-link-partnerships">
                  Partnerships
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-muted-foreground hover:text-foreground" data-testid="footer-link-careers">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/guides/marketplace-seller-guide" className="text-muted-foreground hover:text-foreground" data-testid="footer-link-seller">
                  Become a Seller
                </Link>
              </li>
              <li>
                <Link href="/earn" className="text-muted-foreground hover:text-foreground" data-testid="footer-link-earn">
                  Earn Coins
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer & Copyright */}
        <div className="border-t pt-8 space-y-4">
          <p className="text-xs text-muted-foreground">
            <strong>Disclaimer:</strong> YoForex is a community-driven platform. While we moderate content, we are not responsible for user-generated posts, trading advice, or Expert Advisors shared by members. All trading involves risk. For content removal requests, contact abuse@yoforex.net or use our Telegram support for faster action.
          </p>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} YoForex. All rights reserved.</p>
            <p>Version v1.2.3 • Build 1761771486385</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
