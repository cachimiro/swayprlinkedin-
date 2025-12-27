/**
 * Apply Event-Sourced Migration to Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('Applying event-sourced migration...\n');

  const migrationPath = path.join(__dirname, '../supabase/migrations/004_event_sourced_model.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  // Split by statement (rough split on semicolons outside of function bodies)
  const statements = sql
    .split(/;\s*\n/)
    .filter(s => s.trim() && !s.trim().startsWith('--'))
    .map(s => s.trim() + ';');

  console.log(`Found ${statements.length} SQL statements to execute\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    // Skip comments and empty statements
    if (!statement || statement === ';' || statement.startsWith('--')) {
      continue;
    }

    // Get first line for logging
    const firstLine = statement.split('\n')[0].substring(0, 80);
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        // Check if error is "already exists" - that's OK
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate')) {
          console.log(`⚠️  [${i + 1}/${statements.length}] Already exists: ${firstLine}...`);
          successCount++;
        } else {
          console.error(`✗ [${i + 1}/${statements.length}] Error: ${firstLine}...`);
          console.error(`   ${error.message}\n`);
          errorCount++;
        }
      } else {
        console.log(`✓ [${i + 1}/${statements.length}] ${firstLine}...`);
        successCount++;
      }
    } catch (err) {
      console.error(`✗ [${i + 1}/${statements.length}] Exception: ${firstLine}...`);
      console.error(`   ${err.message}\n`);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('Migration Summary');
  console.log('='.repeat(60));
  console.log(`Total statements: ${statements.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  
  if (errorCount === 0) {
    console.log('\n✓ Migration completed successfully!');
    return true;
  } else {
    console.log('\n⚠️  Migration completed with errors');
    return false;
  }
}

// Alternative: Use Supabase SQL editor approach
async function applyMigrationDirect() {
  console.log('Applying migration via direct SQL execution...\n');

  const migrationPath = path.join(__dirname, '../supabase/migrations/004_event_sourced_model.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  try {
    // Try to execute the entire migration as one block
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Migration error:', error);
      return false;
    }
    
    console.log('✓ Migration applied successfully!');
    return true;
  } catch (err) {
    console.error('Migration exception:', err);
    return false;
  }
}

// Check if tables exist
async function checkMigrationStatus() {
  console.log('Checking migration status...\n');

  try {
    // Check if outreach_events table exists
    const { data, error } = await supabase
      .from('outreach_events')
      .select('id')
      .limit(1);

    if (error) {
      if (error.message.includes('does not exist')) {
        console.log('✗ outreach_events table does not exist');
        console.log('   Migration needs to be applied\n');
        return false;
      }
      console.error('Error checking table:', error);
      return false;
    }

    console.log('✓ outreach_events table exists');
    console.log('   Migration already applied\n');
    return true;
  } catch (err) {
    console.error('Exception checking migration:', err);
    return false;
  }
}

async function main() {
  const migrationExists = await checkMigrationStatus();
  
  if (migrationExists) {
    console.log('Migration already applied. Skipping.\n');
    return;
  }

  console.log('Migration not found. Applying...\n');
  console.log('⚠️  Note: This script requires the exec_sql RPC function.');
  console.log('   If it fails, please apply the migration manually via Supabase Dashboard.\n');
  console.log('Steps to apply manually:');
  console.log('1. Go to https://supabase.com/dashboard');
  console.log('2. Select your project');
  console.log('3. Click SQL Editor');
  console.log('4. Click New Query');
  console.log('5. Copy/paste: supabase/migrations/004_event_sourced_model.sql');
  console.log('6. Click Run\n');
  console.log('='.repeat(60) + '\n');

  // For now, just show instructions
  console.log('Please apply the migration manually using the steps above.');
  console.log('\nMigration file: supabase/migrations/004_event_sourced_model.sql\n');
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
