#!/usr/bin/env node
/**
 * YoForex Auto-Setup Script (Node.js version)
 * Automatically detects and fixes migration issues on Replit import
 * Can run as postinstall hook or standalone
 */

import { exec, execSync } from 'child_process';
import { existsSync, writeFileSync, readFileSync } from 'fs';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Configuration
const SETUP_MARKER = '.setup-complete';
const SETUP_LOG = '.setup.log';
const VERBOSE = process.env.VERBOSE === '1' || process.argv.includes('--verbose');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = colors.reset) {
  if (VERBOSE) {
    console.log(`${color}${message}${colors.reset}`);
  }
  // Always log to file
  try {
    const timestamp = new Date().toISOString();
    writeFileSync(SETUP_LOG, `[${timestamp}] ${message}\n`, { flag: 'a' });
  } catch (e) {
    // Ignore write errors
  }
}

function execCommand(command, options = {}) {
  if (VERBOSE) {
    return execAsync(command, options);
  }
  // Silent execution
  return execAsync(command, { ...options, stdio: 'ignore' });
}

async function isDatabaseEmpty() {
  if (!process.env.DATABASE_URL) {
    return true;
  }

  try {
    const { stdout } = await execAsync(
      `psql "${process.env.DATABASE_URL}" -t -c "SELECT COUNT(*) FROM categories;"`,
      { stdio: 'pipe' }
    );
    const count = parseInt(stdout.trim(), 10);
    return count === 0;
  } catch (error) {
    // Table doesn't exist or other error = empty
    return true;
  }
}

function isFreshImport() {
  // If setup marker exists, not fresh
  if (existsSync(SETUP_MARKER)) {
    return false;
  }

  // If node_modules doesn't exist, definitely fresh
  if (!existsSync('node_modules')) {
    return true;
  }

  // Will check database in async function
  return true; // Assume fresh until proven otherwise
}

async function runSetup() {
  log('🔍 YoForex Auto-Setup: Checking environment...', colors.blue);

  // Check if this is a fresh import
  if (!isFreshImport()) {
    log('✅ Setup already complete, skipping...', colors.green);
    return;
  }

  // Check if database is empty
  const dbEmpty = await isDatabaseEmpty();
  if (!dbEmpty && existsSync(SETUP_MARKER)) {
    log('✅ Database has data, skipping setup...', colors.green);
    return;
  }

  // Fresh import detected - run full setup
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  🎯 YoForex Auto-Setup Detected Fresh GitHub Import   ║');
  console.log('║     Setting up your project automatically...           ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');

  try {
    // Step 1: Check database
    if (!process.env.DATABASE_URL) {
      console.log(`${colors.red}⚠️  No database found!${colors.reset}`);
      console.log(`${colors.yellow}Waiting for Replit to create one...${colors.reset}`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Step 2: Install dependencies (usually already done by npm install)
    if (!existsSync('node_modules')) {
      console.log(`${colors.blue}📦 Installing dependencies...${colors.reset}`);
      execSync('npm install --quiet', { stdio: 'inherit' });
      console.log(`${colors.green}✅ Dependencies installed${colors.reset}`);
    }

    // Step 3: Set up database schema
    console.log(`${colors.blue}🗄️  Setting up database...${colors.reset}`);

    try {
      execSync('npm run db:push -- --force', { stdio: 'ignore' });
    } catch (error) {
      console.log(`${colors.yellow}⚠️  Retrying database setup...${colors.reset}`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      execSync('npm run db:push -- --force', { stdio: 'inherit' });
    }

    console.log(`${colors.green}✅ Database schema created${colors.reset}`);

    // Step 4: Import data
    console.log(`${colors.blue}📊 Loading data...${colors.reset}`);

    if (existsSync('database-export.sql')) {
      console.log(`${colors.yellow}   Found database export, importing...${colors.reset}`);
      try {
        execSync(`psql "${process.env.DATABASE_URL}" < database-export.sql`, {
          stdio: 'ignore',
        });
        console.log(`${colors.green}✅ Your data imported successfully${colors.reset}`);
      } catch (error) {
        console.log(`${colors.yellow}⚠️  Import failed, using sample data instead${colors.reset}`);
        execSync('npm run db:seed', { stdio: 'ignore' });
        console.log(`${colors.green}✅ Sample data loaded${colors.reset}`);
      }
    } else {
      console.log(`${colors.yellow}   No export found, using sample data${colors.reset}`);
      execSync('npm run db:seed', { stdio: 'ignore' });
      console.log(`${colors.green}✅ Sample data loaded${colors.reset}`);
    }

    // Step 5: Verify
    try {
      const { stdout: catCount } = await execAsync(
        `psql "${process.env.DATABASE_URL}" -t -c "SELECT COUNT(*) FROM categories;"`
      );
      const { stdout: threadCount } = await execAsync(
        `psql "${process.env.DATABASE_URL}" -t -c "SELECT COUNT(*) FROM \\"forumThreads\\";"`
      );

      const categories = parseInt(catCount.trim(), 10);
      const threads = parseInt(threadCount.trim(), 10);

      console.log('');
      console.log('📊 Setup Complete! Database has:');
      console.log(`   • ${categories} categories`);
      console.log(`   • ${threads} discussion threads`);
      console.log('');
    } catch (error) {
      // Ignore verification errors
    }

    // Step 6: Mark setup as complete
    const timestamp = new Date().toISOString();
    writeFileSync(SETUP_MARKER, `Auto-setup completed at: ${timestamp}\n`);

    console.log(`${colors.green}╔════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.green}║  ✅ YoForex is Ready!                                 ║${colors.reset}`);
    console.log(`${colors.green}║     Your application will start automatically...       ║${colors.reset}`);
    console.log(`${colors.green}╚════════════════════════════════════════════════════════╝${colors.reset}`);
    console.log('');
    console.log('Next time this Replit starts, auto-setup will be skipped.');
    console.log('');

    log('Auto-setup completed successfully', colors.green);
  } catch (error) {
    console.error(`${colors.red}❌ Auto-setup failed:${colors.reset}`, error.message);
    log(`Auto-setup failed: ${error.message}`, colors.red);
    
    // Don't throw - allow app to start even if setup fails
    console.log(`${colors.yellow}⚠️  Continuing anyway... You may need to run: npm run db:seed${colors.reset}`);
  }
}

// Run if executed directly (not as module)
if (import.meta.url === `file://${process.argv[1]}`) {
  runSetup()
    .then(() => {
      log('Auto-setup script finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { runSetup, isFreshImport, isDatabaseEmpty };
