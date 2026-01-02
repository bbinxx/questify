#!/usr/bin/env node
/**
 * Script to reset Supabase database schema
 * This provides instructions for resetting via dashboard or CLI
 */

const fs = require('fs');
const path = require('path');

const SQL_FILE = path.join(__dirname, '..', 'supabase_setup.sql');
const RESET_FILE = path.join(__dirname, '..', 'reset_schema.sql');

console.log('🔄 Database Schema Reset\n');

// Read the SQL files
if (!fs.existsSync(SQL_FILE)) {
    console.error(`❌ SQL file not found: ${SQL_FILE}`);
    process.exit(1);
}

console.log('📋 To reset your Supabase database schema:\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('METHOD 1: Supabase Dashboard (Recommended - Fastest)\n');
console.log('1. Open: https://app.supabase.com');
console.log('2. Select your project');
console.log('3. Go to SQL Editor');
console.log('4. Paste and run contents of: reset_schema.sql');
console.log('5. Then paste and run: supabase_setup.sql\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('METHOD 2: Supabase CLI (Requires project link)\n');
console.log('First-time setup:');
console.log('  supabase login');
console.log('  supabase link --project-ref <your-project-ref>\n');
console.log('Then run:');
console.log('  supabase db push --file reset_schema.sql');
console.log('  supabase db push --file supabase_setup.sql\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('⚠️  WARNING: This will DELETE ALL DATA in your database!\n');
console.log('✨ After reset, your schema will be ready to use.\n');

// Show file paths
console.log('📄 Files to use:');
console.log(`   ${RESET_FILE}`);
console.log(`   ${SQL_FILE}\n`);
