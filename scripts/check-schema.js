const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ipdeablmyrfzogkjtbms.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwZGVhYmxteXJmem9na2p0Ym1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjMxOTg4MCwiZXhwIjoyMDU3ODk1ODgwfQ.UY4vWSDFZPdzG6xs9-z_O3nlvzox0lCCB4MRMOS7m80'
);

async function checkSchema() {
  console.log('Checking table schemas...\n');

  // Check profiles structure
  const { data: profiles } = await supabase.from('profiles').select('*').limit(0);
  console.log('profiles columns:', profiles ? Object.keys(profiles[0] || {}) : 'No data');

  // Check workspaces structure  
  const { data: workspaces } = await supabase.from('workspaces').select('*').limit(0);
  console.log('workspaces columns:', workspaces ? Object.keys(workspaces[0] || {}) : 'No data');

  // Check leads structure
  const { data: leads } = await supabase.from('leads').select('*').limit(0);
  console.log('leads columns:', leads ? Object.keys(leads[0] || {}) : 'No data');

  // Check campaigns structure
  const { data: campaigns } = await supabase.from('campaigns').select('*').limit(1);
  console.log('campaigns columns:', campaigns && campaigns[0] ? Object.keys(campaigns[0]) : 'No data');
}

checkSchema().then(() => process.exit(0));
