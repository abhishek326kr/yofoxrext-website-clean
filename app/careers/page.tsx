import type { Metadata } from 'next';
import Header from '@/components/Header';
import EnhancedFooter from '@/components/EnhancedFooter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Globe, Code, TrendingUp, Heart, Zap, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Careers | YoForex',
  description: 'Join the YoForex team - Remote-first company building the future of algorithmic trading',
};

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Join Our Team</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Build the future of algorithmic trading with a passionate, remote-first team
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <Globe className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Remote-First</CardTitle>
              <CardDescription>Work from anywhere in the world</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                We believe in flexibility and trust. Our team works asynchronously across time zones, allowing you to work when and where you're most productive.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <TrendingUp className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Growth-Oriented</CardTitle>
              <CardDescription>Continuous learning and development</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                We invest in our team through training, conferences, and mentorship. Your growth is our growth.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Heart className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Mission-Driven</CardTitle>
              <CardDescription>Empowering algorithmic traders</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                We're building a platform that democratizes algorithmic trading and helps traders succeed through community and technology.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-12">
          <CardHeader>
            <CardTitle>About YoForex</CardTitle>
            <CardDescription>Who we are and what we do</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              YoForex is a community-driven platform for algorithmic traders, EA developers, and forex enthusiasts. We provide a marketplace for trading tools, a forum for strategy discussions, and a coin-based economy that rewards quality contributions.
            </p>
            <div className="grid md:grid-cols-2 gap-6 pt-4">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Our Culture
                </h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Transparency and open communication</li>
                  <li>• Data-driven decision making</li>
                  <li>• Rapid iteration and experimentation</li>
                  <li>• User-first mindset</li>
                  <li>• Collaborative problem-solving</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Benefits & Perks
                </h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Competitive salary and equity</li>
                  <li>• Flexible working hours</li>
                  <li>• Home office stipend</li>
                  <li>• Annual team retreats</li>
                  <li>• Learning & development budget</li>
                  <li>• Health & wellness benefits</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Open Positions</h2>
          
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Full-Stack Developer (TypeScript/Node.js)</CardTitle>
                  <CardDescription>Remote • Full-time</CardDescription>
                </div>
                <Code className="h-6 w-6 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">What You'll Do:</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Build and maintain our Next.js platform and Express backend</li>
                  <li>• Design and implement new features for marketplace and forum</li>
                  <li>• Optimize database queries and improve performance</li>
                  <li>• Work with TypeScript, React, PostgreSQL, and Drizzle ORM</li>
                  <li>• Collaborate with design and product teams</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Requirements:</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• 3+ years of full-stack development experience</li>
                  <li>• Strong TypeScript and modern JavaScript knowledge</li>
                  <li>• Experience with React, Next.js, and Node.js</li>
                  <li>• Familiarity with PostgreSQL and ORMs</li>
                  <li>• Passion for clean code and testing</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Community Manager</CardTitle>
                  <CardDescription>Remote • Full-time</CardDescription>
                </div>
                <Users className="h-6 w-6 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">What You'll Do:</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Engage with our trading community daily</li>
                  <li>• Moderate forum discussions and marketplace content</li>
                  <li>• Organize community events and challenges</li>
                  <li>• Handle support tickets and user feedback</li>
                  <li>• Create content and announcements</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Requirements:</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• 2+ years of community management experience</li>
                  <li>• Knowledge of forex trading and MT4/MT5 (preferred)</li>
                  <li>• Excellent written communication skills</li>
                  <li>• Experience with moderation tools and platforms</li>
                  <li>• Empathetic and user-focused mindset</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle>Don't See a Match?</CardTitle>
              <CardDescription>We're always looking for talented individuals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">
                If you're passionate about trading, technology, and community building but don't see a perfect role above, we'd still love to hear from you. Send us your CV and tell us what makes you excited about YoForex.
              </p>
              <div>
                <h3 className="font-semibold mb-2">Other Roles We're Exploring:</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Product Designer (UI/UX)</li>
                  <li>• DevOps Engineer</li>
                  <li>• Trading Algorithm Specialist</li>
                  <li>• Content Writer (Trading Focus)</li>
                  <li>• Data Analyst</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle>Apply Now</CardTitle>
            <CardDescription>Ready to join the YoForex team?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">How to Apply:</h3>
              <ol className="space-y-2 text-sm">
                <li><strong>1. Send your CV/Resume</strong> to jobs@yoforex.net</li>
                <li><strong>2. Include a cover letter</strong> explaining why you're interested in YoForex and the specific role</li>
                <li><strong>3. Share your portfolio/GitHub</strong> (for technical roles) or relevant work samples</li>
                <li><strong>4. Tell us about yourself</strong> - What makes you unique? What are you passionate about?</li>
              </ol>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 pt-4">
              <div>
                <h3 className="font-semibold mb-2">Contact:</h3>
                <p className="text-sm">
                  <strong>Email:</strong>{' '}
                  <a href="mailto:jobs@yoforex.net" className="text-primary hover:underline">
                    jobs@yoforex.net
                  </a>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Subject: Application - [Position Name]
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Company Address:</h3>
                <p className="text-sm text-muted-foreground">
                  YoForex Ltd<br />
                  44 Tunnel Avenue<br />
                  London, United Kingdom
                </p>
              </div>
            </div>

            <div className="pt-4">
              <Button size="lg" asChild data-testid="button-apply-now">
                <a href="mailto:jobs@yoforex.net?subject=Job%20Application">
                  Apply via Email
                </a>
              </Button>
            </div>

            <p className="text-xs text-muted-foreground pt-4">
              YoForex is an equal opportunity employer. We celebrate diversity and are committed to creating an inclusive environment for all employees.
            </p>
          </CardContent>
        </Card>
      </main>
      <EnhancedFooter />
    </div>
  );
}
