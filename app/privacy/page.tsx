import type { Metadata } from 'next';
import Header from '@/components/Header';
import EnhancedFooter from '@/components/EnhancedFooter';

export const metadata: Metadata = {
  title: 'Privacy Policy | YoForex',
  description: 'Learn how YoForex collects, uses, and protects your personal data',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <div className="prose prose-lg dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          
          <section>
            <h2>1. Introduction</h2>
            <p>YoForex ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform. We comply with GDPR and other applicable data protection laws.</p>
          </section>

          <section>
            <h2>2. Information We Collect</h2>
            <p>We collect the following types of information:</p>
            <h3>Personal Information:</h3>
            <ul>
              <li>Email address (required for registration)</li>
              <li>Username and display name</li>
              <li>Profile information you choose to provide</li>
              <li>Payment information (processed by third-party payment providers)</li>
            </ul>
            <h3>Usage Data:</h3>
            <ul>
              <li>Trading activity and content interactions</li>
              <li>Forum posts, replies, and published content</li>
              <li>Gold coin transactions and wallet activity</li>
              <li>IP address and browser information</li>
              <li>Pages visited and time spent on platform</li>
            </ul>
            <h3>Cookies and Tracking:</h3>
            <ul>
              <li>Essential cookies for functionality (login, session management)</li>
              <li>Analytics cookies to improve user experience</li>
              <li>Preference cookies to remember your settings</li>
            </ul>
          </section>

          <section>
            <h2>3. How We Use Your Information</h2>
            <p>We use your information for the following purposes:</p>
            <ul>
              <li>To provide and maintain platform services</li>
              <li>To process transactions and manage your gold coin wallet</li>
              <li>To send important notifications about your account</li>
              <li>To detect and prevent fraud, abuse, and security threats</li>
              <li>To analyze platform usage and improve features</li>
              <li>To enforce our Terms & Conditions and community guidelines</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2>4. Data Sharing and Disclosure</h2>
            <p><strong>We do not sell your personal data.</strong></p>
            <p>We may share your information only in the following circumstances:</p>
            <ul>
              <li><strong>With Your Consent:</strong> When you explicitly authorize us to share information</li>
              <li><strong>Service Providers:</strong> Third-party services that help us operate (payment processors, hosting providers)</li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or government request</li>
              <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or asset sale</li>
              <li><strong>Public Information:</strong> Content you post publicly (threads, replies, reviews) is visible to other users</li>
            </ul>
          </section>

          <section>
            <h2>5. Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul>
              <li>Payment processors for coin purchases and withdrawals</li>
              <li>Email service providers for notifications</li>
              <li>Cloud hosting and database services</li>
              <li>Analytics tools to understand platform usage</li>
            </ul>
            <p>These providers have their own privacy policies and data handling practices.</p>
          </section>

          <section>
            <h2>6. Your Rights (GDPR Compliance)</h2>
            <p>Under GDPR and other data protection laws, you have the right to:</p>
            <ul>
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
              <li><strong>Deletion:</strong> Request deletion of your data ("right to be forgotten")</li>
              <li><strong>Restriction:</strong> Limit how we process your data</li>
              <li><strong>Portability:</strong> Receive your data in a machine-readable format</li>
              <li><strong>Objection:</strong> Object to certain types of data processing</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent for data processing at any time</li>
            </ul>
            <p>To exercise these rights, contact us at support@yoforex.net with "Data Request" in the subject line.</p>
          </section>

          <section>
            <h2>7. Data Retention</h2>
            <p>We retain your data for as long as your account is active or as needed to provide services. After account deletion:</p>
            <ul>
              <li>Personal information is deleted within 30 days</li>
              <li>Public posts may remain for platform integrity (with username anonymized)</li>
              <li>Transaction records are retained for legal and accounting purposes (up to 7 years)</li>
              <li>Backups may retain data for up to 90 days</li>
            </ul>
          </section>

          <section>
            <h2>8. Security</h2>
            <p>We implement industry-standard security measures including:</p>
            <ul>
              <li>Encryption of data in transit (SSL/TLS)</li>
              <li>Secure password hashing</li>
              <li>Regular security audits and monitoring</li>
              <li>Access controls and authentication systems</li>
            </ul>
            <p>However, no system is 100% secure. You are responsible for keeping your password confidential.</p>
          </section>

          <section>
            <h2>9. Children's Privacy</h2>
            <p>YoForex is not intended for users under 18 years old. We do not knowingly collect data from children. If you believe a child has provided us with personal information, contact us immediately.</p>
          </section>

          <section>
            <h2>10. International Data Transfers</h2>
            <p>Your data may be transferred to and processed in countries outside your jurisdiction. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy.</p>
          </section>

          <section>
            <h2>11. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of significant changes via email or platform notification. Your continued use after changes constitutes acceptance of the updated policy.</p>
          </section>

          <section>
            <h2>12. Contact Us</h2>
            <p>For privacy-related questions or to exercise your data rights, contact us at:</p>
            <ul>
              <li>Email: support@yoforex.net</li>
              <li>Subject: Data Privacy Request</li>
              <li>Address: 44 Tunnel Avenue, London, United Kingdom</li>
            </ul>
          </section>
        </div>
      </main>
      <EnhancedFooter />
    </div>
  );
}
