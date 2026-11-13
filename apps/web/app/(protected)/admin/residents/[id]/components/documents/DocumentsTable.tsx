"use client";

import React from "react";
import {
  Eye,
  Archive,
  RotateCcw,
  FileText,
  ShieldCheck,
  XCircle,
  FileSpreadsheet,
  Upload,
} from "lucide-react";
import {
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from "@repo/ui/components/ui";
import { DocumentRowItem } from "./types";

interface DocumentsTableProps {
  documents: DocumentRowItem[];
  filterTab: "active" | "archived";
  isRMOrAdmin: boolean;
  onPreview: (doc: DocumentRowItem) => void;
  onArchive: (docId: string) => void;
  onRestore: (docId: string) => void;
  onOpenUpload?: () => void;
  searchTerm: string;
  isRestoring?: boolean;
}

export function DocumentsTable({
  documents,
  filterTab,
  isRMOrAdmin,
  onPreview,
  onArchive,
  onRestore,
  onOpenUpload,
  searchTerm,
  isRestoring = false,
}: DocumentsTableProps) {
  const renderStatusBadge = (status: string) => {
    if (status === "Verified") {
      return (
        <Badge state="success" className="gap-1.5 font-medium">
          <ShieldCheck className="size-3.5 text-emerald-600" /> Verified
        </Badge>
      );
    }
    if (status === "Rejected") {
      return (
        <Badge state="danger" className="gap-1.5 font-medium">
          <XCircle className="size-3.5 text-red-600" /> Rejected
        </Badge>
      );
    }
    if (status === "Archived") {
      return (
        <Badge state="info" className="gap-1.5 font-medium">
          Archived
        </Badge>
      );
    }
    return (
      <Badge state="warning" className="gap-1.5 font-medium">
        Pending Review
      </Badge>
    );
  };

  return (
    <div className="overflow-x-auto">
      <Table className="w-full text-left border-collapse min-w-160">
        <TableHeader>
          <TableRow className="border-b border-border-secondary hover:bg-transparent bg-transparent h-auto">
            <TableHead className="w-12 whitespace-nowrap pl-4 pr-2 font-semibold text-md text-slate-800">#</TableHead>
            <TableHead className="whitespace-nowrap px-4 font-semibold text-md text-slate-800">Document Name &amp; Category</TableHead>
            <TableHead className="w-36 whitespace-nowrap px-4 font-semibold text-md text-slate-800">Status</TableHead>
            <TableHead className="w-40 whitespace-nowrap px-4 font-semibold text-md text-slate-800">Uploaded Date</TableHead>
            <TableHead className="w-44 whitespace-nowrap px-4 pr-6 text-right font-semibold text-md text-slate-800">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-border-secondary/60 text-md font-normal">
          {documents.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="py-12 text-center">
                <div className="flex flex-col items-center justify-center gap-2">
                  <FileSpreadsheet className="size-10 text-slate-300" />
                  <Text size="md" weight="medium" className="text-slate-700">
                    {searchTerm
                      ? "No documents match your search"
                      : filterTab === "archived"
                        ? "No archived documents"
                        : "No active documents added yet"}
                  </Text>
                  <Text size="md" className="text-slate-500 max-w-sm">
                    {searchTerm
                      ? "Try searching for a different keyword or category."
                      : filterTab === "archived"
                        ? "Archived resident documents will be listed here."
                        : "Upload proof of identity, medical records, or consent documents for this resident."}
                  </Text>
                  {!searchTerm && filterTab === "active" && onOpenUpload && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={onOpenUpload}
                      className="mt-2 gap-1.5"
                    >
                      <Upload className="size-3.5" /> Upload First Document
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ) : (
            documents.map((doc, idx) => (
              <TableRow key={doc.id} className="hover:bg-white/60 transition-colors">
                <TableCell className="py-3.5 pl-4 pr-2 w-12">
                  <Text size="md" weight="regular" className="text-slate-500">
                    {idx + 1}
                  </Text>
                </TableCell>

                <TableCell className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full flex items-center justify-center shrink-0 bg-emerald-100 text-surface-primary">
                      <FileText className="size-4 text-emerald-800" />
                    </div>
                    <div>
                      <Text size="md" weight="medium" className="text-slate-800">
                        {doc.name}
                      </Text>
                      <Text size="md" weight="normal" className="text-slate-500">
                        {doc.category}
                      </Text>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="py-3.5 px-4 w-36 whitespace-nowrap">
                  {renderStatusBadge(doc.status)}
                </TableCell>

                <TableCell className="py-3.5 px-4 w-40 whitespace-nowrap">
                  <Text size="md" weight="normal" className="text-slate-600">
                    {doc.uploadedOn}
                  </Text>
                </TableCell>

                <TableCell className="py-3.5 px-4 pr-6 text-right w-44 whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5 text-text-description">
                    {/* Verify Button for RM/Admin (opens preview & verification modal) */}
                    {isRMOrAdmin && doc.status !== "Archived" && (
                      <Button
                        type="button"
                        variant={doc.status === "Verified" ? "ghost" : "outline"}
                        size="sm"
                        title="Open document verification modal"
                        className={
                          doc.status === "Verified"
                            ? "h-7 px-2 "
                            : "h-7 px-2.5 "
                        }
                        onClick={() => onPreview(doc)}
                      >
                        <ShieldCheck className="size-3.5 mr-1 text-emerald-600" />
                        {doc.status === "Verified" ? "Verified" : "Verify"}
                      </Button>
                    )}

                    {/* Secure In-App View */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      title="View Document"
                      className="size-8 text-slate-500 hover:text-slate-900"
                      onClick={() => onPreview(doc)}
                    >
                      <Eye className="size-4" />
                    </Button>

                    {/* Archive instead of Delete (or Restore if in Archived tab) */}
                    {filterTab === "active" ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        title="Archive document"
                        className="size-8 text-amber-600 hover:text-amber-800 hover:bg-amber-50"
                        onClick={() => onArchive(doc.id)}
                      >
                        <Archive className="size-4" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        title="Restore document to active records"
                        disabled={isRestoring}
                        className="h-7 px-2 text-md text-emerald-700 hover:bg-emerald-50 gap-1"
                        onClick={() => onRestore(doc.id)}
                      >
                        <RotateCcw className="size-3.5" /> Restore
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

