import { db } from "../server/db.js";
import { users } from "../shared/schema.js";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

const ADMIN_ACCOUNTS = [
  {
    email: "anjan.nayak1968@gmail.com",
    password: "Arijit@101",
    username: "Arijit",
    role: "admin" as const,
  },
  {
    email: "firkydost@gmail.com",
    password: "Abhishek@101",
    username: "Abhishek",
    role: "admin" as const,
  },
  {
    email: "ardhenduseal1990@gmail.com",
    password: "Ardhendu@101",
    username: "Ardhendu",
    role: "admin" as const,
  },
  {
    email: "sarvanubanerjee@gmail.com",
    password: "Sarvanu@101",
    username: "Sarvanu",
    role: "admin" as const,
  },
];

async function seedAdmins() {
  console.log("🌱 Seeding admin accounts...");

  for (const admin of ADMIN_ACCOUNTS) {
    try {
      // Check if user already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, admin.email))
        .limit(1);

      if (existingUser.length > 0) {
        console.log(`⚠️  Admin ${admin.email} already exists, updating...`);
        
        // Update existing user
        const passwordHash = await bcrypt.hash(admin.password, 12);
        await db
          .update(users)
          .set({
            password_hash: passwordHash,
            auth_provider: "email",
            role: admin.role,
            is_email_verified: true,
            updatedAt: new Date(),
          })
          .where(eq(users.email, admin.email));
        
        console.log(`✅ Updated admin: ${admin.email}`);
      } else {
        // Create new admin user
        const passwordHash = await bcrypt.hash(admin.password, 12);
        await db.insert(users).values({
          email: admin.email,
          username: admin.username,
          password_hash: passwordHash,
          auth_provider: "email",
          role: admin.role,
          is_email_verified: true,
          status: "active",
          totalCoins: 0,
          weeklyEarned: 0,
          reputationScore: 0,
          level: 0,
          emailNotifications: true,
          isVerifiedTrader: false,
          hasYoutubeReward: false,
          hasMyfxbookReward: false,
          hasInvestorReward: false,
          emailBounceCount: 0,
          onboardingCompleted: true,
          onboardingDismissed: true,
        });
        
        console.log(`✅ Created admin: ${admin.email}`);
      }
    } catch (error) {
      console.error(`❌ Error processing admin ${admin.email}:`, error);
    }
  }

  console.log("🎉 Admin seeding complete!");
  process.exit(0);
}

seedAdmins().catch((error) => {
  console.error("Fatal error during seeding:", error);
  process.exit(1);
});
