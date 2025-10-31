import { storage } from "../server/storage";

async function main() {
  console.log("Starting wallet backfill migration...");
  
  try {
    const result = await storage.backfillOpeningBalances();
    console.log(`✅ Migration complete!`);
    console.log(`   Created: ${result.created} wallets`);
    console.log(`   Skipped: ${result.skipped} existing wallets`);
    process.exit(0);
  } catch (error: any) {
    console.error(`❌ Migration failed: ${error.message}`);
    process.exit(1);
  }
}

main();
