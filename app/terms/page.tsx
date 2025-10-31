import type { Metadata } from 'next';
import Header from '@/components/Header';
import EnhancedFooter from '@/components/EnhancedFooter';

export const metadata: Metadata = {
  title: 'Terms & Conditions | YoForex',
  description: 'Terms and conditions for using YoForex trading forum and marketplace',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Terms & Conditions</h1>
        <div className="prose prose-lg dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          
          <section>
            <h2>1. Acceptance of Terms</h2>
            <p>By accessing and using YoForex, you accept and agree to be bound by these Terms & Conditions. If you do not agree, please do not use our platform.</p>
          </section>

          <section>
            <h2>2. User Accounts</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials. You must notify us immediately of any unauthorized access. You must be at least 18 years old to create an account.</p>
          </section>

          <section>
            <h2>3. User-Generated Content</h2>
            <p>Users may post content including forum threads, replies, Expert Advisors, indicators, and reviews. By posting content, you grant YoForex a worldwide, non-exclusive, royalty-free license to use, display, and distribute your content on the platform.</p>
            <p><strong>Content Moderation:</strong> We reserve the right to remove content that violates our rules or is reported as inappropriate. However, we are not responsible for user-generated content. Users post at their own risk.</p>
            <p><strong>Your Responsibility:</strong> You are solely responsible for the content you post. You must not post content that is illegal, defamatory, harassing, or infringes on intellectual property rights.</p>
          </section>

          <section>
            <h2>4. Gold Coin Economy</h2>
            <p>YoForex uses a virtual currency called "gold coins" for transactions. Coin purchases are final and non-refundable except as specified in our Refund Policy. The exchange rate is 100 coins = $5.50 USD.</p>
            <p>Coins earned through platform activities (publishing content, replies, reviews) are subject to our earning limits and anti-abuse policies.</p>
          </section>

          <section>
            <h2>5. Marketplace Transactions</h2>
            <p>Users can publish and sell Expert Advisors, indicators, articles, and source code. Sellers retain ownership of their intellectual property but grant buyers a license to use purchased content for personal trading only.</p>
            <p><strong>Commission Structure:</strong> YoForex takes a 20% commission on EA/indicator/article sales and 25% on set files.</p>
            <p><strong>No Guarantees:</strong> YoForex does not guarantee the performance, profitability, or quality of any trading tools sold on the platform. Buyers purchase at their own risk.</p>
          </section>

          <section>
            <h2>6. Prohibited Activities</h2>
            <p>You may not:</p>
            <ul>
              <li>Post spam, scams, or fraudulent content</li>
              <li>Manipulate rankings, ratings, or reviews</li>
              <li>Harass, threaten, or abuse other users</li>
              <li>Reverse engineer, hack, or compromise platform security</li>
              <li>Use automated bots or scripts to manipulate the platform</li>
              <li>Share or resell purchased content without authorization</li>
            </ul>
          </section>

          <section>
            <h2>7. Termination</h2>
            <p>We reserve the right to suspend or terminate accounts that violate these terms or engage in prohibited activities. Upon termination, you forfeit any remaining coins and access to purchased content.</p>
          </section>

          <section>
            <h2>8. Disclaimer of Warranties</h2>
            <p>YoForex is provided "as is" without warranties of any kind. We do not guarantee uninterrupted access, accuracy of content, or that the platform is error-free.</p>
            <p><strong>Trading Risk:</strong> Forex trading involves substantial risk. YoForex is not responsible for trading losses incurred using tools or strategies discussed on the platform.</p>
          </section>

          <section>
            <h2>9. Limitation of Liability</h2>
            <p>YoForex and its operators shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the platform, including but not limited to trading losses, data loss, or service interruptions.</p>
          </section>

          <section>
            <h2>10. Intellectual Property</h2>
            <p>All YoForex branding, design, and original content are owned by YoForex. User-generated content remains the property of its creators but is licensed to YoForex as described above.</p>
          </section>

          <section>
            <h2>11. Governing Law</h2>
            <p>These terms are governed by the laws of England and Wales. Disputes will be resolved in the courts of London, United Kingdom.</p>
          </section>

          <section>
            <h2>12. Changes to Terms</h2>
            <p>We may update these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.</p>
          </section>

          <section>
            <h2>13. Contact</h2>
            <p>For questions about these terms, contact us at support@yoforex.net or via our support page.</p>
          </section>
        </div>
      </main>
      <EnhancedFooter />
    </div>
  );
}
