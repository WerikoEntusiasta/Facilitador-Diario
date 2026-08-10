import { jsPDF } from 'jspdf';
import { Note, KanbanBoard } from '../types';
import { apiSaveGeneratedPdf } from './api';

/**
 * Generates a formatted PDF for a Note (Keep style)
 */
export async function exportNoteToPdf(note: Note, saveToCentral = true): Promise<void> {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header Banner
  doc.setFillColor(63, 81, 181); // Indigo Primary
  doc.rect(0, 0, pageWidth, 15, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('KeepBoard - Relatório de Nota', 15, 10);
  
  doc.setFont('helvetica', 'normal');
  doc.text(new Date().toLocaleDateString('pt-BR'), pageWidth - 15, 10, { align: 'right' });

  // Note Title
  y += 10;
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  const titleText = note.title || 'Nota sem título';
  const splitTitle = doc.splitTextToSize(titleText, pageWidth - 30);
  doc.text(splitTitle, 15, y);
  y += splitTitle.length * 8 + 4;

  // Metadata (Dates, Reminder, Labels)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);

  let metaText = `Criada em: ${new Date(note.created_at).toLocaleDateString('pt-BR')}`;
  if (note.reminder_date) {
    metaText += ` | Lembrete: ${new Date(note.reminder_date).toLocaleString('pt-BR')}`;
  }
  doc.text(metaText, 15, y);
  y += 6;

  if (note.labels && note.labels.length > 0) {
    const labelsStr = 'Etiquetas: ' + note.labels.map((l) => l.name).join(', ');
    doc.text(labelsStr, 15, y);
    y += 8;
  } else {
    y += 4;
  }

  // Divider line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(15, y, pageWidth - 15, y);
  y += 10;

  // Note Content
  if (note.content && note.content.trim().length > 0) {
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');

    const splitContent = doc.splitTextToSize(note.content, pageWidth - 30);
    doc.text(splitContent, 15, y);
    y += splitContent.length * 6 + 10;
  }

  // Note Checklist
  if (note.checklist && note.checklist.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Lista de Tarefas:', 15, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    for (const item of note.checklist) {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      const statusBox = item.completed ? '[X]' : '[  ]';
      doc.setTextColor(item.completed ? 100 : 30, item.completed ? 116 : 41, item.completed ? 139 : 59);
      
      const itemLine = `${statusBox} ${item.text}`;
      const splitItem = doc.splitTextToSize(itemLine, pageWidth - 35);
      doc.text(splitItem, 18, y);
      y += splitItem.length * 5 + 3;
    }
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Documento gerado automaticamente pelo KeepBoard', pageWidth / 2, 287, { align: 'center' });

  // Download locally
  const safeFilename = (note.title || 'nota').toLowerCase().replace(/[^a-z0-9]/g, '_') + '.pdf';
  doc.save(safeFilename);

  // Optionally save to Document Center in backend
  if (saveToCentral) {
    try {
      const base64Pdf = doc.output('datauristring');
      await apiSaveGeneratedPdf(note.title || 'Nota Exportada', base64Pdf, 'note_export');
    } catch (err) {
      console.error('Erro ao salvar no centro de documentos:', err);
    }
  }
}

/**
 * Generates a formatted PDF report for a Kanban Board
 */
export async function exportBoardToPdf(board: KanbanBoard, saveToCentral = true): Promise<void> {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header Banner
  doc.setFillColor(30, 58, 138); // Dark Blue
  doc.rect(0, 0, pageWidth, 15, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('KeepBoard - Relatório de Quadro Kanban', 15, 10);
  doc.text(new Date().toLocaleDateString('pt-BR'), pageWidth - 15, 10, { align: 'right' });

  // Board Title & Description
  y += 10;
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(board.title, 15, y);
  y += 8;

  if (board.description) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    const splitDesc = doc.splitTextToSize(board.description, pageWidth - 30);
    doc.text(splitDesc, 15, y);
    y += splitDesc.length * 5 + 4;
  }

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(15, y, pageWidth - 15, y);
  y += 8;

  if (!board.columns || board.columns.length === 0) {
    doc.setFontSize(11);
    doc.setTextColor(148, 163, 184);
    doc.text('Este quadro não possui colunas.', 15, y);
  } else {
    for (const col of board.columns) {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      // Column Header Box
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(15, y, pageWidth - 30, 8, 2, 2, 'F');
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(`${col.title} (${col.cards ? col.cards.length : 0} cartões)`, 18, y + 5.5);
      y += 12;

      if (!col.cards || col.cards.length === 0) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(148, 163, 184);
        doc.text('  Nenhum cartão nesta coluna.', 18, y);
        y += 8;
      } else {
        for (const card of col.cards) {
          if (y > 260) {
            doc.addPage();
            y = 20;
          }

          // Card Box
          doc.setDrawColor(203, 213, 225);
          doc.setFillColor(255, 255, 255);
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(15, 23, 42);

          const cardTitleText = `• ${card.title}`;
          doc.text(cardTitleText, 20, y);
          y += 5;

          // Badges / Priority
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139);

          let detailsLine = `Prioridade: ${card.priority || 'Média'}`;
          if (card.due_date) {
            detailsLine += ` | Prazo: ${new Date(card.due_date).toLocaleDateString('pt-BR')}`;
          }
          if (card.checklist && card.checklist.length > 0) {
            const doneCount = card.checklist.filter((c) => c.completed).length;
            detailsLine += ` | Checklists: ${doneCount}/${card.checklist.length}`;
          }
          doc.text(detailsLine, 22, y);
          y += 5;

          if (card.description) {
            doc.setFontSize(8.5);
            doc.setTextColor(71, 85, 105);
            const splitCardDesc = doc.splitTextToSize(card.description, pageWidth - 45);
            doc.text(splitCardDesc, 22, y);
            y += splitCardDesc.length * 4.5;
          }

          y += 4;
        }
      }

      y += 4;
    }
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Relatório de Quadro gerado pelo KeepBoard', pageWidth / 2, 287, { align: 'center' });

  // Download locally
  const safeFilename = board.title.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_kanban.pdf';
  doc.save(safeFilename);

  // Save to backend Document Center
  if (saveToCentral) {
    try {
      const base64Pdf = doc.output('datauristring');
      await apiSaveGeneratedPdf(`Quadro - ${board.title}`, base64Pdf, 'kanban_export');
    } catch (err) {
      console.error('Erro ao salvar quadro em PDF no servidor:', err);
    }
  }
}
