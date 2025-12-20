const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ipdeablmyrfzogkjtbms.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwZGVhYmxteXJmem9na2p0Ym1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjMxOTg4MCwiZXhwIjoyMDU3ODk1ODgwfQ.UY4vWSDFZPdzG6xs9-z_O3nlvzox0lCCB4MRMOS7m80'
);

async function checkDatabase() {
  console.log('Checking Supabase database...\n');

  // Check for existing tables
  const tables = [
    'profiles',
    'workspaces',
    'workspace_members',
    'companies',
    'leads',
    'campaigns',
    'sequences',
    'campaign_enrollments',
    'outbound_messages',
    'inbound_events',
    'suppression_list'
  ];

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ Table '${table}': Does not exist or no access`);
      } else {
        console.log(`✅ Table '${table}': Exists (${count || 0} rows)`);
      }
    } catch (err) {
      console.log(`❌ Table '${table}': Error - ${err.message}`);
    }
  }

  // Check for any data in profiles
  console.log('\n--- Checking for existing data ---\n');
  
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);
    
    if (!error && profiles && profiles.length > 0) {
      console.log(`Found ${profiles.length} profiles:`);
      profiles.forEach(p => console.log(`  - ${p.full_name || p.id}`));
    } else {
      console.log('No profiles found');
    }
  } catch (err) {
    console.log('Could not check profiles');
  }

  // Check workspaces
  try {
    const { data: workspaces, error } = await supabase
      .from('workspaces')
      .select('*')
      .limit(5);
    
    if (!error && workspaces && workspaces.length > 0) {
      console.log(`\nFound ${workspaces.length} workspaces:`);
      workspaces.forEach(w => console.log(`  - ${w.name} (${w.id})`));
    } else {
      console.log('\nNo workspaces found');
    }
  } catch (err) {
    console.log('Could not check workspaces');
  }

  // Check leads
  try {
    const { data: leads, error, count } = await supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .limit(5);
    
    if (!error && leads) {
      console.log(`\nFound ${count || 0} leads total`);
      if (leads.length > 0) {
        console.log('Sample leads:');
        leads.forEach(l => console.log(`  - ${l.full_name} (${l.email || 'no email'})`));
      }
    } else {
      console.log('\nNo leads found');
    }
  } catch (err) {
    console.log('Could not check leads');
  }
}

checkDatabase().then(() => {
  console.log('\n✅ Database check complete');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
