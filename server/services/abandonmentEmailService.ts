import { db } from '../db.js';
import { abandonmentEmails, users } from '../../shared/schema.js';
import { eq, and, lt } from 'drizzle-orm';
import { emailService } from './emailService.js';

export async function scheduleAbandonmentEmails(userId: string) {
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user[0] || !user[0].email) return;

  const now = new Date();
  
  // Schedule day 2 email
  const day2 = new Date(now);
  day2.setDate(day2.getDate() + 2);
  
  await db.insert(abandonmentEmails).values({
    userId,
    emailType: 'day_2',
    scheduledFor: day2,
    status: 'pending'
  });

  // Schedule day 5 email
  const day5 = new Date(now);
  day5.setDate(day5.getDate() + 5);
  
  await db.insert(abandonmentEmails).values({
    userId,
    emailType: 'day_5',
    scheduledFor: day5,
    status: 'pending'
  });

  // Schedule day 10 email
  const day10 = new Date(now);
  day10.setDate(day10.getDate() + 10);
  
  await db.insert(abandonmentEmails).values({
    userId,
    emailType: 'day_10',
    scheduledFor: day10,
    status: 'pending'
  });
}

export async function sendScheduledAbandonmentEmails() {
  const now = new Date();
  
  // Get pending emails that are due
  const dueEmails = await db.select()
    .from(abandonmentEmails)
    .where(
      and(
        eq(abandonmentEmails.status, 'pending'),
        lt(abandonmentEmails.scheduledFor, now)
      )
    );

  for (const email of dueEmails) {
    try {
      const user = await db.select().from(users).where(eq(users.id, email.userId)).limit(1);
      if (!user[0] || !user[0].email) continue;

      // Check if user is still inactive
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      if (user[0].lastActive && user[0].lastActive > sevenDaysAgo) {
        // User is active, cancel remaining emails
        await db.update(abandonmentEmails)
          .set({ status: 'cancelled' })
          .where(eq(abandonmentEmails.userId, email.userId));
        continue;
      }

      // Send appropriate email
      const subject = email.emailType === 'day_2' 
        ? "We miss you at YoForex! 🎯"
        : email.emailType === 'day_5'
        ? "Your vault coins are waiting! 💰"
        : "Last chance: Exclusive offer inside! 🚀";

      const content = email.emailType === 'day_2'
        ? "It's been a couple of days since your last visit. The community has been asking about you..."
        : email.emailType === 'day_5'
        ? "You have unlocked vault coins waiting to be claimed! Don't let them slip away..."
        : "This is our final reminder. Come back and claim your 50 bonus coins!";

      await emailService.sendAbandonmentEmail(user[0].email, subject, content);

      await db.update(abandonmentEmails)
        .set({ status: 'sent', sentAt: new Date() })
        .where(eq(abandonmentEmails.id, email.id));

    } catch (error) {
      console.error(`Error sending abandonment email ${email.id}:`, error);
      await db.update(abandonmentEmails)
        .set({ 
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        })
        .where(eq(abandonmentEmails.id, email.id));
    }
  }
}
