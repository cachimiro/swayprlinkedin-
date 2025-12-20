const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ipdeablmyrfzogkjtbms.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwZGVhYmxteXJmem9na2p0Ym1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjMxOTg4MCwiZXhwIjoyMDU3ODk1ODgwfQ.UY4vWSDFZPdzG6xs9-z_O3nlvzox0lCCB4MRMOS7m80'
);

async function checkAllSchemas() {
  const tables = ['users', 'contacts', 'messages', 'tasks', 'settings', 'leads', 'campaigns'];
  
  for (const table of tables) {
    try {
      const { data, count } = await supabase.from(table).select('*', { count: 'exact' }).limit(1);
      console.log(`\n=== ${table.toUpperCase()} (${count || 0} rows) ===`);
      if (data && data[0]) {
        console.log('Columns:', Object.keys(data[0]).join(', '));
        console.log('Sample:', JSON.stringify(data[0], null, 2));
      } else {
        console.log('No data to show structure');
      }
    } catch (e) {
      console.log(`Error checking ${table}`);
    }
  }
}

checkAllSchemas().then(() => process.exit(0));
