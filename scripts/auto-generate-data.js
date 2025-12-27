/**
 * Auto-generate test data
 * Finds the first workspace and generates test events
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ipdeablmyrfzogkjtbms.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwZGVhYmxteXJmem9na2p0Ym1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjMxOTg4MCwiZXhwIjoyMDU3ODk1ODgwfQ.UY4vWSDFZPdzG6xs9-z_O3nlvzox0lCCB4MRMOS7m80';

const supabase = createClient(supabaseUrl, supabaseKey);

function randomDate(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(Math.floor(Math.random() * 24));
  date.setMinutes(Math.floor(Math.random() * 60));
  return date.toISOString();
}

async function main() {
  console.log('🔍 Finding workspace...\n');

  // Get first workspace
  const { data: workspaces, error: wsError } = await supabase
    .from('workspaces')
    .select('id, name, owner_id')
    .limit(1);

  if (wsError || !workspaces || workspaces.length === 0) {
    console.error('❌ No workspace found. Please sign up first.');
    console.log('\nGo to: https://3000--019b3d42-f855-7b98-a2df-9df8f79c0c22.eu-central-1-01.gitpod.dev/auth/signup\n');
    process.exit(1);
  }

  const workspace = workspaces[0];
  console.log(`✓ Found workspace: ${workspace.name}`);
  console.log(`  ID: ${workspace.id}\n`);

  // Get or create campaign
  let { data: campaign } = await supabase
    .from('campaigns')
    .select('id, name')
    .eq('workspace_id', workspace.id)
    .limit(1)
    .single();

  if (!campaign) {
    console.log('📝 Creating test campaign...');
    const { data: newCampaign } = await supabase
      .from('campaigns')
      .insert({
        workspace_id: workspace.id,
        name: 'Test Campaign',
        channel: 'email_only',
        is_active: true,
        daily_send_limit: 120,
      })
      .select('id, name')
      .single();
    campaign = newCampaign;
    console.log(`✓ Created campaign: ${campaign.name}\n`);
  } else {
    console.log(`✓ Using existing campaign: ${campaign.name}\n`);
  }

  // Get or create leads
  let { data: leads } = await supabase
    .from('leads')
    .select('id')
    .eq('workspace_id', workspace.id)
    .limit(20);

  if (!leads || leads.length === 0) {
    console.log('👥 Creating test leads...');
    const testLeads = Array.from({ length: 20 }, (_, i) => ({
      workspace_id: workspace.id,
      full_name: `Test Lead ${i + 1}`,
      first_name: `Test${i + 1}`,
      last_name: `Lead`,
      email: `test${i + 1}@example.com`,
      status: 'new',
    }));

    const { data: newLeads } = await supabase
      .from('leads')
      .insert(testLeads)
      .select('id');

    leads = newLeads || [];
    console.log(`✓ Created ${leads.length} leads\n`);
  } else {
    console.log(`✓ Using ${leads.length} existing leads\n`);
  }

  const leadIds = leads.map(l => l.id);

  console.log('🎲 Generating events...\n');

  const events = [];

  // Generate events for last 7 days
  for (let day = 0; day < 7; day++) {
    const messagesPerDay = Math.floor(Math.random() * 20) + 10;

    for (let i = 0; i < messagesPerDay; i++) {
      const leadId = leadIds[Math.floor(Math.random() * leadIds.length)];
      const timestamp = randomDate(day);

      // Message sent
      events.push({
        workspace_id: workspace.id,
        campaign_id: campaign.id,
        lead_id: leadId,
        event_type: 'message_sent',
        event_timestamp: timestamp,
        metadata: { subject: `Test message ${i}` },
      });

      // 15% chance of reply
      if (Math.random() < 0.15) {
        const replyTime = new Date(timestamp);
        replyTime.setHours(replyTime.getHours() + Math.floor(Math.random() * 24));

        events.push({
          workspace_id: workspace.id,
          campaign_id: campaign.id,
          lead_id: leadId,
          event_type: 'reply_received',
          event_timestamp: replyTime.toISOString(),
          metadata: { body: 'Thanks for reaching out!' },
        });

        // 50% chance reply is classified
        if (Math.random() < 0.5) {
          const classifyTime = new Date(replyTime);
          classifyTime.setMinutes(classifyTime.getMinutes() + 30);

          events.push({
            workspace_id: workspace.id,
            campaign_id: campaign.id,
            lead_id: leadId,
            event_type: 'reply_classified',
            event_timestamp: classifyTime.toISOString(),
            metadata: { classification: 'interested' },
          });
        }
      }
    }
  }

  // Add today's messages
  const todayMessages = Math.floor(Math.random() * 40) + 20;
  console.log(`  📧 Adding ${todayMessages} messages for today...`);
  
  for (let i = 0; i < todayMessages; i++) {
    const leadId = leadIds[Math.floor(Math.random() * leadIds.length)];
    const now = new Date();
    now.setHours(Math.floor(Math.random() * 12) + 8); // 8am-8pm

    events.push({
      workspace_id: workspace.id,
      campaign_id: campaign.id,
      lead_id: leadId,
      event_type: 'message_sent',
      event_timestamp: now.toISOString(),
      metadata: { subject: `Today's message ${i}` },
    });
  }

  // Add a few unclassified replies
  console.log(`  💬 Adding 3 unclassified replies...`);
  for (let i = 0; i < 3; i++) {
    const leadId = leadIds[Math.floor(Math.random() * leadIds.length)];
    events.push({
      workspace_id: workspace.id,
      campaign_id: campaign.id,
      lead_id: leadId,
      event_type: 'reply_received',
      event_timestamp: randomDate(Math.floor(Math.random() * 3)),
      metadata: { body: 'Unclassified reply' },
    });
  }

  console.log(`\n📊 Inserting ${events.length} events...`);

  const { error } = await supabase.from('outreach_events').insert(events);

  if (error) {
    console.error('❌ Error inserting events:', error);
    process.exit(1);
  }

  console.log('✓ Events inserted successfully!\n');
  console.log('=' .repeat(60));
  console.log('🎉 Test Data Generated!');
  console.log('=' .repeat(60));
  console.log(`\n📈 Expected Dashboard Metrics:`);
  console.log(`  • Today's Sends: ~${todayMessages}`);
  console.log(`  • Replies Requiring Action: ~3`);
  console.log(`  • 7-Day Reply Rate: ~15%`);
  console.log(`  • System Status: Healthy\n`);
  console.log('🌐 Visit Dashboard:');
  console.log('https://3000--019b3d42-f855-7b98-a2df-9df8f79c0c22.eu-central-1-01.gitpod.dev/dashboard\n');
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
