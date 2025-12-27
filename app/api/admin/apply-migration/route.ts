import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

/**
 * Apply Event-Sourced Migration
 * 
 * GET /api/admin/apply-migration
 * 
 * This endpoint applies the event-sourced migration to the database.
 * Only use this once to set up the event model.
 */
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Read migration file
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/004_event_sourced_model.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Check if already applied
    const { error: checkError } = await supabase
      .from('outreach_events')
      .select('id')
      .limit(1);

    if (!checkError) {
      return NextResponse.json({
        success: true,
        message: 'Migration already applied',
        alreadyApplied: true,
      });
    }

    // Split SQL into individual statements
    // This is a simple split - for production, use a proper SQL parser
    const statements = sql
      .split(/;\s*\n/)
      .filter(s => {
        const trimmed = s.trim();
        return trimmed && 
               !trimmed.startsWith('--') && 
               trimmed !== ';' &&
               !trimmed.startsWith('COMMENT ON');
      })
      .map(s => s.trim() + ';');

    console.log(`Applying ${statements.length} SQL statements...`);

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement.substring(0, 100).replace(/\s+/g, ' ');

      try {
        // Execute via raw SQL
        const { error } = await supabase.rpc('exec_sql', { sql: statement });

        if (error) {
          // Check if it's an "already exists" error
          if (error.message?.includes('already exists') || 
              error.message?.includes('duplicate')) {
            results.push({ statement: preview, status: 'skipped', message: 'Already exists' });
            successCount++;
          } else {
            results.push({ statement: preview, status: 'error', message: error.message });
            errorCount++;
            console.error(`Error in statement ${i + 1}:`, error);
          }
        } else {
          results.push({ statement: preview, status: 'success' });
          successCount++;
        }
      } catch (err: any) {
        results.push({ statement: preview, status: 'error', message: err.message });
        errorCount++;
        console.error(`Exception in statement ${i + 1}:`, err);
      }
    }

    return NextResponse.json({
      success: errorCount === 0,
      message: errorCount === 0 
        ? 'Migration applied successfully' 
        : `Migration completed with ${errorCount} errors`,
      stats: {
        total: statements.length,
        successful: successCount,
        errors: errorCount,
      },
      results: results.slice(0, 20), // Return first 20 results
    });

  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        instructions: [
          'Please apply the migration manually:',
          '1. Go to https://supabase.com/dashboard',
          '2. Select your project',
          '3. Click SQL Editor',
          '4. Click New Query',
          '5. Copy/paste: supabase/migrations/004_event_sourced_model.sql',
          '6. Click Run',
        ]
      },
      { status: 500 }
    );
  }
}
