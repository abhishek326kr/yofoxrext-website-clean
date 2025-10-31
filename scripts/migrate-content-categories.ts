import { db } from '../server/db';
import { seoCategoryStorage } from '../server/storage/domains/seoCategories';

async function migrateContentCategories() {
  console.log('Starting content category migration...');
  
  try {
    // Run the migration
    const result = await seoCategoryStorage.migrateContentCategories();
    
    console.log(`Migration completed:`);
    console.log(`- Successfully migrated: ${result.migrated} content items`);
    console.log(`- Failed to migrate: ${result.failed} content items`);
    
    if (result.failed > 0) {
      console.log('Some items failed to migrate. Check the logs above for details.');
    }
    
    return result;
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run the migration
migrateContentCategories()
  .then(result => {
    console.log('Migration finished successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Migration failed with error:', error);
    process.exit(1);
  });

export default migrateContentCategories;