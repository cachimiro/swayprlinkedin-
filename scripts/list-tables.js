const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ipdeablmyrfzogkjtbms.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwZGVhYmxteXJmem9na2p0Ym1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjMxOTg4MCwiZXhwIjoyMDU3ODk1ODgwfQ.UY4vWSDFZPdzG6xs9-z_O3nlvzox0lCCB4MRMOS7m80'
);

async function listTables() {
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `
  });

  if (error) {
    console.log('Trying alternative method...');
    // Try listing by attempting to query common tables
    const tables = ['profiles', 'workspaces', 'leads', 'campaigns', 'companies', 
                    'sequences', 'outbound_messages', 'inbound_events', 'suppression_list',
                    'workspace_members', 'campaign_enrollments', 'users', 'contacts', 
                    'messages', 'tasks', 'settings'];
    
    console.log('\nTables found:');
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (!error) {
          console.log(`  ✅ ${table}`);
        }
      } catch (e) {}
    }
  } else {
    console.log('Tables:', data);
  }
}

listTables().then(() => process.exit(0));
