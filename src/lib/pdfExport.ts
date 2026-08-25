import { jsPDF } from 'jspdf';
import { Note, KanbanBoard, WorkoutRoutine } from '../types';
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

/**
 * Generates a formatted, complete PDF report for a Workout Routine (Ficha de Treino Semanal)
 */
export async function exportWorkoutToPdf(workout: WorkoutRoutine, saveToCentral = true): Promise<void> {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 20;

  // Header Banner - Emerald Theme
  doc.setFillColor(16, 185, 129); // Emerald 500
  doc.rect(0, 0, pageWidth, 16, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('KeepFlow Academia - Ficha de Treino Semanal', 15, 10.5);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date().toLocaleDateString('pt-BR'), pageWidth - 15, 10.5, { align: 'right' });

  // Routine Title
  y += 10;
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  const splitTitle = doc.splitTextToSize(workout.title || 'Ficha de Treino', pageWidth - 30);
  doc.text(splitTitle, 15, y);
  y += splitTitle.length * 7 + 3;

  // Description / Subtitle
  if (workout.description && workout.description.trim()) {
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139); // Slate 500
    const splitDesc = doc.splitTextToSize(workout.description, pageWidth - 30);
    doc.text(splitDesc, 15, y);
    y += splitDesc.length * 5 + 3;
  }

  // Divider Line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(15, y, pageWidth - 15, y);
  y += 8;

  // Iterate over each workout day
  if (!workout.days || workout.days.length === 0) {
    doc.setFontSize(11);
    doc.setTextColor(148, 163, 184);
    doc.text('Nenhum dia de treino cadastrado nesta ficha.', 15, y);
  } else {
    for (const day of workout.days) {
      // Check if we need a new page for the day header
      if (y > pageHeight - 40) {
        doc.addPage();
        y = 20;
      }

      // Day Box Header
      doc.setFillColor(240, 253, 244); // Emerald 50
      doc.setDrawColor(187, 247, 208); // Emerald 200
      doc.roundedRect(15, y, pageWidth - 30, 8, 2, 2, 'FD');

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(6, 95, 70); // Emerald 800

      const subtitleText = day.subtitle ? ` - ${day.subtitle}` : '';
      const restText = day.is_rest_day ? ' [Descanso / Rest Day]' : '';
      doc.text(`${day.day_name}${subtitleText}${restText}`, 18, y + 5.5);
      y += 12;

      if (day.is_rest_day) {
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 116, 139);
        doc.text('  Dia dedicado para regeneração muscular, mobilidade e descanso.', 18, y);
        y += 8;
      } else if (!day.exercises || day.exercises.length === 0) {
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(148, 163, 184);
        doc.text('  Nenhum exercício cadastrado para este dia.', 18, y);
        y += 8;
      } else {
        for (let i = 0; i < day.exercises.length; i++) {
          const ex = day.exercises[i];

          // Check if we need a page break for the exercise item
          if (y > pageHeight - 35) {
            doc.addPage();
            y = 20;
          }

          // Exercise Card Container
          doc.setDrawColor(226, 232, 240);
          doc.setFillColor(255, 255, 255);
          
          // Exercise Name
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(15, 23, 42);
          doc.text(`${i + 1}. ${ex.name}`, 18, y);
          y += 4.5;

          // Sets, Reps, Weight
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(71, 85, 105);

          let paramsLine = `Séries: ${ex.sets || '4'} | Repetições: ${ex.reps || '10-12'}`;
          if (ex.weight && ex.weight.trim()) {
            paramsLine += ` | Carga: ${ex.weight}`;
          }
          doc.text(paramsLine, 22, y);
          y += 4.5;

          // Notes / Tips
          if (ex.notes && ex.notes.trim()) {
            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(100, 116, 139);
            const splitNotes = doc.splitTextToSize(`Obs: ${ex.notes}`, pageWidth - 45);
            doc.text(splitNotes, 22, y);
            y += splitNotes.length * 4;
          }

          y += 3;
        }
      }

      y += 4;
    }
  }

  // Footer on all pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(
      `KeepFlow Treinos • Ficha gerada para impressão e consulta • Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  // Download locally
  const safeFilename = (workout.title || 'treino')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_') + '_ficha.pdf';

  doc.save(safeFilename);

  // Save to backend Document Center
  if (saveToCentral) {
    try {
      const base64Pdf = doc.output('datauristring');
      await apiSaveGeneratedPdf(`Ficha de Treino - ${workout.title}`, base64Pdf, 'workout_export');
    } catch (err) {
      console.error('Erro ao salvar ficha de treino em PDF no servidor:', err);
    }
  }
}

