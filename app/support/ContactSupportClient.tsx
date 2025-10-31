'use client';

import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Send, HelpCircle, Mail, AlertOctagon, MapPin, Clock } from "lucide-react";

export default function ContactSupportClient() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container max-w-6xl mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <HelpCircle className="h-8 w-8 text-primary" />
              <CardTitle className="text-3xl">Contact Support</CardTitle>
            </div>
            <CardDescription>
              Multiple ways to get help - choose what works best for you
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card className="hover-elevate active-elevate-2">
            <CardHeader>
              <MessageCircle className="h-10 w-10 text-primary mb-3" />
              <CardTitle>Telegram Support</CardTitle>
              <CardDescription>
                Fastest response - usually within minutes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                <li>• Instant responses from community</li>
                <li>• Direct support from YoForex team</li>
                <li>• Platform updates and announcements</li>
                <li>• Connect with other traders</li>
              </ul>
              <a 
                href="https://t.me/+AIByvTkkIwM3MjFl" 
                target="_blank" 
                rel="noopener noreferrer"
                data-testid="link-telegram-external"
              >
                <Button className="w-full" data-testid="button-join-telegram">
                  <Send className="w-4 h-4 mr-2" />
                  Join Telegram Group
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card className="hover-elevate active-elevate-2">
            <CardHeader>
              <Mail className="h-10 w-10 text-chart-3 mb-3" />
              <CardTitle>Email Support</CardTitle>
              <CardDescription>
                Response within 24-48 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-6">
                <div>
                  <p className="text-sm font-medium mb-1">General Support:</p>
                  <a 
                    href="mailto:support@yoforex.net" 
                    className="text-sm text-primary hover:underline"
                    data-testid="link-email-support"
                  >
                    support@yoforex.net
                  </a>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Report Abuse:</p>
                  <a 
                    href="mailto:abuse@yoforex.net" 
                    className="text-sm text-primary hover:underline"
                    data-testid="link-email-abuse"
                  >
                    abuse@yoforex.net
                  </a>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Partnerships:</p>
                  <a 
                    href="mailto:support@yoforex.net?subject=Partnership%20Inquiry" 
                    className="text-sm text-primary hover:underline"
                    data-testid="link-email-partnerships"
                  >
                    support@yoforex.net
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-elevate active-elevate-2">
            <CardHeader>
              <MessageCircle className="h-10 w-10 text-chart-2 mb-3" />
              <CardTitle>Support Forum</CardTitle>
              <CardDescription>
                Search or create a support topic
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                <li>• Browse thousands of solved issues</li>
                <li>• Get help from expert traders</li>
                <li>• Earn coins for helping others</li>
                <li>• Detailed troubleshooting guides</li>
              </ul>
              <a href="/category/beginners-corner" data-testid="link-support-forum">
                <Button variant="outline" className="w-full" data-testid="button-visit-forum">
                  Visit Support Forum
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <AlertOctagon className="h-8 w-8 text-destructive mb-2" />
              <CardTitle>Report Scams or Abuse</CardTitle>
              <CardDescription>Help keep our community safe</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                If you encounter scams, fraudulent content, or abusive behavior:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• <strong>Urgent issues:</strong> Use Telegram support for fastest response</li>
                <li>• <strong>Email:</strong> abuse@yoforex.net with evidence (screenshots, links)</li>
                <li>• <strong>Forum reports:</strong> Use the "Report" button on any post</li>
              </ul>
              <a href="mailto:abuse@yoforex.net">
                <Button variant="destructive" className="w-full mt-4" data-testid="button-report-abuse">
                  <AlertOctagon className="w-4 h-4 mr-2" />
                  Report Abuse
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <MapPin className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Our address and response times</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Registered Address:</p>
                <p className="text-sm text-muted-foreground">
                  YoForex Ltd<br />
                  44 Tunnel Avenue<br />
                  London, United Kingdom
                </p>
              </div>
              <div className="flex items-start gap-2 pt-2">
                <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium mb-1">Response Times:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Telegram: Minutes to hours</li>
                    <li>• Email: 24-48 hours</li>
                    <li>• Forum: Community-driven</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <CardDescription>Quick answers to common questions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-1">How do I report a bug?</h4>
                  <p className="text-sm text-muted-foreground">
                    Use our <a href="/feedback" className="text-primary hover:underline" data-testid="link-feedback-faq">feedback form</a> to report bugs with detailed steps to reproduce.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">How do I earn gold coins?</h4>
                  <p className="text-sm text-muted-foreground">
                    Visit the <a href="/earn" className="text-primary hover:underline" data-testid="link-earn-coins-faq">Earn Coins</a> page to learn about all the ways to earn rewards on YoForex.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Where can I find API documentation?</h4>
                  <p className="text-sm text-muted-foreground">
                    Check out our <a href="/api-docs" className="text-primary hover:underline" data-testid="link-api-docs-faq">API Documentation</a> for public endpoints and integration guides.
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-1">How do I become a verified contributor?</h4>
                  <p className="text-sm text-muted-foreground">
                    Build your reputation by posting quality content, helping others, and contributing valuable EAs. Your trust level will automatically increase.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Can I request a refund?</h4>
                  <p className="text-sm text-muted-foreground">
                    Review our <a href="/refund-policy" className="text-primary hover:underline">Refund Policy</a> for details on coin purchases and marketplace content.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">How do I delete my account?</h4>
                  <p className="text-sm text-muted-foreground">
                    Contact support@yoforex.net with "Account Deletion Request" in the subject. Your data will be deleted per our <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <EnhancedFooter />
    </div>
  );
}
