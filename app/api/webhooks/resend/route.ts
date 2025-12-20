import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const { type, data } = payload;

    // Get message by provider ID
    const { data: message } = await supabase
      .from("outbound_messages")
      .select("*, leads(email)")
      .eq("provider_message_id", data.email_id)
      .single();

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Handle different event types
    switch (type) {
      case "email.delivered":
        await supabase
          .from("outbound_messages")
          .update({ status: "delivered" })
          .eq("id", message.id);
        break;

      case "email.opened":
        await supabase
          .from("outbound_messages")
          .update({ status: "opened" })
          .eq("id", message.id);
        break;

      case "email.clicked":
        await supabase
          .from("outbound_messages")
          .update({ status: "clicked" })
          .eq("id", message.id);
        break;

      case "email.bounced":
        // Update message status
        await supabase
          .from("outbound_messages")
          .update({ status: "bounced" })
          .eq("id", message.id);

        // Update lead email status
        await supabase
          .from("leads")
          .update({ email_status: "bounced" })
          .eq("id", message.lead_id);

        // Add to suppression list
        if (message.leads?.email) {
          const { data: existing } = await supabase
            .from("suppression_list")
            .select("id")
            .eq("workspace_id", message.workspace_id)
            .eq("email", message.leads.email)
            .single();

          if (!existing) {
            await supabase
              .from("suppression_list")
              .insert({
                workspace_id: message.workspace_id,
                email: message.leads.email,
                reason: "bounced",
              });
          }
        }

        // Record event
        await supabase.from("inbound_events").insert({
          workspace_id: message.workspace_id,
          channel: "email",
          lead_id: message.lead_id,
          type: "bounce",
          payload_json: data,
        });
        break;

      case "email.complained":
        // Update message status
        await supabase
          .from("outbound_messages")
          .update({ status: "failed" })
          .eq("id", message.id);

        // Update lead status
        await supabase
          .from("leads")
          .update({ status: "do_not_contact" })
          .eq("id", message.lead_id);

        // Add to suppression list
        if (message.leads?.email) {
          const { data: existing } = await supabase
            .from("suppression_list")
            .select("id")
            .eq("workspace_id", message.workspace_id)
            .eq("email", message.leads.email)
            .single();

          if (!existing) {
            await supabase
              .from("suppression_list")
              .insert({
                workspace_id: message.workspace_id,
                email: message.leads.email,
                reason: "complaint",
              });
          }
        }

        // Record event
        await supabase.from("inbound_events").insert({
          workspace_id: message.workspace_id,
          channel: "email",
          lead_id: message.lead_id,
          type: "complaint",
          payload_json: data,
        });
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
