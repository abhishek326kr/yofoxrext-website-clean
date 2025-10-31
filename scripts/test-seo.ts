import { generateSlug, generateFocusKeyword, generateMetaDescription, generateImageAltTexts } from '../server/seo';

async function test() {
  console.log('Testing SEO utilities...\n');

  // Test slug generation
  const slug = await generateSlug('Gold Hedger EA - Best MT4 Expert Advisor', 'content');
  console.log('Slug:', slug);

  // Test focus keyword
  const keyword = generateFocusKeyword('Advanced Scalping Strategy for EUR/USD');
  console.log('Focus Keyword:', keyword);

  // Test meta description
  const meta = generateMetaDescription('This is an advanced scalping strategy designed for EUR/USD trading pairs. It uses a combination of moving averages and RSI indicators to identify high-probability entry points. The strategy has been backtested on 5 years of historical data.');
  console.log('Meta Description:', meta);

  // Test image alt texts
  const alts = generateImageAltTexts('Forex Robot Pro', 3);
  console.log('Image Alt Texts:', alts);
}

test();
