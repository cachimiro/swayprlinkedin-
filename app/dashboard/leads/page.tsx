"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ImportWizard } from "@/components/leads/import-wizard";
import { Plus, Search, Filter, Download, Tag, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface Contact {
  id: string;
  full_name: string;
  headline: string;
  company_name: string;
  industry: string;
  location: string;
  profile_url: string;
  tags: string[] | null;
  created_at: string;
}

export default function LeadsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [showImport, setShowImport] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    loadUserAndContacts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUserAndContacts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/signin");
        return;
      }

      setUserId(user.id);
      await loadContacts(user.id);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const loadContacts = async (uid: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error("Error loading contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedContacts.size === filteredContacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(filteredContacts.map((c) => c.id)));
    }
  };

  const handleSelectContact = (contactId: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContacts(newSelected);
  };

  const handleBulkDelete = async () => {
    if (!userId || selectedContacts.size === 0) return;
    
    if (!confirm(`Delete ${selectedContacts.size} contacts?`)) return;

    try {
      const { error } = await supabase
        .from("contacts")
        .delete()
        .in("id", Array.from(selectedContacts));

      if (error) throw error;

      await loadContacts(userId);
      setSelectedContacts(new Set());
    } catch (error) {
      console.error("Error deleting contacts:", error);
    }
  };

  const filteredContacts = contacts.filter((contact) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      contact.full_name?.toLowerCase().includes(query) ||
      contact.headline?.toLowerCase().includes(query) ||
      contact.company_name?.toLowerCase().includes(query) ||
      contact.industry?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground">
            Manage your LinkedIn connections
          </p>
        </div>
        <Dialog open={showImport} onOpenChange={setShowImport}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Import Contacts
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            {userId && (
              <ImportWizard
                workspaceId={userId}
                onComplete={() => {
                  setShowImport(false);
                  loadContacts(userId);
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search contacts by name, headline, company, or industry..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>

        {selectedContacts.size > 0 && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-muted rounded-md">
            <span className="text-sm font-medium">
              {selectedContacts.size} selected
            </span>
            <Button variant="outline" size="sm">
              <Tag className="mr-2 h-3 w-3" />
              Add Tag
            </Button>
            <Button variant="outline" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="mr-2 h-3 w-3" />
              Delete
            </Button>
          </div>
        )}
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="p-4 text-left">
                  <Checkbox
                    checked={selectedContacts.size === filteredContacts.length && filteredContacts.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th className="p-4 text-left text-sm font-medium">Name</th>
                <th className="p-4 text-left text-sm font-medium">Headline</th>
                <th className="p-4 text-left text-sm font-medium">Company</th>
                <th className="p-4 text-left text-sm font-medium">Industry</th>
                <th className="p-4 text-left text-sm font-medium">Location</th>
                <th className="p-4 text-left text-sm font-medium">Tags</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Loading contacts...
                  </td>
                </tr>
              ) : filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center">
                    <div className="space-y-2">
                      <p className="text-muted-foreground">No contacts found</p>
                      <Button onClick={() => setShowImport(true)}>
                        Import your first contacts
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact) => (
                  <tr key={contact.id} className="border-b hover:bg-muted/50">
                    <td className="p-4">
                      <Checkbox
                        checked={selectedContacts.has(contact.id)}
                        onCheckedChange={() => handleSelectContact(contact.id)}
                      />
                    </td>
                    <td className="p-4">
                      <div className="font-medium">{contact.full_name}</div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {contact.headline || "-"}
                    </td>
                    <td className="p-4 text-sm">{contact.company_name || "-"}</td>
                    <td className="p-4 text-sm">{contact.industry || "-"}</td>
                    <td className="p-4 text-sm">{contact.location || "-"}</td>
                    <td className="p-4">
                      {contact.tags && contact.tags.length > 0 ? (
                        <div className="flex gap-1">
                          {contact.tags.slice(0, 2).map((tag, i) => (
                            <span key={i} className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-secondary text-secondary-foreground">
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
