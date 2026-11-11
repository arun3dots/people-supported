"use client";

import React, { useState, useCallback } from "react";
import {
  FileText,
  UploadCloud,
  Trash2,
  Eye,
  Download,
  Search,
  Filter,
  File,
  MoreVertical,
  Loader2,
  CheckCircle2,
  X,
  FileIcon,
  FileType,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
  Input,
  Label,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  toast,
} from "@repo/ui/components/ui";
import { usePagination } from "@repo/ui/hooks";
import { Pagination } from "@repo/ui/components/ui/Pagination";
import { format } from "date-fns";
import {
  useGetResidentDocumentsQuery,
  useUploadDocumentMutation,
  useDeleteDocumentMutation,
} from "../../../lib/queries/residents";

interface DocumentsTabProps {
  residentId: string;
}

const CATEGORIES = [
  "General",
  "Clinical",
  "Legal",
  "Identification",
  "Care Plan",
  "Other",
];

export function DocumentsTab({ residentId }: DocumentsTabProps) {
  const { data: documents, isLoading } =
    useGetResidentDocumentsQuery(residentId);
  const uploadDocument = useUploadDocumentMutation();
  const deleteDocument = useDeleteDocumentMutation();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState("General");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const filteredDocuments = documents?.filter((doc) => {
    const matchesSearch = doc.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const {
    currentPage,
    pageSize,
    paginatedData: paginatedDocuments,
    totalRecords,
    handlePageChange,
    handleLimitChange,
  } = usePagination(filteredDocuments);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Document must be smaller than 10MB.",
          variant: "destructive",
        });
        e.target.value = "";
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(30);

    try {
      await uploadDocument.mutateAsync({
        residentId,
        file: selectedFile,
        category: uploadCategory,
      });

      setUploadProgress(100);
      setTimeout(() => {
        setIsUploadModalOpen(false);
        setSelectedFile(null);
        setUploadProgress(0);
        setIsUploading(false);
      }, 500);
    } catch (error) {
      console.error("Upload error:", error);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (docId: string) => {
    setIsDeleting(docId);
    try {
      await deleteDocument.mutateAsync({ documentId: docId, residentId });
    } finally {
      setIsDeleting(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.includes("pdf"))
      return <FileText className="w-8 h-8 text-red-500" />;
    if (type.includes("image"))
      return <FileIcon className="w-8 h-8 text-blue-500" />;
    if (type.includes("word") || type.includes("officedocument"))
      return <FileText className="w-8 h-8 text-blue-600" />;
    return <File className="w-8 h-8 text-gray-500" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Documents</h2>
          <p className="text-muted-foreground">
            Manage resident files and documentation securely.
          </p>
        </div>
        <Button
          onClick={() => setIsUploadModalOpen(true)}
          className="gap-2 rounded-xl shadow-lg shadow-primary/20"
        >
          <UploadCloud className="w-4 h-4" /> Upload Document
        </Button>
      </div>

      <Card className="border-border/50 shadow-sm overflow-hidden rounded-2xl">
        <CardHeader className="bg-muted/10 pb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                className="pl-10 rounded-xl border-border/50 bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-[180px] rounded-xl border-border/50 bg-white">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="All">All Categories</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {paginatedDocuments && paginatedDocuments.length > 0 ? (
              paginatedDocuments.map((doc: any) => (
                <div
                  key={doc.id}
                  className="p-4 hover:bg-muted/5 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-muted/20 rounded-xl">
                        {getFileIcon(doc.fileType)}
                      </div>
                      <div>
                        <h4
                          className="font-bold text-foreground group-hover:text-primary transition-colors cursor-pointer"
                          onClick={() => window.open(doc.viewUrl, "_blank")}
                        >
                          {doc.name}
                        </h4>
                        <div className="flex items-center gap-3 text-md text-muted-foreground mt-1">
                          <Badge
                            variant="outline"
                            className="text-[10px] rounded-full px-2 py-0 border-border/50"
                          >
                            {doc.category}
                          </Badge>
                          <span>•</span>
                          <span>{formatFileSize(doc.fileSize)}</span>
                          <span>•</span>
                          <span>
                            {format(new Date(doc.createdAt), "MMM d, yyyy")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-xl"
                        onClick={() => window.open(doc.viewUrl, "_blank")}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-xl"
                        onClick={() => window.open(doc.viewUrl, "_blank")}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-xl"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive gap-2 cursor-pointer"
                            onClick={() => handleDelete(doc.id)}
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground text-center">
                <File className="w-12 h-12 mb-4 opacity-10" />
                <p className="font-medium">No documents found</p>
                <p className="text-md">Upload a new document to get started.</p>
              </div>
            )}
          </div>
          <div className="p-4 border-t border-border/50">
            <Pagination
              pageNumber={currentPage}
              pageSize={pageSize}
              totalRecords={totalRecords}
              limit={pageSize.toString()}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Upload Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Upload Document
            </DialogTitle>
            <DialogDescription className="text-base pt-1">
              Select a file to upload and assign it to a category.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-6">
            {!selectedFile ? (
              <div
                className="border-2 border-dashed border-border/50 rounded-2xl p-10 flex flex-col items-center justify-center gap-3 bg-muted/5 hover:bg-muted/10 transition-colors cursor-pointer"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <div className="p-4 bg-primary/10 rounded-full text-primary">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <p className="font-bold">Click to upload or drag and drop</p>
                  <p className="text-md text-muted-foreground mt-1">
                    PDF, DOCX, PNG, JPG (up to 10MB)
                  </p>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            ) : (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getFileIcon(selectedFile.type)}
                  <div>
                    <p className="font-bold text-md truncate max-w-[200px]">
                      {selectedFile.name}
                    </p>
                    <p className="text-md text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedFile(null)}
                  className="h-8 w-8 rounded-full"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <Label
                htmlFor="category"
                className="text-md font-bold uppercase tracking-wider ml-1 text-muted-foreground"
              >
                Category
              </Label>
              <Select value={uploadCategory} onValueChange={setUploadCategory}>
                <SelectTrigger
                  id="category"
                  className="rounded-xl h-12 border-border/50 bg-muted/20"
                >
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-md">
                  <span className="font-medium">Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <progress
                  value={uploadProgress}
                  max={100}
                  className="h-2 rounded-full"
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-3 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setIsUploadModalOpen(false)}
              disabled={isUploading}
              className="rounded-xl font-bold h-12 px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="rounded-xl bg-primary hover:bg-primary/90 h-12 px-10 font-bold shadow-lg shadow-primary/20"
            >
              {isUploading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                </span>
              ) : (
                "Upload Now"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
