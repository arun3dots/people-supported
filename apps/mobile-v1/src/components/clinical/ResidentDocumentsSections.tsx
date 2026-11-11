import React, { useState, useMemo } from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Search, ChevronLeft, ChevronRight, ChevronDown, Upload } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { GET_RESIDENT_DOCUMENTS } from '@repo/endpoints';
import { makeMobileApiCall, getApiBaseUrl } from '../../data/api/client';
import { Text } from '../ui/text';
import { formatBytes } from '../../lib/fileUpload';
import {
  type ResidentDocumentItem,
  RESIDENT_DOCUMENT_CATEGORIES,
} from './residentDocuments.types';
import { ResidentDocumentCard } from './ResidentDocumentCard';
import { ResidentDocumentViewModal } from './ResidentDocumentViewModal';
import { UploadResidentDocumentModal } from './UploadResidentDocumentModal';
import { formatUkDate } from '../../lib/date';
import { theme } from '../../theme';

interface Props {
  residentId?: string;
  residentStatus?: string;
}

export function ResidentDocumentsSections({ residentId, residentStatus }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDoc, setSelectedDoc] = useState<ResidentDocumentItem | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);

  const isRestricted = residentStatus === 'Discharged' || residentStatus === 'Deceased';

  const { data: rawDocuments = [], isLoading } = useQuery<Array<Record<string, unknown>>>({
    queryKey: ['resident-documents', residentId],
    queryFn: async () => {
      if (!residentId) return [];
      const res = await makeMobileApiCall<Array<Record<string, unknown>>>(
        GET_RESIDENT_DOCUMENTS,
        undefined,
        undefined,
        { id: residentId }
      ).catch(() => []);
      return Array.isArray(res) ? res : [];
    },
    enabled: Boolean(residentId),
    staleTime: 1000 * 60 * 5,
  });

  const documents: ResidentDocumentItem[] = useMemo(() => {
    const apiBase = getApiBaseUrl();
    return rawDocuments
      .filter((doc) => doc.status !== 'Archived')
      .map((doc, idx) => {
        const docId = String(doc.id || `doc-${idx}`);
        const docName = String(doc.name || doc.fileName || doc.title || 'Document');
        const mime = typeof doc.fileType === 'string' ? doc.fileType.toLowerCase() : '';
        const ext = docName.split('.').pop()?.toUpperCase() || '';

        const fileType: 'PDF' | 'DOC' | 'IMG' =
          mime.startsWith('image/') || ext === 'JPG' || ext === 'PNG' || ext === 'JPEG' || ext === 'WEBP'
            ? 'IMG'
            : ext === 'DOC' || ext === 'DOCX' || mime.includes('word')
              ? 'DOC'
              : 'PDF';

        const dateStr = doc.createdAt ? formatUkDate(String(doc.createdAt)) : 'Recorded';
        const sizeBytes = typeof doc.fileSize === 'number' ? doc.fileSize : Number(doc.fileSize);

        return {
          id: docId,
          title: docName,
          subtitle: String(doc.category || doc.type || 'General'),
          status: typeof doc.status === 'string' ? doc.status : 'Uploaded',
          isRequired: Boolean(doc.isRequired),
          dateStr,
          fileType,
          mimeType: mime || undefined,
          fileSize: formatBytes(sizeBytes),
          viewUrl: `${apiBase}/documents/${docId}/view`,
          downloadUrl:
            typeof doc.downloadUrl === 'string'
              ? doc.downloadUrl
              : `${apiBase}/documents/${docId}/download`,
        };
      });
  }, [rawDocuments]);

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      if (selectedCategory !== 'All' && doc.subtitle !== selectedCategory) {
        return false;
      }
      const query = searchQuery.trim().toLowerCase();
      if (!query) return true;
      return (
        doc.title.toLowerCase().includes(query) ||
        doc.subtitle.toLowerCase().includes(query)
      );
    });
  }, [documents, searchQuery, selectedCategory]);

  const totalCount = filteredDocuments.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / rowsPerPage));
  const startIndex = (currentPage - 1) * rowsPerPage;
  const displayedDocuments = filteredDocuments.slice(startIndex, startIndex + rowsPerPage);

  const cycleRowsPerPage = () => {
    if (rowsPerPage === 5) setRowsPerPage(10);
    else if (rowsPerPage === 10) setRowsPerPage(20);
    else setRowsPerPage(5);
    setCurrentPage(1);
  };

  return (
    <View className="pb-8">
      {/* 1. Header Title & Upload Action */}
      <View className="flex-row items-center justify-between mb-3.5">
        <View className="flex-1 pr-3">
          <Text className="text-lg font-bold text-foreground">Documents</Text>
          <Text className="text-xs text-muted-foreground mt-0.5">
            View and upload clinical documents for this person supported
          </Text>
        </View>

        {!isRestricted && Boolean(residentId) && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setUploadModalOpen(true)}
            className="bg-primary px-4 py-2 rounded-full flex-row items-center gap-1.5"
          >
            <Upload size={14} color="#FFFFFF" strokeWidth={2.4} />
            <Text className="text-xs font-bold text-white">Upload</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 2. Search Input */}
      <View className="bg-surface rounded-xl px-3.5 h-11 flex-row items-center gap-2.5 mb-2.5">
        <Search size={18} color="#8E8E93" />
        <TextInput
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            setCurrentPage(1);
          }}
          placeholder="Search Document"
          placeholderTextColor="#8E8E93"
          style={{ fontFamily: theme.fonts.regular }}
          className="flex-1 text-md text-foreground h-full"
        />
      </View>

      {/* 3. Category Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-3.5"
        contentContainerStyle={{ gap: 6 }}
      >
        {(['All', ...RESIDENT_DOCUMENT_CATEGORIES] as const).map((cat) => {
          const active = selectedCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              onPress={() => {
                setSelectedCategory(cat);
                setCurrentPage(1);
              }}
              activeOpacity={0.75}
              className={`px-3.5 py-1.5 rounded-full ${
                active ? 'bg-primary' : 'bg-surface'
              }`}
            >
              <Text className={`text-xs font-semibold ${active ? 'text-white' : 'text-muted-foreground'}`}>
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 4. Document Cards List */}
      {isLoading ? (
        <View className="py-12 items-center justify-center">
          <ActivityIndicator size="small" color="#4A706A" />
        </View>
      ) : displayedDocuments.length > 0 ? (
        displayedDocuments.map((doc, idx) => (
          <ResidentDocumentCard
            key={`${doc.id}-${idx}`}
            item={doc}
            onViewPress={() => setSelectedDoc(doc)}
          />
        ))
      ) : (
        <View className="bg-surface rounded-2xl p-8 items-center justify-center my-2">
          <Text className="text-md font-semibold text-foreground">No documents found</Text>
          <Text className="text-xs text-muted-foreground mt-1 text-center">
            {searchQuery || selectedCategory !== 'All'
              ? 'Try adjusting your search or category filter'
              : 'No clinical documents uploaded for this person supported yet'}
          </Text>
        </View>
      )}

      {/* 5. Pagination Section */}
      {totalCount > 0 && (
        <View className="mt-4 pt-3 items-center">
          <Text className="text-xs text-muted-foreground text-center mb-2.5">
            Showing {String(displayedDocuments.length).padStart(2, '0')} of {String(totalCount).padStart(2, '0')}
          </Text>

          <View className="flex-row items-center justify-center gap-1.5 mb-3">
            <TouchableOpacity
              onPress={() => currentPage > 1 && setCurrentPage((p) => p - 1)}
              disabled={currentPage === 1}
              className="w-8 h-8 rounded-full items-center justify-center bg-surface"
            >
              <ChevronLeft size={14} color={currentPage === 1 ? '#CBD5E1' : '#5D5D5D'} />
            </TouchableOpacity>

            <View className="px-3 py-1 bg-primary rounded-full">
              <Text className="text-xs font-semibold text-white">
                Page {currentPage} of {totalPages}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => currentPage < totalPages && setCurrentPage((p) => p + 1)}
              disabled={currentPage === totalPages}
              className="w-8 h-8 rounded-full items-center justify-center bg-surface"
            >
              <ChevronRight size={14} color={currentPage === totalPages ? '#CBD5E1' : '#5D5D5D'} />
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center justify-center gap-2">
            <Text className="text-xs text-muted-foreground">Rows per page</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={cycleRowsPerPage}
              className="bg-surface rounded-full px-3 py-1 flex-row items-center gap-1.5"
            >
              <Text className="text-xs font-semibold text-foreground">
                {String(rowsPerPage).padStart(2, '0')}
              </Text>
              <ChevronDown size={12} color="#5D5D5D" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 6. Document Viewer Modal */}
      <ResidentDocumentViewModal
        document={selectedDoc}
        onClose={() => setSelectedDoc(null)}
      />

      {/* 7. Upload Resident Document Modal */}
      {residentId && (
        <UploadResidentDocumentModal
          visible={uploadModalOpen}
          residentId={residentId}
          onClose={() => setUploadModalOpen(false)}
        />
      )}
    </View>
  );
}
