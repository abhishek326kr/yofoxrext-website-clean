import { db } from '../server/db';
import { seoCategories, categoryRedirects, content } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function testCategorySystem() {
  console.log('Testing SEO Category System...\n');
  
  const tests = {
    passed: 0,
    failed: 0,
    results: [] as string[]
  };
  
  try {
    // Test 1: Check if SEO categories were created
    console.log('1. Testing SEO categories creation...');
    const categories = await db.select().from(seoCategories);
    if (categories.length > 0) {
      tests.passed++;
      tests.results.push(`✓ Created ${categories.length} SEO categories`);
      
      // List main categories
      const mainCategories = categories.filter(c => c.categoryType === 'main');
      console.log(`   Main categories: ${mainCategories.map(c => c.name).join(', ')}`);
    } else {
      tests.failed++;
      tests.results.push('✗ No SEO categories found');
    }
    
    // Test 2: Check category hierarchy
    console.log('\n2. Testing category hierarchy...');
    const forexCategory = await db
      .select()
      .from(seoCategories)
      .where(eq(seoCategories.slug, 'forex-trading'))
      .limit(1);
    
    if (forexCategory.length > 0) {
      const subcategories = await db
        .select()
        .from(seoCategories)
        .where(eq(seoCategories.parentId, forexCategory[0].id));
      
      tests.passed++;
      tests.results.push(`✓ Forex Trading has ${subcategories.length} subcategories`);
      console.log(`   Subcategories: ${subcategories.map(c => c.name).join(', ')}`);
    } else {
      tests.failed++;
      tests.results.push('✗ Forex Trading category not found');
    }
    
    // Test 3: Check URL structure
    console.log('\n3. Testing URL structure...');
    const expertAdvisors = await db
      .select()
      .from(seoCategories)
      .where(eq(seoCategories.slug, 'expert-advisors'))
      .limit(1);
    
    if (expertAdvisors.length > 0 && expertAdvisors[0].urlPath === '/forex-trading/expert-advisors/') {
      tests.passed++;
      tests.results.push('✓ URL paths are correctly formatted');
      console.log(`   Example: ${expertAdvisors[0].urlPath}`);
    } else {
      tests.failed++;
      tests.results.push('✗ URL paths are incorrect');
    }
    
    // Test 4: Check redirects
    console.log('\n4. Testing category redirects...');
    const redirects = await db.select().from(categoryRedirects);
    if (redirects.length > 0) {
      tests.passed++;
      tests.results.push(`✓ Created ${redirects.length} URL redirects`);
      
      // Show a sample redirect
      const sample = redirects[0];
      console.log(`   Example: ${sample.oldUrl} → ${sample.newUrl}`);
    } else {
      tests.failed++;
      tests.results.push('✗ No redirects found');
    }
    
    // Test 5: Check content migration
    console.log('\n5. Testing content migration...');
    const migratedContent = await db
      .select()
      .from(content)
      .limit(5);
    
    let validCategories = 0;
    for (const item of migratedContent) {
      // Check if category is a UUID (new system)
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.category);
      if (isUuid) {
        validCategories++;
      }
    }
    
    if (validCategories > 0) {
      tests.passed++;
      tests.results.push(`✓ Content items migrated to new category system (${validCategories}/${migratedContent.length} checked)`);
    } else if (migratedContent.length === 0) {
      tests.passed++;
      tests.results.push('✓ No content to migrate');
    } else {
      tests.failed++;
      tests.results.push('✗ Content not migrated to new categories');
    }
    
    // Test 6: Check SEO metadata
    console.log('\n6. Testing SEO metadata...');
    const categoriesWithMeta = categories.filter(c => c.metaTitle && c.metaDescription);
    if (categoriesWithMeta.length > 0) {
      tests.passed++;
      tests.results.push(`✓ ${categoriesWithMeta.length} categories have SEO metadata`);
    } else {
      tests.failed++;
      tests.results.push('✗ No categories have SEO metadata');
    }
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    tests.results.forEach(result => console.log(result));
    console.log('-'.repeat(60));
    console.log(`Total: ${tests.passed} passed, ${tests.failed} failed`);
    
    if (tests.failed === 0) {
      console.log('\n✅ All tests passed! Category system is working correctly.');
    } else {
      console.log('\n⚠️ Some tests failed. Please review the results above.');
    }
    
    return tests;
    
  } catch (error) {
    console.error('Test failed with error:', error);
    throw error;
  }
}

// Run tests
testCategorySystem()
  .then(results => {
    console.log('\nTest completed successfully!');
    process.exit(results.failed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });

export default testCategorySystem;