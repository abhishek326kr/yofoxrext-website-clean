import type { Metadata } from 'next';
import Header from '@/components/Header';
import EnhancedFooter from '@/components/EnhancedFooter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Handshake, TrendingUp, Users, Megaphone } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Partnerships | YoForex',
  description: 'Partner with YoForex - Broker partnerships, advertising opportunities, and affiliate programs',
};

export default function PartnershipsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Partnership Opportunities</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join forces with YoForex to reach thousands of active algorithmic traders and EA developers
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Handshake className="h-8 w-8 text-primary" />
                <CardTitle>Broker Partnerships</CardTitle>
              </div>
              <CardDescription>Featured listings and exclusive broker benefits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">What We Offer:</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Featured placement in our Broker Directory</li>
                  <li>• Verified broker badge and enhanced profile</li>
                  <li>• Priority review moderation and scam protection</li>
                  <li>• Direct access to 10,000+ active traders</li>
                  <li>• Custom landing pages and promotional content</li>
                  <li>• Performance tracking and analytics</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Ideal For:</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• MT4/MT5 brokers seeking EA traders</li>
                  <li>• Brokers with competitive spreads and execution</li>
                  <li>• Platforms supporting automated trading</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Megaphone className="h-8 w-8 text-primary" />
                <CardTitle>Advertising Programs</CardTitle>
              </div>
              <CardDescription>Reach our highly targeted trading audience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Advertising Options:</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Banner ads (homepage, discussion pages)</li>
                  <li>• Sponsored content and featured posts</li>
                  <li>• Newsletter sponsorships (email campaigns)</li>
                  <li>• Product placement in marketplace</li>
                  <li>• Native advertising in forum threads</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Ad Specifications:</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Banner sizes: 728x90, 300x250, 970x250</li>
                  <li>• Formats: Static images, GIFs (no Flash)</li>
                  <li>• File size: Max 150KB per creative</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="h-8 w-8 text-primary" />
                <CardTitle>Affiliate Programs</CardTitle>
              </div>
              <CardDescription>Earn commissions by promoting YoForex</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Affiliate Benefits:</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Earn 10% commission on referred coin purchases</li>
                  <li>• 5% commission on marketplace sales</li>
                  <li>• Recurring revenue from active users</li>
                  <li>• Real-time tracking dashboard</li>
                  <li>• Marketing materials and banners provided</li>
                  <li>• Monthly payouts via USDT or bank transfer</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Who Should Apply:</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Trading educators and course creators</li>
                  <li>• Forex bloggers and content creators</li>
                  <li>• YouTube channels and podcasts</li>
                  <li>• Trading communities and Discord servers</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-8 w-8 text-primary" />
                <CardTitle>Our Audience</CardTitle>
              </div>
              <CardDescription>Demographics and platform statistics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Platform Metrics:</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• <strong>10,000+</strong> registered members</li>
                  <li>• <strong>50,000+</strong> monthly page views</li>
                  <li>• <strong>500+</strong> daily active users</li>
                  <li>• <strong>2,000+</strong> EAs and indicators published</li>
                  <li>• Average session: 8 minutes</li>
                  <li>• 65% returning visitors</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Audience Profile:</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Algorithmic traders and EA developers</li>
                  <li>• MT4/MT5 platform users</li>
                  <li>• Professional and semi-professional traders</li>
                  <li>• Global audience (top regions: EU, Asia, Americas)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>Contact our partnerships team to discuss opportunities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Contact Information:</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <strong>Email:</strong>{' '}
                    <a href="mailto:support@yoforex.net" className="text-primary hover:underline">
                      support@yoforex.net
                    </a>
                  </li>
                  <li><strong>Subject:</strong> Partnership Inquiry - [Your Company/Type]</li>
                  <li><strong>Response Time:</strong> 2-3 business days</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">What to Include:</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Partnership type (broker, advertising, affiliate)</li>
                  <li>• Company name and website</li>
                  <li>• Target audience and goals</li>
                  <li>• Budget range (for advertising)</li>
                  <li>• Proposed collaboration timeline</li>
                </ul>
              </div>
            </div>
            <div className="pt-4">
              <Button size="lg" asChild data-testid="button-contact-partnerships">
                <a href="mailto:support@yoforex.net?subject=Partnership%20Inquiry">
                  Contact Partnerships Team
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>YoForex Ltd • 44 Tunnel Avenue, London, United Kingdom</p>
          <p className="mt-2">All partnerships are subject to review and approval. Terms and conditions apply.</p>
        </div>
      </main>
      <EnhancedFooter />
    </div>
  );
}
