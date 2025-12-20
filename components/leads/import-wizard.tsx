"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import { Upload, FileText, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";

interface ImportWizardProps {
  workspaceId: string; // Actually userId in this context
  onComplete: () => void;
}

type MappingField = 
  | "full_name"
  | "headline"
  | "company_name"
  | "industry"
  | "location"
  | "profile_url"
  | "linkedin_id"
  | "ignore";

const FIELD_OPTIONS: { value: MappingField; label: string }[] = [
  { value: "ignore", label: "Ignore" },
  { value: "full_name", label: "Full Name" },
  { value: "headline", label: "Headline/Title" },
  { value: "company_name", label: "Company" },
  { value: "industry", label: "Industry" },
  { value: "location", label: "Location" },
  { value: "profile_url", label: "LinkedIn URL" },
  { value: "linkedin_id", label: "LinkedIn ID" },
];

export function ImportWizard({ workspaceId: userId, onComplete }: ImportWizardProps) {
  const [step, setStep] = useState<"upload" | "map" | "preview" | "importing">("upload");
  const [csvData, setCsvData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, MappingField>>({});
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [importStats, setImportStats] = useState({ success: 0, errors: 0 });
  const supabase = createClient();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length === 0) {
          setError("CSV file is empty");
          return;
        }

        const headers = Object.keys(results.data[0] as object);
        setHeaders(headers);
        setCsvData(results.data);

        // Auto-detect common mappings
        const autoMapping: Record<string, MappingField> = {};
        headers.forEach((header) => {
          const lower = header.toLowerCase();
          if (lower.includes("full") && lower.includes("name")) autoMapping[header] = "full_name";
          else if (lower === "name") autoMapping[header] = "full_name";
          else if (lower.includes("headline") || lower.includes("title") || lower.includes("position")) autoMapping[header] = "headline";
          else if (lower.includes("company")) autoMapping[header] = "company_name";
          else if (lower.includes("industry")) autoMapping[header] = "industry";
          else if (lower.includes("location") || lower.includes("city")) autoMapping[header] = "location";
          else if (lower.includes("linkedin") || lower.includes("profile") || lower.includes("url")) autoMapping[header] = "profile_url";
          else if (lower.includes("linkedin") && lower.includes("id")) autoMapping[header] = "linkedin_id";
          else autoMapping[header] = "ignore";
        });

        setMapping(autoMapping);
        setStep("map");
      },
      error: (error) => {
        setError(`Failed to parse CSV: ${error.message}`);
      },
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".csv"],
    },
    maxFiles: 1,
  });

  const handleImport = async () => {
    setStep("importing");
    setError(null);

    let successCount = 0;
    let errorCount = 0;

    for (const row of csvData) {
      try {
        const contactData: any = {
          user_id: userId,
        };

        // Map fields
        Object.entries(mapping).forEach(([csvHeader, field]) => {
          if (field !== "ignore" && row[csvHeader]) {
            contactData[field] = row[csvHeader];
          }
        });

        // Ensure we have at least a name
        if (!contactData.full_name) {
          errorCount++;
          continue;
        }

        // Generate linkedin_id if not provided
        if (!contactData.linkedin_id) {
          contactData.linkedin_id = `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }

        // Insert contact (will skip duplicates due to unique constraints)
        const { error: insertError } = await supabase
          .from("contacts")
          .insert(contactData);

        if (insertError) {
          if (insertError.code === "23505") {
            // Duplicate, skip silently
            continue;
          }
          throw insertError;
        }

        successCount++;
      } catch (err) {
        console.error("Error importing row:", err);
        errorCount++;
      }
    }

    setImportStats({ success: successCount, errors: errorCount });
    setTimeout(() => {
      onComplete();
    }, 2000);
  };

  if (step === "upload") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Import Leads</CardTitle>
          <CardDescription>
            Upload a CSV file with your lead data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            {isDragActive ? (
              <p className="text-lg">Drop the CSV file here</p>
            ) : (
              <>
                <p className="text-lg mb-2">
                  Drag and drop a CSV file here, or click to select
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports LinkedIn exports, Sales Navigator exports, and custom CSV files
                </p>
              </>
            )}
          </div>
          {error && (
            <div className="mt-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (step === "map") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Map Columns</CardTitle>
          <CardDescription>
            Match your CSV columns to contact fields. Found {csvData.length} rows.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {headers.map((header) => (
              <div key={header} className="flex items-center gap-4">
                <div className="flex-1">
                  <Label className="text-sm font-normal">{header}</Label>
                  <p className="text-xs text-muted-foreground truncate">
                    {csvData[0][header]}
                  </p>
                </div>
                <div className="w-48">
                  <Select
                    value={mapping[header]}
                    onValueChange={(value) =>
                      setMapping({ ...mapping, [header]: value as MappingField })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setStep("upload")}>
              Back
            </Button>
            <Button onClick={handleImport} className="flex-1">
              Import {csvData.length} Contacts
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === "importing") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Importing Contacts</CardTitle>
          <CardDescription>
            {importStats.success + importStats.errors === csvData.length
              ? "Import complete!"
              : "Please wait while we import your contacts..."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              <span>{importStats.success} contacts imported successfully</span>
            </div>
            {importStats.errors > 0 && (
              <div className="flex items-center gap-2 text-red-600">
                <X className="h-5 w-5" />
                <span>{importStats.errors} contacts failed to import</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
