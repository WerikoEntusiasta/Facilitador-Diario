import React, { useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, Loader2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { PdfDocument } from '../types';

// Configure pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: PdfDocument | null;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({ isOpen, onClose, document }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen || !document) {
      setPdfDoc(null);
      setCurrentPage(1);
      setTotalPages(0);
      setErrorMsg('');
      return;
    }

    const loadPdf = async () => {
      setIsLoading(true);
      setErrorMsg('');
      try {
        const fileUrl = `/api/documents/${document.id}/file`;
        const loadingTask = pdfjsLib.getDocument({ url: fileUrl });
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
      } catch (err: any) {
        console.error('Erro ao carregar renderizador PDF:', err);
        setErrorMsg('Não foi possível renderizar o arquivo PDF na tela.');
      } finally {
        setIsLoading(false);
      }
    };

    loadPdf();
  }, [isOpen, document]);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let isCancelled = false;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(currentPage);
        if (isCancelled) return;

        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
      } catch (err) {
        console.error('Erro ao desenhar página no canvas:', err);
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, currentPage, scale]);

  if (!isOpen || !document) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-xs">
      <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col h-[92vh] overflow-hidden">
        {/* Header toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-3 truncate max-w-md">
            <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">
              {document.original_name}
            </h3>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {/* Page navigation */}
            {totalPages > 0 && (
              <div className="flex items-center gap-1.5 bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 transition"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="px-2">
                  {currentPage} / {totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 transition"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}

            {/* Zoom */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200">
              <button
                onClick={() => setScale((s) => Math.max(0.6, s - 0.2))}
                className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition"
                title="Reduzir Zoom"
              >
                <ZoomOut size={18} />
              </button>
              <span className="px-1 text-[11px]">{Math.round(scale * 100)}%</span>
              <button
                onClick={() => setScale((s) => Math.min(2.5, s + 0.2))}
                className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition"
                title="Aumentar Zoom"
              >
                <ZoomIn size={18} />
              </button>
            </div>

            {/* Download */}
            <a
              href={`/api/documents/${document.id}/file`}
              download={document.original_name}
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition"
              title="Baixar Arquivo"
            >
              <Download size={18} />
            </a>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Canvas Body */}
        <div className="flex-1 overflow-auto p-4 bg-slate-100 dark:bg-slate-950 flex justify-center items-start">
          {isLoading && (
            <div className="my-auto text-center py-20 text-indigo-600 dark:text-indigo-400 flex flex-col items-center gap-2">
              <Loader2 size={36} className="animate-spin" />
              <span className="text-sm font-semibold">Carregando PDF...</span>
            </div>
          )}

          {errorMsg && (
            <div className="my-auto text-center py-20 text-red-500 max-w-sm mx-auto">
              <p className="text-sm font-semibold">{errorMsg}</p>
              <a
                href={`/api/documents/${document.id}/file`}
                download
                className="inline-block mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
              >
                Baixar Arquivo Diretamente
              </a>
            </div>
          )}

          {!isLoading && !errorMsg && (
            <canvas
              ref={canvasRef}
              className="shadow-xl rounded-xl border border-slate-200 dark:border-slate-800 bg-white"
            />
          )}
        </div>
      </div>
    </div>
  );
};
