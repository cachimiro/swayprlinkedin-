const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ipdeablmyrfzogkjtbms.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwZGVhYmxteXJmem9na2p0Ym1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjMxOTg4MCwiZXhwIjoyMDU3ODk1ODgwfQ.UY4vWSDFZPdzG6xs9-z_O3nlvzox0lCCB4MRMOS7m80'
);

async function checkCampaign() {
  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select('*');
  
  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Campaigns in database:');
  console.log(JSON.stringify(campaigns, null, 2));
}

checkCampaign().then(() => process.exit(0));
