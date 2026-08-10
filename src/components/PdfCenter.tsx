import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  Upload,
  Search,
  Eye,
  Download,
  Trash2,
  FileText,
  Kanban,
  Filter,
  Loader2,
} from 'lucide-react';
import { PdfDocument } from '../types';
import { apiGetDocuments, apiUploadDocument, apiDeleteDocument } from '../lib/api';
import { PdfViewerModal } from './PdfViewerModal';

export const PdfCenter: React.FC = () => {
  const [documents, setDocuments] = useState<PdfDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState<'all' | 'upload' | 'note_export' | 'kanban_export'>('all');
  const [selectedDoc, setSelectedDoc] = useState<PdfDocument | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const data = await apiGetDocuments();
      setDocuments(data);
    } catch (err) {
      console.error('Erro ao carregar documentos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      await apiUploadDocument(files[0]);
      await loadDocuments();
    } catch (err: any) {
      alert(err.message || 'Erro ao enviar arquivo PDF');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`Excluir permanentemente o documento "${name}"?`)) {
      try {
        await apiDeleteDocument(id);
        setDocuments(documents.filter((d) => d.id !== id));
      } catch (err) {
        console.error('Erro ao deletar documento:', err);
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const filteredDocs = documents.filter((doc) => {
    if (filterSource !== 'all' && doc.source_type !== filterSource) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    return doc.original_name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <FileCheck size={26} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Central de Documentos PDF
            </h2>
            <p className="text-xs text-slate-500">
              Gerencie seus PDFs importados e relatórios gerados a partir do Keep e Kanban
            </p>
          </div>
        </div>

        {/* Upload Button */}
        <label className="cursor-pointer px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition flex items-center gap-2">
          {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
          <span>{isUploading ? 'Enviando PDF...' : 'Importar PDF'}</span>
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isUploading}
          />
        </label>
      </div>

      {/* Search & Source Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setFilterSource('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filterSource === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Todos ({documents.length})
          </button>
          <button
            onClick={() => setFilterSource('upload')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filterSource === 'upload'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Uploads ({documents.filter((d) => d.source_type === 'upload').length})
          </button>
          <button
            onClick={() => setFilterSource('note_export')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filterSource === 'note_export'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Exportações Notas ({documents.filter((d) => d.source_type === 'note_export').length})
          </button>
          <button
            onClick={() => setFilterSource('kanban_export')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filterSource === 'kanban_export'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Exportações Kanban ({documents.filter((d) => d.source_type === 'kanban_export').length})
          </button>
        </div>

        {/* Local Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar por nome do PDF..."
            className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-xl text-xs border border-transparent outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* PDF Files Grid */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-400">
          <Loader2 size={32} className="animate-spin mx-auto mb-2 text-indigo-600" />
          Carregando documentos...
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
          <FileCheck size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
            Nenhum documento PDF encontrado
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Importe arquivos PDF ou exporte suas notas e quadros Kanban para visualizá-los aqui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDocs.map((doc) => {
            const getSourceBadge = () => {
              if (doc.source_type === 'note_export') {
                return (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    <FileText size={10} /> Nota
                  </span>
                );
              }
              if (doc.source_type === 'kanban_export') {
                return (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                    <Kanban size={10} /> Kanban
                  </span>
                );
              }
              return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <Upload size={10} /> Importado
                </span>
              );
            };

            return (
              <div
                key={doc.id}
                className="group bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    {getSourceBadge()}
                    <span className="text-[11px] font-semibold text-slate-400">
                      {formatFileSize(doc.file_size)}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug line-clamp-2 break-words mb-2">
                    {doc.original_name}
                  </h3>

                  <p className="text-[11px] text-slate-400">
                    {new Date(doc.created_at).toLocaleDateString('pt-BR')} às{' '}
                    {new Date(doc.created_at).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1">
                  <button
                    onClick={() => setSelectedDoc(doc)}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <Eye size={15} />
                    <span>Visualizar</span>
                  </button>

                  <a
                    href={`/api/documents/${doc.id}/file`}
                    download={doc.original_name}
                    className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Baixar PDF"
                  >
                    <Download size={16} />
                  </a>

                  <button
                    onClick={() => handleDelete(doc.id, doc.original_name)}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                    title="Excluir PDF"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Built-in Canvas Viewer Modal */}
      <PdfViewerModal
        isOpen={Boolean(selectedDoc)}
        onClose={() => setSelectedDoc(null)}
        document={selectedDoc}
      />
    </div>
  );
};
