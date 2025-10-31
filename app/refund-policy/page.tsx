import type { Metadata } from 'next';
import Header from '@/components/Header';
import EnhancedFooter from '@/components/EnhancedFooter';

export const metadata: Metadata = {
  title: 'Refund Policy | YoForex',
  description: 'YoForex refund policy for gold coins, marketplace purchases, and withdrawals',
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Refund Policy</h1>
        <div className="prose prose-lg dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          
          <section>
            <h2>1. Overview</h2>
            <p>YoForex operates on a virtual currency system (gold coins) and digital marketplace. Due to the nature of digital goods and virtual currency, refunds are limited. This policy outlines when refunds may be issued.</p>
          </section>

          <section>
            <h2>2. Gold Coin Purchases</h2>
            <h3>General Policy:</h3>
            <p><strong>Gold coin purchases are final and non-refundable.</strong> Once coins are credited to your account, they cannot be refunded to your payment method.</p>
            
            <h3>Exceptions:</h3>
            <p>Refunds may be issued in the following cases:</p>
            <ul>
              <li><strong>Technical Errors:</strong> If you were charged but coins were not credited due to a technical error, contact us within 48 hours</li>
              <li><strong>Duplicate Charges:</strong> If you were charged multiple times for a single transaction</li>
              <li><strong>Unauthorized Transactions:</strong> If your account was compromised and unauthorized purchases were made (subject to investigation)</li>
            </ul>
            
            <h3>Exchange Rate:</h3>
            <p>The current exchange rate is 100 coins = $5.50 USD. This rate may change without notice. Refunds (if approved) will be issued at the rate at the time of purchase.</p>
          </section>

          <section>
            <h2>3. Marketplace Content Purchases</h2>
            <h3>No Refunds After Download:</h3>
            <p><strong>Digital content purchases (Expert Advisors, indicators, articles, set files, source code) are non-refundable once downloaded.</strong></p>
            <p>Before purchasing, you can:</p>
            <ul>
              <li>Review product descriptions, screenshots, and performance data</li>
              <li>Read user reviews and ratings</li>
              <li>Check seller reputation and trust level</li>
            </ul>
            
            <h3>Defective Content Policy (7-Day Window):</h3>
            <p>If purchased content is defective, you may request a refund within 7 days if:</p>
            <ul>
              <li>The EA or indicator fails to load or run on the specified MT4/MT5 platform</li>
              <li>Critical features described in the listing do not work</li>
              <li>Files are corrupted or missing</li>
              <li>The content is significantly misrepresented</li>
            </ul>
            
            <h3>Not Grounds for Refund:</h3>
            <p>The following are NOT valid reasons for a refund:</p>
            <ul>
              <li>EA or strategy did not generate expected profits</li>
              <li>You changed your mind after downloading</li>
              <li>You found a better product elsewhere</li>
              <li>Minor bugs or issues that can be fixed by the seller</li>
              <li>User error or incorrect configuration</li>
            </ul>
          </section>

          <section>
            <h2>4. Coin Withdrawals</h2>
            <h3>Withdrawal Policy:</h3>
            <ul>
              <li><strong>Minimum Withdrawal:</strong> 1,000 gold coins</li>
              <li><strong>Withdrawal Fee:</strong> 5% fee on all withdrawals</li>
              <li><strong>Processing Time:</strong> 3-7 business days</li>
              <li><strong>Method:</strong> USDT (Tether) or other supported cryptocurrencies</li>
            </ul>
            
            <h3>Withdrawal Restrictions:</h3>
            <p>Withdrawals may be denied or delayed if:</p>
            <ul>
              <li>Your account is under investigation for fraudulent activity</li>
              <li>Coins were earned through terms violations (fake reviews, spam, manipulation)</li>
              <li>You have pending disputes or chargebacks</li>
              <li>KYC verification is required and not completed</li>
            </ul>
          </section>

          <section>
            <h2>5. Earned Coins</h2>
            <p>Coins earned through platform activities (publishing content, replies, reviews) are subject to:</p>
            <ul>
              <li>Anti-abuse policies and verification</li>
              <li>Earning limits and caps</li>
              <li>Quality requirements</li>
            </ul>
            <p>If content is removed for policy violations, associated coin earnings may be revoked.</p>
          </section>

          <section>
            <h2>6. Dispute Resolution Process</h2>
            <h3>For Content Disputes:</h3>
            <ol>
              <li><strong>Contact the Seller:</strong> Attempt to resolve the issue directly (within 7 days of purchase)</li>
              <li><strong>Report to YoForex:</strong> If unresolved, submit a dispute via support@yoforex.net with:
                <ul>
                  <li>Transaction ID and purchase details</li>
                  <li>Evidence of the defect (screenshots, error messages)</li>
                  <li>Communication history with seller</li>
                </ul>
              </li>
              <li><strong>Investigation:</strong> We will review your case within 5-7 business days</li>
              <li><strong>Resolution:</strong> If approved, coins will be refunded to your wallet</li>
            </ol>
            
            <h3>For Payment Disputes:</h3>
            <ol>
              <li>Contact support@yoforex.net within 48 hours</li>
              <li>Provide transaction details and payment confirmation</li>
              <li>We will investigate and respond within 3-5 business days</li>
            </ol>
          </section>

          <section>
            <h2>7. Chargebacks</h2>
            <p><strong>Warning:</strong> Initiating a chargeback with your payment provider before contacting us may result in account suspension. We will work with you to resolve legitimate issues.</p>
            <p>If you initiate a chargeback:</p>
            <ul>
              <li>Your account will be suspended pending investigation</li>
              <li>Purchased content and coins will be revoked</li>
              <li>You may be banned from the platform if fraud is detected</li>
            </ul>
          </section>

          <section>
            <h2>8. Exceptions and Special Cases</h2>
            <p>YoForex reserves the right to issue refunds at its discretion in exceptional circumstances. Each case is evaluated individually.</p>
          </section>

          <section>
            <h2>9. Changes to This Policy</h2>
            <p>We may update this Refund Policy at any time. Continued use of the platform after changes constitutes acceptance of the updated policy.</p>
          </section>

          <section>
            <h2>10. Contact for Refund Requests</h2>
            <p>For refund requests or payment issues, contact:</p>
            <ul>
              <li><strong>Email:</strong> support@yoforex.net</li>
              <li><strong>Subject:</strong> Refund Request - [Transaction ID]</li>
              <li><strong>Response Time:</strong> 3-5 business days</li>
            </ul>
            <p>Include all relevant details: transaction ID, reason for refund, supporting evidence.</p>
          </section>
        </div>
      </main>
      <EnhancedFooter />
    </div>
  );
}
